import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, Download, Edit3, Filter, Layers3, PackageCheck, RefreshCw, RotateCcw, SearchX, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { fetchDocument } from '../features/documents/document.service';
import { useFeatureFlags } from '../features/featureFlags/useFeatureFlags';
import { deleteHistoryDocument, fetchHistory } from '../features/history/history.service';
import { formatDateVN } from '../lib/date';
import { exportDocumentExcel, exportHistoryDocumentsExcel } from '../lib/excel';
import { calculateProductSettlements, formatVND } from '../lib/settlement';
import type { DocumentHistoryItem, DocumentInput, DocumentType, Platform } from '../types/document';

const PAGE_SIZE = 100;
type HistoryDocument = Awaited<ReturnType<typeof fetchDocument>>;

function oneYearApart(from: string, to: string) {
  if (!from || !to) return true;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const max = new Date(start);
  max.setFullYear(max.getFullYear() + 1);
  return end <= max;
}

function groupDocumentItems(document: HistoryDocument) {
  const groups = new Map<string, { orderCode: string; items: HistoryDocument['items'] }>();
  document.items.forEach((item, index) => {
    const orderCode = item.orderCode.trim();
    const key = orderCode || `__missing_${index}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { orderCode, items: [item] });
  });
  return Array.from(groups.values());
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { platform: rawPlatform } = useParams();
  const { features, loading: featureLoading } = useFeatureFlags();
  const platform: Platform = rawPlatform === 'shopee' ? 'shopee' : 'tiktok';
  const isShopee = platform === 'shopee';

  const [type, setType] = useState<'all' | DocumentType>('all');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<DocumentHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DocumentHistoryItem | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailById, setDetailById] = useState<Record<string, HistoryDocument>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const allowedTypes = useMemo<DocumentType[]>(() => {
    const result: DocumentType[] = [];
    if (features.outbound) result.push('outbound');
    if (features.returns) result.push('return');
    return result;
  }, [features.outbound, features.returns]);

  const typeOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả loại' },
    ...(features.outbound ? [{ value: 'outbound', label: 'Phiếu xuất hàng' }] : []),
    ...(features.returns ? [{ value: 'return', label: 'Phiếu hoàn hàng' }] : []),
  ], [features.outbound, features.returns]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStats = useMemo(() => ({
    orders: rows.reduce((sum, row) => sum + row.orderCount, 0),
    quantity: rows.reduce((sum, row) => sum + row.totalQuantity, 0),
  }), [rows]);

  const load = useCallback(async () => {
    if (featureLoading) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchHistory({ type, from, to, page, pageSize: PAGE_SIZE, platform, allowedTypes });
      setRows(result.rows);
      setTotal(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử phiếu.');
    } finally {
      setLoading(false);
    }
  }, [type, from, to, page, platform, allowedTypes, featureLoading]);

  useEffect(() => { void load(); }, [load]);

  function applyFilters() {
    setFilterError('');
    if ((fromInput && !toInput) || (!fromInput && toInput)) return setFilterError('Vui lòng chọn cả Từ ngày và Đến ngày khi lọc theo khoảng thời gian.');
    if (fromInput && toInput && fromInput > toInput) return setFilterError('Khoảng thời gian không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
    if (fromInput && toInput && !oneYearApart(fromInput, toInput)) return setFilterError('Khoảng thời gian lọc tối đa là 1 năm.');
    setFrom(fromInput); setTo(toInput); setPage(0);
  }

  function clearFilters() {
    setType('all'); setFromInput(''); setToInput(''); setFrom(''); setTo(''); setPage(0); setFilterError('');
  }

  async function toggleQuickView(id: string) {
    if (expandedId === id) return setExpandedId(null);
    setExpandedId(id);
    if (detailById[id]) return;
    setDetailLoadingId(id); setError('');
    try {
      const document = await fetchDocument(id);
      setDetailById((current) => ({ ...current, [id]: document }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết phiếu.');
      setExpandedId(null);
    } finally {
      setDetailLoadingId(null);
    }
  }

  async function exportSavedDocument(id: string) {
    setExportingId(id); setError('');
    try { await exportDocumentExcel(await fetchDocument(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể xuất lại file Excel của phiếu.'); }
    finally { setExportingId(null); }
  }

  async function exportDocuments(ids: string[]) {
    if (!ids.length) return setError('Vui lòng chọn ít nhất một phiếu để xuất Excel.');
    setBulkExporting(true); setError('');
    try {
      const documents: DocumentInput[] = [];
      for (let i = 0; i < ids.length; i += 10) documents.push(...await Promise.all(ids.slice(i, i + 10).map((id) => fetchDocument(id))));
      await exportHistoryDocumentsExcel(documents);
      setSuccessMessage(`Đã xuất gộp ${documents.length} phiếu vào một file Excel.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể xuất các phiếu đã chọn.'); }
    finally { setBulkExporting(false); }
  }

  function toggleCurrentPageSelection(checked: boolean) {
    const pageIds = rows.map((row) => row.id);
    setSelectedIds((current) => checked ? [...new Set([...current, ...pageIds])] : current.filter((id) => !pageIds.includes(id)));
  }

  async function exportAllMatchingDocuments() {
    setBulkExporting(true); setError('');
    try {
      const ids: string[] = [];
      let currentPage = 0;
      let count = 0;
      do {
        const result = await fetchHistory({ type, from, to, page: currentPage, pageSize: 500, platform, allowedTypes });
        ids.push(...result.rows.map((row) => row.id)); count = result.count; currentPage += 1;
      } while (ids.length < count);
      await exportDocuments(ids);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể xuất toàn bộ lịch sử.'); }
    finally { setBulkExporting(false); }
  }

  async function confirmDeleteHistoryDocument() {
    if (!pendingDelete) return;
    const row = pendingDelete;
    setDeletingId(row.id); setError(''); setSuccessMessage('');
    try {
      await deleteHistoryDocument(row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      setTotal((current) => Math.max(0, current - 1));
      setDetailById((current) => { const next = { ...current }; delete next[row.id]; return next; });
      if (expandedId === row.id) setExpandedId(null);
      setPendingDelete(null); setSuccessMessage('Đã xóa phiếu và toàn bộ dữ liệu sản phẩm liên quan.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể xóa phiếu.'); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="History Center" title={`Lịch sử ${isShopee ? 'Shopee' : 'TikTok Shop'}`} description="Tra cứu, lọc, chỉnh sửa và xuất lại các phiếu đã lưu trên hệ thống." action={<Button variant="secondary" onClick={() => void load()} disabled={loading || featureLoading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Làm mới</Button>} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-violet-100 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white"><Layers3 className="h-5 w-5" /></div><div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng phiếu</div><div className="mt-0.5 text-2xl font-black text-slate-950">{total}</div></div></div></div>
        <div className="rounded-[22px] border border-blue-100 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><PackageCheck className="h-5 w-5" /></div><div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Số đơn trên trang</div><div className="mt-0.5 text-2xl font-black text-slate-950">{pageStats.orders}</div></div></div></div>
        <div className="rounded-[22px] border border-emerald-100 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><PackageCheck className="h-5 w-5" /></div><div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng SL trên trang</div><div className="mt-0.5 text-2xl font-black text-slate-950">{pageStats.quantity}</div></div></div></div>
        <div className="rounded-[22px] border border-orange-100 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-600"><CheckCircle2 className="h-5 w-5" /></div><div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tính năng</div><div className="mt-0.5 text-sm font-black text-slate-950">Quyết toán & lời/lỗ</div></div></div></div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <div className="border-b border-slate-100/90 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white"><Filter className="h-4 w-4" /></div><div><h2 className="font-black text-slate-950">Bộ lọc lịch sử</h2><p className="mt-0.5 text-xs text-slate-500">Lọc theo loại phiếu và khoảng thời gian tối đa 1 năm.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <Select label="Loại phiếu" value={type} onChange={(e) => setType(e.target.value as 'all' | DocumentType)} options={typeOptions} />
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Từ ngày</span><input type="date" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={fromInput} onChange={(e) => setFromInput(e.target.value)} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Đến ngày</span><input type="date" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={toInput} onChange={(e) => setToInput(e.target.value)} /></label>
            <div className="flex gap-2"><button type="button" onClick={applyFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-4 text-sm font-bold text-white"><Filter className="h-4 w-4" />Áp dụng</button><button type="button" onClick={clearFilters} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600">Xóa lọc</button></div>
          </div>
          {filterError && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{filterError}</div>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><div className="text-sm"><div className="font-black text-slate-900">Xuất Excel hàng loạt</div><div className="mt-1 text-xs text-slate-500">Đã chọn {selectedIds.length} phiếu</div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void exportDocuments(selectedIds)} disabled={bulkExporting || !selectedIds.length || loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" />Xuất đã chọn</button><button type="button" onClick={() => void exportAllMatchingDocuments()} disabled={bulkExporting || loading || !total} className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-bold text-violet-700 disabled:opacity-50"><Layers3 className="h-4 w-4" />Xuất tất cả ({total})</button></div></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><th className="px-5 py-4"><div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))} onChange={(e) => toggleCurrentPageSelection(e.target.checked)} />STT</div></th><th className="px-5 py-4">Ngày</th><th className="px-5 py-4">Loại phiếu</th><th className="px-5 py-4">Số đơn</th><th className="px-5 py-4">Số dòng</th><th className="px-5 py-4 text-right">Tổng SL</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
            <tbody>
              {(loading || featureLoading) && <tr><td colSpan={7} className="px-5 py-20 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-violet-500" /></td></tr>}
              {!loading && !featureLoading && error && <tr><td colSpan={7} className="px-5 py-16 text-center"><div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div></td></tr>}
              {!loading && !featureLoading && !error && !rows.length && <tr><td colSpan={7} className="px-5 py-20 text-center"><SearchX className="mx-auto h-8 w-8 text-slate-400" /><div className="mt-3 font-black text-slate-800">Chưa có phiếu phù hợp</div></td></tr>}

              {!loading && !featureLoading && !error && rows.map((row, index) => (
                <Fragment key={row.id}>
                  <tr className={`border-b border-slate-100 hover:bg-violet-50/35 ${expandedId === row.id ? 'bg-violet-50/40' : ''}`}>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /><span className="font-black text-slate-500">{page * PAGE_SIZE + index + 1}</span></div></td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">{formatDateVN(row.documentDate)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${row.type === 'outbound' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>{row.type === 'outbound' ? <PackageCheck className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}{row.type === 'outbound' ? 'Phiếu xuất hàng' : 'Phiếu hoàn hàng'}</span></td>
                    <td className="px-5 py-4 font-black">{row.orderCount}</td><td className="px-5 py-4 font-semibold text-slate-500">{row.itemCount}</td><td className="px-5 py-4 text-right font-black">{row.totalQuantity}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button variant="secondary" className="h-9 px-3" onClick={() => void toggleQuickView(row.id)} disabled={detailLoadingId !== null && detailLoadingId !== row.id}>{detailLoadingId === row.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ChevronDown className={`h-4 w-4 ${expandedId === row.id ? 'rotate-180' : ''}`} />}<span className="hidden lg:inline">Xem chi tiết</span></Button><Button variant="secondary" className="h-9 px-3" onClick={() => navigate(`/warehouse/history/${platform}/${row.id}/edit?type=${row.type}`)}><Edit3 className="h-4 w-4" /><span className="hidden lg:inline">Sửa</span></Button><Button variant="secondary" className="h-9 px-3" loading={exportingId === row.id} disabled={exportingId !== null} onClick={() => void exportSavedDocument(row.id)}><Download className="h-4 w-4" /><span className="hidden lg:inline">Excel</span></Button><Button variant="secondary" className="h-9 border-rose-200 px-3 text-rose-600" loading={deletingId === row.id} disabled={deletingId !== null} onClick={() => { setSuccessMessage(''); setPendingDelete(row); }}><Trash2 className="h-4 w-4" /><span className="hidden lg:inline">Xóa</span></Button></div></td>
                  </tr>

                  {expandedId === row.id && <tr className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 via-white to-blue-50/50"><td colSpan={7} className="px-5 py-5">
                    {detailLoadingId === row.id && !detailById[row.id] ? <div className="flex justify-center gap-2 py-5 text-sm font-semibold text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Đang tải chi tiết…</div> : detailById[row.id] ? <div className="space-y-5">
                      {groupDocumentItems(detailById[row.id]).map((group, groupIndex) => {
                        const settlements = calculateProductSettlements(group.items, group.items[0]?.orderSettlementAmount ?? null);
                        const totalSettlement = group.items[0]?.orderSettlementAmount ?? null;
                        const totalMinimum = group.items.reduce((sum, item) => sum + (item.minimumSettlement ?? 0) * item.quantity, 0);
                        const totalProfitLoss = settlements.every((item) => item.profitLoss != null) ? settlements.reduce((sum, item) => sum + (item.profitLoss ?? 0), 0) : null;
                        return <section key={`${row.id}-${groupIndex}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3"><div><div className="font-black text-slate-900">Đơn {groupIndex + 1}: {group.orderCode || '—'}</div><div className="mt-1 text-xs text-slate-500">{group.items.length} dòng sản phẩm</div></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-violet-50 px-3 py-1.5 font-bold text-violet-700">Tổng quyết toán: {formatVND(totalSettlement)}</span><span className={`rounded-full px-3 py-1.5 font-bold ${totalProfitLoss == null ? 'bg-slate-100 text-slate-600' : totalProfitLoss >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>Lời/Lỗ: {totalProfitLoss == null ? '—' : `${totalProfitLoss >= 0 ? '+' : ''}${formatVND(totalProfitLoss)}`}</span></div></div>
                          <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-white text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3 text-right">SL</th><th className="px-4 py-3 text-right">Đơn giá sàn</th><th className="px-4 py-3 text-right">Mức tối thiểu</th><th className="px-4 py-3 text-right">Quyết toán SP</th><th className="px-4 py-3 text-right">Lời / Lỗ</th></tr></thead><tbody>{group.items.map((item, itemIndex) => { const result = settlements[itemIndex]; return <tr key={`${group.orderCode}-${itemIndex}`} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-700">{item.productName || '—'}<div className="text-xs font-normal text-slate-400">{item.variant || item.unit || '—'}</div></td><td className="px-4 py-3 text-slate-600">{item.sku || '—'}</td><td className="px-4 py-3 text-right font-black">{item.quantity}</td><td className="px-4 py-3 text-right text-slate-600">{item.salePrice == null ? '—' : formatVND(item.salePrice)}</td><td className="px-4 py-3 text-right text-slate-600">{result.minimumAmount == null ? '—' : formatVND(result.minimumAmount)}</td><td className="px-4 py-3 text-right font-black text-emerald-700">{formatVND(result.settlementAmount)}</td><td className={`px-4 py-3 text-right font-black ${result.profitLoss == null ? 'text-slate-500' : result.profitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{result.profitLoss == null ? '—' : `${result.profitLoss >= 0 ? '+' : ''}${formatVND(result.profitLoss)}`}</td></tr>; })}</tbody></table></div>
                          <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3"><div><div className="text-xs font-semibold text-slate-500">Tổng quyết toán</div><div className="mt-1 font-black text-slate-900">{formatVND(totalSettlement)}</div></div><div><div className="text-xs font-semibold text-slate-500">Tổng mức tối thiểu</div><div className="mt-1 font-black text-slate-900">{formatVND(totalMinimum)}</div></div><div><div className="text-xs font-semibold text-slate-500">Đối chiếu</div><div className={`mt-1 font-black ${totalSettlement == null ? 'text-slate-500' : totalSettlement >= totalMinimum ? 'text-emerald-700' : 'text-rose-700'}`}>{totalSettlement == null ? 'Chưa có dữ liệu' : totalSettlement >= totalMinimum ? `Đạt · dư ${formatVND(totalSettlement - totalMinimum)}` : `Thiếu ${formatVND(totalMinimum - totalSettlement)}`}</div></div></div>
                        </section>;
                      })}
                    </div> : null}
                  </td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs font-semibold text-slate-500">{total === 0 ? 0 : page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} / {total} · Tối đa {PAGE_SIZE} phiếu/trang</div><div className="flex items-center gap-2"><Button variant="secondary" className="h-9 px-3" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft className="h-4 w-4" />Trước</Button><div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Trang {Math.min(page + 1, totalPages)} / {totalPages}</div><Button variant="secondary" className="h-9 px-3" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((current) => current + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>
      </section>

      {successMessage && <div role="status" className="fixed bottom-5 right-5 z-40 flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-2xl"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span className="flex-1">{successMessage}</span><button type="button" className="rounded-lg p-1" onClick={() => setSuccessMessage('')}><X className="h-4 w-4" /></button></div>}

      {pendingDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><section className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"><div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50 p-6"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600"><Trash2 className="h-6 w-6" /></div><div className="flex-1"><h2 className="text-lg font-black text-slate-950">Xác nhận xóa phiếu</h2><p className="mt-1 text-sm text-slate-600">Phiếu, sản phẩm và dữ liệu quyết toán liên quan sẽ bị xóa vĩnh viễn.</p></div></div><div className="space-y-4 p-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span>Loại phiếu</span><b>{pendingDelete.type === 'outbound' ? 'Phiếu xuất hàng' : 'Phiếu hoàn hàng'}</b></div><div className="mt-2 flex justify-between"><span>Nền tảng</span><b>{pendingDelete.platform === 'shopee' ? 'Shopee' : 'TikTok Shop'}</b></div><div className="mt-2 flex justify-between"><span>Ngày</span><b>{formatDateVN(pendingDelete.documentDate)}</b></div></div><div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertTriangle className="h-5 w-5 shrink-0" />Thao tác này không thể hoàn tác.</div><div className="flex justify-end gap-2"><button type="button" disabled={deletingId !== null} onClick={() => setPendingDelete(null)} className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold">Hủy</button><button type="button" disabled={deletingId !== null} onClick={() => void confirmDeleteHistoryDocument()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white">{deletingId !== null ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Xóa phiếu</button></div></div></section></div>}
    </div>
  );
}
