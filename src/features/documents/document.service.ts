import { supabase } from '../../lib/supabase';
import type { DocumentInput, DocumentItemInput, DocumentType, Platform } from '../../types/document';
import { formatDateVN, toISODate } from '../../lib/date';

export interface SupabaseOperationError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

export interface SavedDocument extends DocumentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa interface nội bộ để đảm bảo Type Safety khi hứng dữ liệu từ Supabase (bypass lỗi 'never')
interface DocumentRow {
  id: string;
  platform: string;
  type: string;
  document_date: string;
  created_at: string;
  updated_at: string;
}

interface DocumentItemRow {
  order_code: string;
  product_name: string;
  sku: string;
  unit: string;
  variant: string | null;
  quantity: number;
  sale_price: number | null;
  settlement_amount: number | null;
  cost_price: number | null;
}

function toSupabaseError(error: unknown): SupabaseOperationError {
  if (error instanceof Error) return error as SupabaseOperationError;

  const candidate = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  } | null;

  const normalized = new Error(
      typeof candidate?.message === 'string' ? candidate.message : 'Không thể thao tác với phiếu trong Supabase.',
  ) as SupabaseOperationError;

  if (typeof candidate?.code === 'string') normalized.code = candidate.code;
  if (typeof candidate?.details === 'string') normalized.details = candidate.details;
  if (typeof candidate?.hint === 'string') normalized.hint = candidate.hint;
  return normalized;
}

export function getDocumentSaveErrorMessage(error: unknown): string {
  const normalized = toSupabaseError(error);
  const code = normalized.code ?? '';
  const message = normalized.message || 'Không thể lưu phiếu vào Supabase.';

  if (code === '42883' || /could not find the function|function .* does not exist/i.test(message)) {
    return 'Supabase chưa có hàm xử lý phiếu. Hãy chạy lại toàn bộ supabase/schema.sql trong SQL Editor rồi thử lại.';
  }

  if (code === '42501' || /permission denied|not enough privileges/i.test(message)) {
    return 'Supabase từ chối quyền thực thi. Hãy kiểm tra GRANT EXECUTE trong supabase/schema.sql.';
  }

  if (/FORBIDDEN/i.test(message)) {
    return 'Phiên đăng nhập không được nhận diện là ADMIN. Hãy đăng xuất/đăng nhập lại bằng admin@gmail.com.';
  }

  const extra = [
    normalized.code && `code=${normalized.code}`,
    normalized.details && `details=${normalized.details}`,
    normalized.hint && `hint=${normalized.hint}`,
  ]
      .filter(Boolean)
      .join(' · ');

  return extra ? `${message} (${extra})` : message;
}

function buildPayload(input: DocumentInput) {
  return {
    platform: input.platform,
    type: input.type,
    document_date: toISODate(input.documentDate),
  };
}

function buildItems(input: DocumentInput) {
  return input.items.map((item) => ({
    order_code: item.orderCode.trim(),
    product_name: item.productName.trim(),
    sku: item.sku.trim(),
    unit: item.unit.trim(),
    variant: item.variant.trim(),
    quantity: item.quantity,
    sale_price: item.salePrice,
    settlement_amount: item.settlementAmount,
    cost_price: item.costPrice,
  }));
}

async function saveOrderSettlements(input: DocumentInput) {
  if (input.type !== 'outbound') return;
  const seen = new Set<string>();
  const payouts = input.items.flatMap((item) => {
    const orderCode = item.orderCode.trim();
    if (!orderCode || seen.has(orderCode)) return [];
    seen.add(orderCode);
    return [{
      platform: input.platform,
      order_code: orderCode,
      payout_amount: Math.max(0, Number(item.settlementAmount) || 0),
      payout_kind: 'actual',
      source_file: null,
    }];
  });
  if (!payouts.length) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('marketplace_order_settlements')
    .upsert(payouts, { onConflict: 'platform,order_code' });
  if (error) throw toSupabaseError(error);
}

export async function createDocument(input: DocumentInput) {
  // Ép kiểu supabase sang any ở bước gọi để vượt qua strict check của TypeScript khi thiếu type RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_warehouse_document', {
    p_document: buildPayload(input),
    p_items: buildItems(input),
  });

  if (error) {
    console.error('[Warehouse] create_warehouse_document failed', error);
    throw toSupabaseError(error);
  }

  if (!data) throw new Error('Supabase không trả về ID phiếu sau khi lưu.');
  await saveOrderSettlements(input);
  return data as string;
}

export async function updateDocument(documentId: string, input: DocumentInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('update_warehouse_document', {
    p_document_id: documentId,
    p_document: buildPayload(input),
    p_items: buildItems(input),
  });

  if (error) {
    console.error('[Warehouse] update_warehouse_document failed', error);
    throw toSupabaseError(error);
  }

  if (!data) throw new Error('Supabase không trả về ID phiếu sau khi cập nhật.');
  await saveOrderSettlements(input);
  return data as string;
}

export async function fetchDocument(documentId: string): Promise<SavedDocument> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: documentError } = await (supabase as any)
      .from('warehouse_documents')
      .select('id, platform, type, document_date, created_at, updated_at')
      .eq('id', documentId)
      .single();

  if (documentError) throw toSupabaseError(documentError);

  // Ép dữ liệu trả về theo Interface cục bộ để giữ Type Safety
  const document = data as DocumentRow;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawItems, error: itemError } = await (supabase as any)
      .from('warehouse_document_items')
      .select('order_code, product_name, sku, unit, variant, quantity, sale_price, settlement_amount, cost_price')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

  if (itemError) throw toSupabaseError(itemError);
  const itemRows = (rawItems ?? []) as DocumentItemRow[];
  const platform = document.platform as Platform;
  const type = document.type as DocumentType;
  const orderCodes = [...new Set(itemRows.map((item) => item.order_code.trim()).filter(Boolean))];
  let payoutByOrder = new Map<string, number>();
  if (type === 'outbound' && orderCodes.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payouts, error: payoutError } = await (supabase as any)
      .from('marketplace_order_settlements')
      .select('order_code, payout_amount')
      .eq('platform', platform)
      .in('order_code', orderCodes);
    if (payoutError) throw toSupabaseError(payoutError);
    payoutByOrder = new Map((payouts ?? []).map((row: { order_code: string; payout_amount: number }) => [
      row.order_code.trim(), Number(row.payout_amount ?? 0),
    ]));
  }
  const seenOrderCodes = new Set<string>();
  const items = itemRows.map((item) => {
    const code = item.order_code.trim();
    const isFirstOrderLine = !code || !seenOrderCodes.has(code);
    if (code) seenOrderCodes.add(code);
    return {
      orderCode: item.order_code,
      productName: item.product_name,
      sku: item.sku,
      unit: item.unit,
      variant: item.variant ?? '',
      quantity: item.quantity,
      salePrice: Number(item.sale_price ?? 0),
      settlementAmount: isFirstOrderLine
        ? (payoutByOrder.get(code) ?? Number(item.settlement_amount ?? 0))
        : 0,
      costPrice: Number(item.cost_price ?? 0),
    } as DocumentItemInput;
  });

  return {
    id: document.id,
    platform,
    type,
    documentDate: formatDateVN(document.document_date),
    items,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
  };
}