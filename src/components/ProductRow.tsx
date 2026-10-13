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
}

export function ProductRow({ index, item, onChange, onRemove, canRemove, showVariant = true }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-slate-200/90 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-transform duration-500 group-hover:scale-x-100" />

      <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
          <GripVertical className="h-3.5 w-3.5" />
          Dòng {index + 1}
        </div>
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Xóa dòng ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className={`grid gap-3 md:items-end ${showVariant ? 'md:grid-cols-[1.35fr_2fr_1.1fr_1.1fr_1fr_0.72fr_auto]' : 'md:grid-cols-[1.35fr_2fr_1.1fr_1.1fr_0.72fr_auto]'}`}>
        <Input label={`Mã đơn ${index + 1}`} required value={item.orderCode} onChange={(e) => onChange({ ...item, orderCode: e.target.value })} placeholder="Mã đơn TikTok / Shopee" />
        <Input label="Tên sản phẩm" required value={item.productName} onChange={(e) => onChange({ ...item, productName: e.target.value })} placeholder="Tên sản phẩm" />
        <Input label="SKU" required value={item.sku} onChange={(e) => onChange({ ...item, sku: e.target.value })} placeholder="SKU" />
        <Input label="Dung tích / Khối lượng" required value={item.unit} onChange={(e) => onChange({ ...item, unit: e.target.value })} placeholder="VD: 5KG" />
        {showVariant && <Input label="Hương / Màu" value={item.variant} onChange={(e) => onChange({ ...item, variant: e.target.value })} placeholder="Không bắt buộc" />}
        <Input label="Số lượng" required type="number" min={1} step={1} value={item.quantity} onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })} />
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="hidden h-11 w-11 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 md:grid"
          aria-label={`Xóa dòng ${index + 1}`}
          title={`Xóa dòng ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
