import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  Filter,
  Layers3,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  SearchX,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { fetchDocument } from '../features/documents/document.service';
import { useFeatureFlags } from '../features/featureFlags/useFeatureFlags';
import { fetchHistory } from '../features/history/history.service';
import { formatDateVN } from '../lib/date';
import { exportDocumentExcel } from '../lib/excel';
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
  const rangeLabel = useMemo(
    () => `${total === 0 ? 0 : page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} / ${total}`,
    [page, total],
  );

  const pageStats = useMemo(() => ({
    orders: rows.reduce((sum, row) => sum + row.orderCount, 0),
    quantity: rows.reduce((sum, row) => sum + row.totalQuantity, 0),
    outbound: rows.filter((row) => row.type === 'outbound').length,
    returns: rows.filter((row) => row.type === 'return').length,
  }), [rows]);

  const hasActiveFilters = type !== 'all' || Boolean(from || to);

  useEffect(() => {
    if ((type === 'outbound' && !features.outbound) || (type === 'return' && !features.returns)) {
      setType('all');
      setPage(0);
    }
  }, [type, features.outbound, features.returns]);

  const load = useCallback(async () => {
    if (featureLoading) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchHistory({
        type,
        from,
        to,
        page,
        pageSize: PAGE_SIZE,
        platform,
        allowedTypes,
      });
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
    const nextFrom = fromInput;
    const nextTo = toInput;
    setFilterError('');

    if ((nextFrom && !nextTo) || (!nextFrom && nextTo)) {
      setFilterError('Vui lòng chọn cả Từ ngày và Đến ngày khi lọc theo khoảng thời gian.');
      return;
    }
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setFilterError('Khoảng thời gian không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
      return;
    }
    if (nextFrom && nextTo && !oneYearApart(nextFrom, nextTo)) {
      setFilterError('Khoảng thời gian lọc tối đa là 1 năm.');
      return;
    }

    setFrom(nextFrom);
    setTo(nextTo);
    setPage(0);
  }

  function clearFilters() {
    setType('all');
    setFromInput('');
    setToInput('');
    setFrom('');
    setTo('');
    setPage(0);
    setFilterError('');
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

  const createAction = features.outbound
    ? { label: 'Tạo phiếu xuất mới', path: `/warehouse/outbound/create?platform=${platform}`, icon: PackageCheck }
    : features.returns
      ? { label: 'Tạo phiếu hoàn mới', path: `/warehouse/returns/create?platform=${platform}`, icon: RotateCcw }
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="History Center"
        title={`Lịch sử ${isShopee ? 'Shopee' : 'TikTok Shop'}`}
        description="Tra cứu, lọc, chỉnh sửa và xuất lại các phiếu đã lưu trên hệ thống."
        action={(
          <Button variant="secondary" onClick={() => void load()} disabled={loading || featureLoading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        )}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group relative overflow-hidden rounded-[22px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/70">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng phiếu</div>
              <div className="mt-0.5 text-2xl font-black text-slate-950">{total}</div>
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-[22px] border bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isShopee ? 'border-orange-100 hover:shadow-orange-100/70' : 'border-cyan-100 hover:shadow-cyan-100/70'}`}>
          <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150 ${isShopee ? 'bg-orange-400/10' : 'bg-cyan-400/10'}`} />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl shadow-lg">
              <img src={isShopee ? '/shopee-logo.svg' : '/tiktok-logo.svg'} alt={isShopee ? 'Shopee' : 'TikTok Shop'} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Trang hiện tại</div>
              <div className="mt-0.5 text-2xl font-black text-slate-950">{rows.length} <span className="text-sm font-bold text-slate-400">phiếu</span></div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[22px] border border-blue-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Số đơn trên trang</div>
              <div className="mt-0.5 text-2xl font-black text-slate-950">{pageStats.orders}</div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[22px] border border-emerald-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/70">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng SL trên trang</div>
              <div className="mt-0.5 text-2xl font-black text-slate-950">{pageStats.quantity}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${isShopee ? 'bg-orange-300/10' : 'bg-cyan-300/10'}`} />
          <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />
        </div>

        <div className="relative border-b border-slate-100/90 p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-black text-slate-950">Bộ lọc lịch sử</h2>
                <p className="mt-0.5 text-xs text-slate-500">Lọc theo loại phiếu và khoảng thời gian tối đa 1 năm.</p>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                Đang áp dụng bộ lọc
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <Select
              label="Loại phiếu"
              value={type}
              onChange={(e) => setType(e.target.value as 'all' | DocumentType)}
              options={typeOptions}
            />

            <label className="group grid gap-1.5 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2 transition-colors group-focus-within:text-violet-700">
                <CalendarDays className="h-4 w-4" />
                Từ ngày
              </span>
              <input
                type="date"
                className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white/90 px-3 text-sm outline-none transition-all duration-200 hover:border-slate-300 focus:-translate-y-[1px] focus:border-violet-400 focus:bg-white focus:shadow-lg focus:shadow-violet-100/70 focus:ring-4 focus:ring-violet-100/70"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
              />
            </label>

            <label className="group grid gap-1.5 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2 transition-colors group-focus-within:text-violet-700">
                <CalendarDays className="h-4 w-4" />
                Đến ngày
              </span>
              <input
                type="date"
                className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white/90 px-3 text-sm outline-none transition-all duration-200 hover:border-slate-300 focus:-translate-y-[1px] focus:border-violet-400 focus:bg-white focus:shadow-lg focus:shadow-violet-100/70 focus:ring-4 focus:ring-violet-100/70"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="group relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-4 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Filter className="relative h-4 w-4" />
                <span className="relative">Áp dụng</span>
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 active:scale-[0.98]"
              >
                Xóa lọc
              </button>
            </div>
          </div>

          {filterError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
              {filterError}
            </div>
          )}
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-violet-50/50 to-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                <th className="px-5 py-4 font-black">STT</th>
                <th className="px-5 py-4 font-black">Ngày</th>
                <th className="px-5 py-4 font-black">Loại phiếu</th>
                <th className="px-5 py-4 font-black">Số đơn</th>
                <th className="px-5 py-4 font-black">Số dòng</th>
                <th className="px-5 py-4 text-right font-black">Tổng SL</th>
                <th className="px-5 py-4 text-right font-black">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(loading || featureLoading) && (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center gap-3 text-slate-500">
                      <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
                      <span className="text-sm font-semibold">Đang tải lịch sử…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !featureLoading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !featureLoading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
                        <SearchX className="h-6 w-6" />
                      </div>
                      <div className="mt-4 font-black text-slate-800">Chưa có phiếu phù hợp</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">Thử thay đổi bộ lọc hoặc tạo một phiếu mới cho nền tảng này.</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !featureLoading && !error && rows.map((row, index) => (
                <tr key={row.id} className="group border-b border-slate-100/90 transition-all duration-200 hover:bg-violet-50/35">
                  <td className="px-5 py-4">
                    <span className="inline-grid h-7 min-w-7 place-items-center rounded-lg bg-slate-100 px-2 text-xs font-black text-slate-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-700">
                      {page * PAGE_SIZE + index + 1}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">{formatDateVN(row.documentDate)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${row.type === 'outbound' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                      {row.type === 'outbound' ? <PackageCheck className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      {row.type === 'outbound' ? 'Phiếu xuất hàng' : 'Phiếu hoàn hàng'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black text-slate-800">{row.orderCount}</td>
                  <td className="px-5 py-4 font-semibold text-slate-500">{row.itemCount}</td>
                  <td className="px-5 py-4 text-right text-base font-black text-slate-950">{row.totalQuantity}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="h-9 px-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                        title="Chỉnh sửa phiếu"
                        onClick={() => navigate(`/warehouse/history/${platform}/${row.id}/edit?type=${row.type}`)}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="hidden lg:inline">Sửa</span>
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 px-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                        title="Xuất lại file Excel"
                        loading={exportingId === row.id}
                        disabled={exportingId !== null || loading}
                        onClick={() => void exportSavedDocument(row.id)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden lg:inline">Xuất Excel</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{rangeLabel}</span>
            <span className="text-slate-300">•</span>
            <span>Tối đa {PAGE_SIZE} phiếu/trang</span>
            {pageStats.outbound > 0 && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{pageStats.outbound} xuất</span>}
            {pageStats.returns > 0 && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{pageStats.returns} hoàn</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-9 px-3"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 shadow-sm">
              Trang {Math.min(page + 1, totalPages)} / {totalPages}
            </div>
            <Button
              variant="secondary"
              className="h-9 px-3"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {createAction && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(createAction.path)}
            className={`group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${isShopee ? 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-orange-500/20' : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 shadow-cyan-500/20'}`}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <createAction.icon className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="relative">{createAction.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
