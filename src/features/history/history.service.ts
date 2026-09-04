import { supabase } from '../../lib/supabase';
import type { DocumentHistoryItem, DocumentType, Platform } from '../../types/document';

export interface HistoryFilters {
  type: 'all' | DocumentType;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  platform: Platform;
}

// Định nghĩa interface cục bộ để map dữ liệu trả về từ Supabase
interface HistoryDocumentRow {
  id: string;
  platform: Platform;
  type: DocumentType;
  document_date: string;
  created_at: string;
}

interface HistoryItemRow {
  document_id: string;
  order_code: string;
  quantity: number;
}

export async function fetchHistory(filters: HistoryFilters) {
  const from = filters.from || null;
  const to = filters.to || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
      .from('warehouse_documents')
      .select('id, platform, type, document_date, created_at', { count: 'exact' })
      .eq('platform', filters.platform)
      .order('document_date', { ascending: false })
      .order('type', { ascending: true })
      .order('created_at', { ascending: false });

  if (filters.type !== 'all') query = query.eq('type', filters.type);
  if (from) query = query.gte('document_date', from);
  if (to) query = query.lte('document_date', to);

  const fromIndex = filters.page * filters.pageSize;
  const toIndex = fromIndex + filters.pageSize - 1;

  const { data: rawDocuments, error: documentError, count } = await query.range(fromIndex, toIndex);
  if (documentError) throw documentError;

  // Ép dữ liệu trả về sang interface cục bộ để đảm bảo Type Safety
  const documents = (rawDocuments ?? []) as HistoryDocumentRow[];
  const ids = documents.map((document) => document.id);

  if (ids.length === 0) return { rows: [], count: count ?? 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawItems, error: itemError } = await (supabase as any)
      .from('warehouse_document_items')
      .select('document_id, order_code, quantity')
      .in('document_id', ids);

  if (itemError) throw itemError;

  const items = (rawItems ?? []) as HistoryItemRow[];

  const stats = new Map<string, { itemCount: number; totalQuantity: number; orderCodes: Set<string> }>();
  for (const item of items) {
    const current = stats.get(item.document_id) ?? { itemCount: 0, totalQuantity: 0, orderCodes: new Set<string>() };
    current.itemCount += 1;
    current.totalQuantity += item.quantity;
    if (item.order_code) current.orderCodes.add(item.order_code);
    stats.set(item.document_id, current);
  }

  const rows: DocumentHistoryItem[] = documents.map((row) => {
    const summary = stats.get(row.id) ?? { itemCount: 0, totalQuantity: 0, orderCodes: new Set<string>() };
    return {
      id: row.id,
      platform: row.platform,
      type: row.type,
      documentDate: row.document_date,
      orderCount: summary.orderCodes.size,
      itemCount: summary.itemCount,
      totalQuantity: summary.totalQuantity,
      createdAt: row.created_at,
    };
  });

  return { rows, count: count ?? 0 };
}