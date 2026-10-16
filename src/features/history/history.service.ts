import { supabase } from '../../lib/supabase';
import { calculateProductSettlements } from '../../lib/settlement';
import type { DocumentHistoryItem, DocumentItemInput, DocumentType, Platform } from '../../types/document';

export interface HistoryFilters {
  type: 'all' | DocumentType;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  platform: Platform;
  allowedTypes?: DocumentType[];
}

interface HistoryDocumentRow { id: string; platform: Platform; type: DocumentType; document_date: string; created_at: string; }
interface HistoryItemRow {
  document_id: string;
  order_code: string;
  quantity: number;
  product_name: string;
  sku: string;
  unit: string;
  variant: string | null;
  order_settlement_amount: number | null;
  sale_price: number | null;
  minimum_settlement: number | null;
}

export async function fetchHistory(filters: HistoryFilters) {
  const from = filters.from || null;
  const to = filters.to || null;
  const allowedTypes = filters.allowedTypes ?? ['outbound', 'return'];
  if (allowedTypes.length === 0) return { rows: [], count: 0 };
  if (filters.type !== 'all' && !allowedTypes.includes(filters.type)) return { rows: [], count: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('warehouse_documents')
    .select('id, platform, type, document_date, created_at', { count: 'exact' })
    .eq('platform', filters.platform)
    .order('document_date', { ascending: false })
    .order('type', { ascending: true })
    .order('created_at', { ascending: false });

  if (filters.type !== 'all') query = query.eq('type', filters.type);
  else if (allowedTypes.length === 1) query = query.eq('type', allowedTypes[0]);
  else query = query.in('type', allowedTypes);
  if (from) query = query.gte('document_date', from);
  if (to) query = query.lte('document_date', to);

  const fromIndex = filters.page * filters.pageSize;
  const toIndex = fromIndex + filters.pageSize - 1;
  const { data: rawDocuments, error: documentError, count } = await query.range(fromIndex, toIndex);
  if (documentError) throw documentError;
  const documents = (rawDocuments ?? []) as HistoryDocumentRow[];
  const ids = documents.map((document) => document.id);
  if (ids.length === 0) return { rows: [], count: count ?? 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawItems, error: itemError } = await (supabase as any).from('warehouse_document_items')
    .select('document_id, order_code, quantity, product_name, sku, unit, variant, order_settlement_amount, sale_price, minimum_settlement')
    .in('document_id', ids);
  if (itemError) throw itemError;
  const items = (rawItems ?? []) as HistoryItemRow[];

  const stats = new Map<string, { itemCount: number; totalQuantity: number; orderCodes: Set<string>; items: DocumentItemInput[] }>();
  for (const item of items) {
    const current = stats.get(item.document_id) ?? { itemCount: 0, totalQuantity: 0, orderCodes: new Set<string>(), items: [] };
    current.itemCount += 1;
    current.totalQuantity += item.quantity;
    if (item.order_code) current.orderCodes.add(item.order_code);
    current.items.push({
      orderCode: item.order_code,
      productName: item.product_name,
      sku: item.sku,
      unit: item.unit,
      variant: item.variant ?? '',
      quantity: item.quantity,
      orderSettlementAmount: item.order_settlement_amount,
      salePrice: item.sale_price,
      minimumSettlement: item.minimum_settlement,
    });
    stats.set(item.document_id, current);
  }

  const rows: DocumentHistoryItem[] = documents.map((row) => {
    const summary = stats.get(row.id) ?? { itemCount: 0, totalQuantity: 0, orderCodes: new Set<string>(), items: [] };
    const groups = new Map<string, DocumentItemInput[]>();
    summary.items.forEach((item, index) => {
      const key = item.orderCode.trim() || `__missing_${index}`;
      const group = groups.get(key);
      if (group) group.push(item); else groups.set(key, [item]);
    });
    let totalSettlement = 0;
    let totalProfitLoss = 0;
    let profitLossComplete = true;
    for (const group of groups.values()) {
      const total = group[0]?.orderSettlementAmount ?? null;
      if (total != null) totalSettlement += total;
      const results = calculateProductSettlements(group, total);
      for (const result of results) {
        if (result.profitLoss == null) profitLossComplete = false;
        else totalProfitLoss += result.profitLoss;
      }
    }
    return {
      id: row.id,
      platform: row.platform,
      type: row.type,
      documentDate: row.document_date,
      orderCount: summary.orderCodes.size,
      itemCount: summary.itemCount,
      totalQuantity: summary.totalQuantity,
      totalSettlement,
      totalProfitLoss: profitLossComplete && summary.items.length > 0 ? totalProfitLoss : null,
      createdAt: row.created_at,
    };
  });
  return { rows, count: count ?? 0 };
}

export async function deleteHistoryDocument(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('warehouse_documents').delete().eq('id', id);
  if (error) throw error;
}
