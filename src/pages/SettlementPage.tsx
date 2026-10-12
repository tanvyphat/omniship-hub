import { useEffect, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { Download, FileUp, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { supabase } from '../lib/supabase';

type Platform = 'shopee' | 'tiktok';
type PayoutKind = 'estimated' | 'actual';
interface ProductPrice {
  id: string;
  platform: Platform;
  sku: string;
  product_name: string;
  sale_price: number;
  minimum_payout: number;
  cost_price: number | null;
  updated_at: string;
}

const money = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' đ';
const platformLabel = (value: Platform) => value === 'shopee' ? 'Shopee' : 'TikTok Shop';
const clean = (value: unknown) => String(value ?? '').trim();
const normalize = (value: unknown) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
function findHeader(headers: unknown[], aliases: string[]) {
  const normalized = headers.map(normalize);
  return normalized.findIndex((header) => aliases.some((alias) => header === normalize(alias)));
}
function parseAmount(value: unknown) {
  if (typeof value === 'number') return value;
  const parsed = Number(clean(value).replace(/[.\s₫đ,]/gi, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}
function parsePlatform(value: unknown): Platform | null {
  const normalized = normalize(value);
  if (normalized.includes('shopee')) return 'shopee';
  if (!normalized) return null;
  if (normalized.includes('tiktok')) return 'tiktok';
  return null;
}
function worksheetRows(sheet: ExcelJS.Worksheet) {
  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values;
    if (Array.isArray(values)) rows.push(values.slice(1) as unknown[]);
    else rows.push(Object.keys(values).sort((a, b) => Number(a) - Number(b)).map((key) => (values as Record<string, unknown>)[key]));
  });
  return rows;
}

export function SettlementPage() {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [platform, setPlatform] = useState<'all' | Platform>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const priceFileRef = useRef<HTMLInputElement>(null);
  const settlementFileRef = useRef<HTMLInputElement>(null);

  async function loadPrices() {
    setLoading(true);
    setError('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: queryError } = await (supabase as any)
      .from('marketplace_product_prices')
      .select('id, platform, sku, product_name, sale_price, minimum_payout, cost_price, updated_at')
      .order('platform')
      .order('product_name');
    if (queryError) setError('Không tải được bảng giá. Hãy kiểm tra migration marketplace_settlement.sql đã được chạy trên Supabase OmniShip Hub chưa.');
    else setPrices((data ?? []) as ProductPrice[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadPrices(); }, []);

  async function downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniShip Hub';
    const priceSheet = workbook.addWorksheet('BANG_GIA');
    priceSheet.addRow(['Nền tảng', 'SKU', 'Tên sản phẩm', 'Giá bán trên sàn', 'Giá cần thu tối thiểu', 'Giá vốn']);
    const settlementSheet = workbook.addWorksheet('QUYET_TOAN');
    settlementSheet.addRow(['Nền tảng', 'Mã đơn hàng', 'Tiền quyết toán đơn', 'Loại quyết toán']);
    [priceSheet, settlementSheet].forEach((sheet) => {
      sheet.columns.forEach((column) => { column.width = 25; });
      sheet.getRow(1).font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'OmniShipHub_BangGia_QuyetToan_Mau.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importPriceFile(file: File) {
    setBusy(true); setMessage(''); setError('');
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.getWorksheet('BANG_GIA') ?? workbook.worksheets[0];
      if (!sheet) throw new Error('File không có sheet dữ liệu.');
      const rows = worksheetRows(sheet);
      if (rows.length < 2) throw new Error('File cần có hàng tiêu đề và ít nhất một dòng sản phẩm.');
      const headers = rows[0];
      const skuCol = findHeader(headers, ['SKU', 'SKU phân loại', 'Mã SKU']);
      const nameCol = findHeader(headers, ['Tên sản phẩm', 'Sản phẩm', 'Product name']);
      const saleCol = findHeader(headers, ['Giá bán trên sàn', 'Giá bán', 'Đơn giá bán']);
      const minimumCol = findHeader(headers, ['Giá cần thu tối thiểu', 'Giá quyết toán tối thiểu', 'Mức thu tối thiểu']);
      const costCol = findHeader(headers, ['Giá vốn', 'Giá nhập', 'Cost price']);
      const platformCol = findHeader(headers, ['Nền tảng', 'Sàn', 'Platform']);
      if ([skuCol, nameCol, saleCol, minimumCol].some((col) => col < 0)) {
        throw new Error('Thiếu cột bắt buộc: SKU, Tên sản phẩm, Giá bán trên sàn, Giá cần thu tối thiểu. Hãy tải file mẫu để đối chiếu.');
      }
      if (platformCol < 0 && platform === 'all') throw new Error('File thiếu cột Nền tảng. Hãy thêm cột này hoặc chọn lọc riêng Shopee/TikTok trước khi nhập.');
      const records = rows.slice(1).filter((row) => clean(row[skuCol]) && clean(row[nameCol])).map((row, index) => {
        const sale = parseAmount(row[saleCol]);
        const minimum = parseAmount(row[minimumCol]);
        const cost = costCol >= 0 && clean(row[costCol]) ? parseAmount(row[costCol]) : null;
        const parsedPlatform = platformCol >= 0 ? parsePlatform(row[platformCol]) : (platform === 'all' ? null : platform);
        if (!parsedPlatform) throw new Error(`Dòng ${index + 2}: Nền tảng phải là Shopee hoặc TikTok Shop.`);
        if (![sale, minimum].every((value) => Number.isFinite(value) && value >= 0) || (cost !== null && (!Number.isFinite(cost) || cost < 0))) {
          throw new Error(`Dòng ${index + 2}: Giá phải là số không âm, ví dụ 40000.`);
        }
        return {
          platform: parsedPlatform,
          sku: clean(row[skuCol]),
          product_name: clean(row[nameCol]),
          sale_price: sale,
          minimum_payout: minimum,
          cost_price: cost,
        };
      });
      if (!records.length) throw new Error('Không tìm thấy dòng sản phẩm hợp lệ.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase as any).from('marketplace_product_prices')
        .upsert(records, { onConflict: 'platform,sku' });
      if (upsertError) throw upsertError;
      setMessage(`Đã nhập/cập nhật ${records.length} SKU. SKU trùng nền tảng sẽ được cập nhật theo file mới.`);
      await loadPrices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhập bảng giá.');
    } finally {
      setBusy(false);
      if (priceFileRef.current) priceFileRef.current.value = '';
    }
  }

  async function importSettlementFile(file: File) {
    setBusy(true); setMessage(''); setError('');
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.getWorksheet('QUYET_TOAN') ?? workbook.worksheets[0];
      if (!sheet) throw new Error('File không có sheet dữ liệu.');
      const rows = worksheetRows(sheet);
      if (rows.length < 2) throw new Error('File cần có hàng tiêu đề và ít nhất một đơn hàng.');
      const headers = rows[0];
      const platformCol = findHeader(headers, ['Nền tảng', 'Sàn', 'Platform']);
      const orderCol = findHeader(headers, ['Mã đơn hàng', 'Mã đơn', 'Order code']);
      const payoutCol = findHeader(headers, ['Tiền quyết toán đơn', 'Doanh thu quyết toán', 'Tiền thực nhận', 'Payout amount']);
      const kindCol = findHeader(headers, ['Loại quyết toán', 'Trạng thái quyết toán', 'Payout kind']);
      if ([platformCol, orderCol, payoutCol].some((col) => col < 0)) {
        throw new Error('Thiếu cột bắt buộc: Nền tảng, Mã đơn hàng, Tiền quyết toán đơn.');
      }
      const records = rows.slice(1).filter((row) => clean(row[orderCol])).map((row, index) => {
        const parsedPlatform = parsePlatform(row[platformCol]);
        const amount = parseAmount(row[payoutCol]);
        const kindValue = normalize(kindCol >= 0 ? row[kindCol] : 'actual');
        const kind: PayoutKind = kindValue.includes('estimate') || kindValue.includes('uoc tinh') ? 'estimated' : 'actual';
        if (!parsedPlatform) throw new Error(`Dòng ${index + 2}: Nền tảng không hợp lệ.`);
        if (!Number.isFinite(amount) || amount < 0) throw new Error(`Dòng ${index + 2}: Tiền quyết toán không hợp lệ.`);
        return { platform: parsedPlatform, order_code: clean(row[orderCol]), payout_amount: amount, payout_kind: kind, source_file: file.name };
      });
      if (!records.length) throw new Error('Không tìm thấy đơn hàng hợp lệ.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase as any).from('marketplace_order_settlements')
        .upsert(records, { onConflict: 'platform,order_code' });
      if (upsertError) throw upsertError;
      setMessage(`Đã nhập/cập nhật quyết toán cho ${records.length} đơn hàng.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhập dữ liệu quyết toán.');
    } finally {
      setBusy(false);
      if (settlementFileRef.current) settlementFileRef.current.value = '';
    }
  }

  async function deletePrice(id: string) {
    if (!window.confirm('Xóa dòng giá này? Các phiếu xuất/hoàn đã lưu sẽ không bị xóa.')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any).from('marketplace_product_prices').delete().eq('id', id);
    if (deleteError) setError('Không thể xóa giá sản phẩm.');
    else { setPrices((current) => current.filter((item) => item.id !== id)); setMessage('Đã xóa dòng giá.'); }
  }

  const visiblePrices = prices.filter((item) => platform === 'all' || item.platform === platform);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Marketplace Finance"
        title="Bảng giá & Quyết toán"
        description="Quản lý giá bán, mức thu tối thiểu, giá vốn và tiền quyết toán theo từng đơn Shopee/TikTok Shop."
        action={<Button variant="secondary" onClick={() => void loadPrices()} disabled={loading || busy}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới</Button>}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileUp className="h-5 w-5" /></div><div><h2 className="font-black text-slate-900">1. Nhập bảng giá SKU</h2><p className="text-xs text-slate-500">Giá bán, mức thu tối thiểu và giá vốn (nếu có).</p></div></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input ref={priceFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importPriceFile(file); }} />
            <Button onClick={() => priceFileRef.current?.click()} disabled={busy}><Upload className="h-4 w-4" /> Chọn file bảng giá</Button>
            <Button variant="secondary" onClick={() => void downloadTemplate()} disabled={busy}><Download className="h-4 w-4" /> Tải file mẫu</Button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Save className="h-5 w-5" /></div><div><h2 className="font-black text-slate-900">2. Nhập quyết toán theo đơn</h2><p className="text-xs text-slate-500">Nhập tổng tiền sàn quyết toán cho mỗi mã đơn để phân bổ xuống từng SKU.</p></div></div>
          <div className="mt-4">
            <input ref={settlementFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importSettlementFile(file); }} />
            <Button onClick={() => settlementFileRef.current?.click()} disabled={busy}><Upload className="h-4 w-4" /> Chọn file quyết toán</Button>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <strong>Cách tính:</strong> Tiền quyết toán đơn được phân bổ theo tỷ trọng giá bán của từng SKU trong đơn. Chênh lệch mục tiêu = tiền quyết toán phân bổ − giá cần thu tối thiểu × số lượng. Nếu nhập giá vốn, hệ thống có thể tính thêm lãi/lỗ sau giá vốn. Phân bổ là ước tính theo tỷ trọng, không thay thế chi tiết phí thực tế của sàn.
      </div>
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div><h2 className="font-black text-slate-900">Danh mục giá sản phẩm</h2><p className="text-xs text-slate-500">{visiblePrices.length} SKU · Đối chiếu theo nền tảng + SKU</p></div>
          <select value={platform} onChange={(event) => setPlatform(event.target.value as 'all' | Platform)} className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="all">Tất cả nền tảng</option><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option></select>
        </div>
        {loading ? <div className="p-12 text-center text-sm font-semibold text-slate-500">Đang tải bảng giá…</div> : visiblePrices.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Chưa có bảng giá. Hãy nhập file Excel để bắt đầu.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nền tảng</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Tên sản phẩm</th><th className="px-4 py-3 text-right">Giá bán</th><th className="px-4 py-3 text-right">Mức thu tối thiểu</th><th className="px-4 py-3 text-right">Giá vốn</th><th className="px-4 py-3">Cập nhật</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>{visiblePrices.map((item) => <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{platformLabel(item.platform)}</td><td className="px-4 py-3 font-mono text-xs">{item.sku}</td><td className="px-4 py-3 font-semibold">{item.product_name}</td><td className="px-4 py-3 text-right tabular-nums">{money(Number(item.sale_price))}</td><td className="px-4 py-3 text-right tabular-nums">{money(Number(item.minimum_payout))}</td><td className="px-4 py-3 text-right tabular-nums">{item.cost_price === null ? 'Chưa nhập' : money(Number(item.cost_price))}</td><td className="px-4 py-3 text-xs text-slate-500">{new Date(item.updated_at).toLocaleDateString('vi-VN')}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => void deletePrice(item.id)} className="cursor-pointer rounded-lg p-2 text-rose-500 hover:bg-rose-50" title="Xóa giá"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
