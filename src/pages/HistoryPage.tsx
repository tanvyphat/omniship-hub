import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Edit3, Filter, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { fetchHistory } from '../features/history/history.service';
import { fetchDocument } from '../features/documents/document.service';
import { exportDocumentExcel } from '../lib/excel';
import { formatDateVN } from '../lib/date';
import type { DocumentHistoryItem, DocumentType, Platform } from '../types/document';

const PAGE_SIZE = 100;

function oneYearApart(from: string, to: string) {
  if (!from || !to) return true;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const max = new Date(start);
  max.setFullYear(max.getFullYear() + 1);
  return end <= max;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { platform: rawPlatform } = useParams();
  const platform: Platform = rawPlatform === 'shopee' ? 'shopee' : 'tiktok';
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeLabel = useMemo(() => `${total === 0 ? 0 : page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} / ${total}`, [page, total]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await fetchHistory({ type, from, to, page, pageSize: PAGE_SIZE, platform });
      setRows(result.rows); setTotal(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử phiếu.');
    } finally { setLoading(false); }
  }, [type, from, to, page, platform]);

  useEffect(() => { void load(); }, [load]);

  function applyFilters() {
    // Với thẻ input type="date", giá trị luôn trả về là chuỗi format chuẩn yyyy-MM-dd nên không cần toISODate nữa
    const nextFrom = fromInput;
    const nextTo = toInput;
    setFilterError('');

    if ((nextFrom && !nextTo) || (!nextFrom && nextTo)) { setFilterError('Vui lòng chọn cả Từ ngày và Đến ngày khi lọc theo khoảng thời gian.'); return; }
    if (nextFrom && nextTo && nextFrom > nextTo) { setFilterError('Khoảng thời gian không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.'); return; }
    if (nextFrom && nextTo && !oneYearApart(nextFrom, nextTo)) { setFilterError('Khoảng thời gian lọc tối đa là 1 năm.'); return; }

    setFrom(nextFrom); setTo(nextTo); setPage(0);
  }

  function clearFilters() {
    setType('all'); setFromInput(''); setToInput(''); setFrom(''); setTo(''); setPage(0); setFilterError('');
  }

  async function exportSavedDocument(id: string) {
    setExportingId(id);
    setError('');
    try {
      const document = await fetchDocument(id);
      await exportDocumentExcel(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xuất lại file Excel của phiếu.');
    } finally {
      setExportingId(null);
    }
  }

  return (
      <div>
        <PageHeader eyebrow="History" title={`Lịch sử ${platform === 'tiktok' ? 'TikTok Shop' : 'Shopee'}`} description="Danh sách tất cả phiếu đã tạo, mỗi trang tối đa 100 phiếu. Một phiếu có thể chứa nhiều mã đơn và nhiều sản phẩm." action={<Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" />Làm mới</Button>} />
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900"><Filter className="h-4 w-4" /> Bộ lọc</div>
            <div className="grid gap-4 md:grid-cols-4">
              <Select label="Loại phiếu" value={type} onChange={(e) => setType(e.target.value as 'all' | DocumentType)} options={[{ value: 'all', label: 'Tất cả loại' }, { value: 'outbound', label: 'Phiếu xuất hàng' }, { value: 'return', label: 'Phiếu hoàn hàng' }]} />
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Từ ngày<input type="date" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" value={fromInput} onChange={(e) => setFromInput(e.target.value)} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Đến ngày<input type="date" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" value={toInput} onChange={(e) => setToInput(e.target.value)} /></label>
              <div className="flex items-end gap-2"><Button onClick={applyFilters}>Áp dụng</Button><Button variant="secondary" onClick={clearFilters}>Xóa lọc</Button></div>
            </div>
            {filterError && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{filterError}</div>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-bold">STT</th><th className="px-5 py-3 font-bold">Ngày</th><th className="px-5 py-3 font-bold">Loại phiếu</th><th className="px-5 py-3 font-bold">Số đơn</th><th className="px-5 py-3 font-bold">Số dòng</th><th className="px-5 py-3 text-right font-bold">Tổng SL</th><th className="px-5 py-3 text-right font-bold">Thao tác</th></tr></thead>
              <tbody>
              {loading && <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-500">Đang tải lịch sử…</td></tr>}
              {!loading && error && <tr><td colSpan={7} className="px-5 py-16 text-center text-rose-600">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-500">Không có phiếu phù hợp.</td></tr>}
              {!loading && !error && rows.map((row, index) => <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-5 py-3 text-slate-400">{page * PAGE_SIZE + index + 1}</td><td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{formatDateVN(row.documentDate)}</td><td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.type === 'outbound' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{row.type === 'outbound' ? 'Phiếu xuất hàng' : 'Phiếu hoàn hàng'}</span></td><td className="px-5 py-3 font-semibold text-slate-800">{row.orderCount}</td><td className="px-5 py-3 text-slate-600">{row.itemCount}</td><td className="px-5 py-3 text-right font-bold text-slate-900">{row.totalQuantity}</td><td className="px-5 py-3"><div className="flex justify-end gap-2"><Button variant="secondary" className="h-9 px-3" title="Chỉnh sửa phiếu" onClick={() => navigate(`/warehouse/history/${platform}/${row.id}/edit`)}><Edit3 className="h-4 w-4" /><span className="hidden lg:inline">Sửa</span></Button><Button variant="secondary" className="h-9 px-3" title="Xuất lại file Excel" loading={exportingId === row.id} disabled={exportingId !== null || loading} onClick={() => void exportSavedDocument(row.id)}><Download className="h-4 w-4" /><span className="hidden lg:inline">Xuất Excel</span></Button></div></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-medium text-slate-500">{rangeLabel} · tối đa {PAGE_SIZE} đơn/trang</div>
            <div className="flex items-center gap-2"><Button variant="secondary" className="h-9 px-3" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft className="h-4 w-4" />Trước</Button><div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Trang {Math.min(page + 1, totalPages)} / {totalPages}</div><Button variant="secondary" className="h-9 px-3" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((current) => current + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        </section>
        <div className="mt-4 flex gap-2"><Button variant="ghost" onClick={() => navigate(`/warehouse/outbound/create?platform=${platform}`)}>Tạo phiếu mới</Button></div>
      </div>
  );
}