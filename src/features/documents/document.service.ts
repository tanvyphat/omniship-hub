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
  }));
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
      .select('order_code, product_name, sku, unit, variant, quantity')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

  if (itemError) throw toSupabaseError(itemError);
  const items = (rawItems ?? []) as DocumentItemRow[];

  return {
    id: document.id,
    platform: document.platform as Platform,
    type: document.type as DocumentType,
    documentDate: formatDateVN(document.document_date),
    items: items.map((item) => ({
      orderCode: item.order_code,
      productName: item.product_name,
      sku: item.sku,
      unit: item.unit,
      variant: item.variant ?? '',
      quantity: item.quantity,
    } as DocumentItemInput)),
    createdAt: document.created_at,
    updatedAt: document.updated_at,
  };
}