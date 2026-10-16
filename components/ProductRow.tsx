import { GripVertical, Trash2 } from 'lucide-react';
import type { DocumentItemInput } from '../types/document';
import { Input } from './Input';

interface Props {
  index: number;
  item: DocumentItemInput;
  onChange: (item: DocumentItemInput) => void;
  onRemove: () => void;
  canRemove: boolean;
  showVariant?: boolean;
  hideOrderCode?: boolean;
  showPricing?: boolean;
  settlementAmount?: number | null;
  profitLoss?: number | null;
  settlementPending?: boolean;
}

const moneyValue = (value: number | null) => value == null ? '' : String(value);

const formatMoney = (value: number | null) => value == null
  ? '—'
  : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export function ProductRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
  showVariant = true,
  hideOrderCode = false,
  showPricing = false,
  settlementAmount = null,
  profitLoss = null,
  settlementPending = false,
}: Props) {
  const hasSettlement = settlementAmount != null && !settlementPending;
  const hasProfitLoss = profitLoss != null && !settlementPending;
  const profitPositive = profitLoss != null && profitLoss >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-violet-200 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
          <GripVertical className="h-3.5 w-3.5" />
          Sản phẩm {index + 1}
        </div>
        <button type="button" disabled={!canRemove} onClick={onRemove}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Xóa sản phẩm ${index + 1}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!hideOrderCode && (
        <div className="mb-3">
          <Input label={`Mã đơn hàng · sản phẩm ${index + 1}`} required value={item.orderCode}
            onChange={(e) => onChange({ ...item, orderCode: e.target.value })} placeholder="Mã đơn TikTok / Shopee" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Input label="Tên sản phẩm" required value={item.productName} onChange={(e) => onChange({ ...item, productName: e.target.value })} placeholder="Tên sản phẩm" />
        <Input label="SKU" required value={item.sku} onChange={(e) => onChange({ ...item, sku: e.target.value })} placeholder="SKU" />
        <Input label="Dung tích / Khối lượng" required value={item.unit} onChange={(e) => onChange({ ...item, unit: e.target.value })} placeholder="VD: 5KG" />
        {showVariant && <Input label="Hương / Màu" value={item.variant} onChange={(e) => onChange({ ...item, variant: e.target.value })} placeholder="Không bắt buộc" />}
        <Input label="Số lượng" required type="number" min={1} step={1} value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })} />
      </div>

      {showPricing && (
        <div className="mt-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3 sm:grid-cols-2">
          <Input label="Đơn giá trên sàn (₫ / sản phẩm)" type="number" min={0} step={1}
            value={moneyValue(item.salePrice)} onChange={(e) => onChange({ ...item, salePrice: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="Nhập đơn giá đang niêm yết" />
          <Input label="Số tiền cần thu lại tối thiểu (₫)" type="number" min={0} step={1}
            value={moneyValue(item.minimumSettlement)} onChange={(e) => onChange({ ...item, minimumSettlement: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="VD: 100000" />
        </div>
      )}

      {showPricing && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Quyết toán sản phẩm</div>
            <div className="mt-1 text-sm font-black text-emerald-800">
              {settlementPending ? 'Chưa đủ dữ liệu để phân bổ' : hasSettlement ? formatMoney(settlementAmount) : '—'}
            </div>
            {!settlementPending && hasSettlement && item.quantity > 1 && (
              <div className="mt-0.5 text-[11px] font-medium text-emerald-700">Tổng cho {item.quantity} sản phẩm</div>
            )}
          </div>
          <div className={`rounded-xl border px-3 py-2.5 ${hasProfitLoss && profitPositive ? 'border-emerald-100 bg-emerald-50/60' : hasProfitLoss ? 'border-rose-100 bg-rose-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
            <div className={`text-[11px] font-bold uppercase tracking-wide ${hasProfitLoss && profitPositive ? 'text-emerald-700' : hasProfitLoss ? 'text-rose-700' : 'text-slate-500'}`}>Lời / Lỗ</div>
            <div className={`mt-1 text-sm font-black ${hasProfitLoss && profitPositive ? 'text-emerald-800' : hasProfitLoss ? 'text-rose-800' : 'text-slate-600'}`}>
              {settlementPending ? 'Chưa đủ dữ liệu' : hasProfitLoss ? `${profitPositive ? '+' : ''}${formatMoney(profitLoss)}` : '—'}
            </div>
            {!settlementPending && hasProfitLoss && item.minimumSettlement != null && (
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">So với mức thu tối thiểu</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
