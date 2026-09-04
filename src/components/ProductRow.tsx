import { Trash2 } from 'lucide-react';
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
    <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:items-end ${showVariant ? 'md:grid-cols-[1.3fr_2fr_1.1fr_1fr_1fr_auto]' : 'md:grid-cols-[1.3fr_2fr_1.1fr_1fr_auto]'}`}>
      <Input label={`Mã đơn ${index + 1}`} required value={item.orderCode} onChange={(e) => onChange({ ...item, orderCode: e.target.value })} placeholder="Mã đơn TikTok / Shopee" />
      <Input label="Tên sản phẩm" required value={item.productName} onChange={(e) => onChange({ ...item, productName: e.target.value })} placeholder="Tên sản phẩm" />
      <Input label="SKU" required value={item.sku} onChange={(e) => onChange({ ...item, sku: e.target.value })} placeholder="SKU" />
      <Input label="Dung tích / Khối lượng" required value={item.unit} onChange={(e) => onChange({ ...item, unit: e.target.value })} placeholder="VD: 5KG" />
      {showVariant && <Input label="Hương / Màu" value={item.variant} onChange={(e) => onChange({ ...item, variant: e.target.value })} placeholder="Không bắt buộc" />}
      <div className="flex items-end gap-2">
        <Input label="Số lượng" required type="number" min={1} step={1} value={item.quantity} onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })} />
        <button type="button" disabled={!canRemove} onClick={onRemove} className="mb-0 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Xóa dòng ${index + 1}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
