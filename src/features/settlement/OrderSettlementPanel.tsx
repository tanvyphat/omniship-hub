import { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, RefreshCw, Save } from 'lucide-react';
import type { DocumentItemInput, Platform } from '../../types/document';
import { fetchSettlementReport, saveOrderPayout, type SettlementOrderReport } from './settlement.service';

const money = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' đ';

export function OrderSettlementPanel({ platform, items }: { platform: Platform; items: DocumentItemInput[] }) {
  const [reports, setReports] = useState<SettlementOrderReport[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [kinds, setKinds] = useState<Record<string, 'estimated' | 'actual'>>({});
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await fetchSettlementReport(platform, items);
      setReports(result);
      setAmounts(Object.fromEntries(result.map((report) => [report.orderCode, report.payout ? String(report.payout.payout_amount) : ''])));
      setKinds(Object.fromEntries(result.map((report) => [report.orderCode, report.payout?.payout_kind ?? 'actual'])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu quyết toán.');
    } finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [platform, items]);

  const totals = useMemo(() => reports.reduce((sum, report) => ({
    gross: sum.gross + report.saleTotal,
    payout: sum.payout + (report.allocatedTotal ?? 0),
    target: sum.target + report.targetTotal,
    difference: sum.difference + (report.targetDifference ?? 0),
    profit: sum.profit + (report.profit ?? 0),
  }), { gross: 0, payout: 0, target: 0, difference: 0, profit: 0 }), [reports]);

  async function save(report: SettlementOrderReport) {
    const amount = Number(amounts[report.orderCode]);
    if (!amounts[report.orderCode].trim() || !Number.isFinite(amount) || amount < 0) {
      setError(`Nhập tổng tiền quyết toán hợp lệ cho đơn ${report.orderCode}.`);
      return;
    }
    setSavingCode(report.orderCode); setError(''); setMessage('');
    try {
      await saveOrderPayout(platform, report.orderCode, amount, kinds[report.orderCode] ?? 'actual');
      setMessage(`Đã lưu quyết toán đơn ${report.orderCode}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được quyết toán đơn.');
    } finally { setSavingCode(null); }
  }

  return (
    <section className="mt-5 space-y-3 rounded-2xl border border-violet-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Calculator className="h-5 w-5" /></div>
          <div><h3 className="font-black text-slate-900">Đối soát quyết toán & lời/lỗ</h3><p className="mt-1 text-xs text-slate-500">Phân bổ tổng quyết toán theo tỷ trọng giá bán từng SKU trong mỗi đơn.</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới giá</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold text-slate-500">Tổng giá bán tra được</div><div className="mt-1 font-black text-slate-900">{money(totals.gross)}</div></div>
        <div className="rounded-xl bg-blue-50 p-3"><div className="text-xs font-semibold text-blue-700">Tổng quyết toán đã nhập</div><div className="mt-1 font-black text-blue-900">{money(totals.payout)}</div></div>
        <div className="rounded-xl bg-violet-50 p-3"><div className="text-xs font-semibold text-violet-700">Tổng mức thu tối thiểu</div><div className="mt-1 font-black text-violet-900">{money(totals.target)}</div></div>
        <div className={`rounded-xl p-3 ${totals.difference >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}><div className="text-xs font-semibold text-slate-600">Chênh lệch so với mục tiêu</div><div className={`mt-1 font-black ${totals.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(totals.difference)}</div></div>
      </div>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{message}</div>}
      {loading ? <div className="py-6 text-center text-sm text-slate-500">Đang tính quyết toán…</div> : reports.length === 0 ? <div className="py-4 text-sm text-slate-500">Không có mã đơn hàng để đối soát.</div> : reports.map((report) => (
        <div key={report.orderCode} className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-end justify-between gap-3 bg-slate-50 p-3">
            <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã đơn hàng</div><div className="mt-1 font-black text-slate-900">{report.orderCode}</div><div className="mt-1 text-xs text-slate-500">Giá bán tra được: {money(report.saleTotal)} · Mức thu tối thiểu: {money(report.targetTotal)}</div></div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-600"><span>Tổng tiền quyết toán</span><input inputMode="decimal" value={amounts[report.orderCode] ?? ''} onChange={(event) => setAmounts((current) => ({ ...current, [report.orderCode]: event.target.value.replace(/[^\d.]/g, '') }))} placeholder="VD: 261600" className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400" /></label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600"><span>Loại</span><select value={kinds[report.orderCode] ?? 'actual'} onChange={(event) => setKinds((current) => ({ ...current, [report.orderCode]: event.target.value as 'estimated' | 'actual' }))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"><option value="actual">Thực tế</option><option value="estimated">Ước tính</option></select></label>
              <button type="button" onClick={() => void save(report)} disabled={savingCode !== null} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{savingCode === report.orderCode ? 'Đang lưu' : 'Lưu'}</button>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-white text-slate-500"><tr><th className="px-3 py-2">Sản phẩm / SKU</th><th className="px-3 py-2 text-right">Giá bán/đv</th><th className="px-3 py-2 text-right">SL</th><th className="px-3 py-2 text-right">Quyết toán phân bổ</th><th className="px-3 py-2 text-right">Mức thu tối thiểu</th><th className="px-3 py-2 text-right">Chênh lệch</th><th className="px-3 py-2 text-right">Lãi/lỗ sau vốn</th></tr></thead>
            <tbody>{report.lines.map((line, index) => <tr key={`${line.sku}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2"><div className="font-semibold text-slate-800">{line.productName}</div><div className="mt-0.5 font-mono text-[10px] text-slate-500">{line.sku}</div>{line.salePrice === null && <div className="mt-1 text-[10px] font-bold text-rose-600">Chưa có SKU trong bảng giá</div>}</td><td className="px-3 py-2 text-right tabular-nums">{money(line.salePrice)}</td><td className="px-3 py-2 text-right">{line.quantity}</td><td className="px-3 py-2 text-right font-bold tabular-nums">{money(line.allocatedPayout)}</td><td className="px-3 py-2 text-right tabular-nums">{money(line.targetAmount)}</td><td className={`px-3 py-2 text-right font-bold tabular-nums ${line.targetDifference === null ? 'text-slate-400' : line.targetDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(line.targetDifference)}</td><td className={`px-3 py-2 text-right font-bold tabular-nums ${line.profit === null ? 'text-slate-400' : line.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(line.profit)}</td></tr>)}</tbody>
          </table></div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2 text-xs">
            {report.payout ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{report.payout.payout_kind === 'actual' ? 'Đã nhập quyết toán thực tế' : 'Đã nhập quyết toán ước tính'}</span> : <span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">Chưa nhập tổng quyết toán đơn</span>}
            <span className="text-slate-500">Chênh lệch đơn: <strong className={report.targetDifference !== null && report.targetDifference < 0 ? 'text-rose-700' : 'text-emerald-700'}>{money(report.targetDifference)}</strong></span>
            {report.profit !== null && <span className="text-slate-500">Lãi/lỗ sau vốn: <strong className={report.profit < 0 ? 'text-rose-700' : 'text-emerald-700'}>{money(report.profit)}</strong></span>}
          </div>
        </div>
      ))}
      <p className="text-[11px] leading-5 text-slate-500">Quyết toán được phân bổ theo tỷ trọng giá bán của từng dòng hàng và làm tròn đến đồng; dòng cuối nhận phần chênh lệch làm tròn để tổng khớp tổng tiền đơn. Chênh lệch mục tiêu = quyết toán phân bổ − mức thu tối thiểu. Lãi/lỗ sau vốn = quyết toán phân bổ − giá vốn × số lượng. Nếu chưa nhập tổng quyết toán, số quyết toán phân bổ sẽ để trống, không tự bịa số liệu.</p>
    </section>
  );
}
