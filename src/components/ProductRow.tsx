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
}

export function ProductRow({ index, item, onChange, onRemove, canRemove, showVariant = true, hideOrderCode = false }: Props) {
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
    </div>
  );
}
