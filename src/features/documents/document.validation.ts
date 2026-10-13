import type { DocumentInput } from '../../types/document';
import { toISODate } from '../../lib/date';

export function validateDocument(input: DocumentInput): string | null {
  if (!toISODate(input.documentDate)) return 'Ngày phiếu không hợp lệ. Vui lòng chọn đúng ngày.';
  if (input.items.length === 0) return 'Phiếu phải có ít nhất 1 sản phẩm.';
  for (const [index, item] of input.items.entries()) {
    if (!item.orderCode.trim()) return `Dòng ${index + 1}: chưa nhập mã đơn hàng.`;
    if (!item.productName.trim()) return `Dòng ${index + 1}: chưa nhập tên sản phẩm.`;
    if (!item.sku.trim()) return `Dòng ${index + 1}: chưa nhập SKU.`;
    if (!item.unit.trim()) return `Dòng ${index + 1}: chưa nhập dung tích/khối lượng.`;
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) return `Dòng ${index + 1}: số lượng phải là số nguyên > 0.`;
    if (item.salePrice !== null && (!Number.isFinite(item.salePrice) || item.salePrice < 0)) return `Dòng ${index + 1}: đơn giá trên sàn phải là số không âm.`;
    if (item.minimumSettlement !== null && (!Number.isFinite(item.minimumSettlement) || item.minimumSettlement < 0)) return `Dòng ${index + 1}: số tiền cần thu lại tối thiểu phải là số không âm.`;
    if (item.orderSettlementAmount !== null && (!Number.isFinite(item.orderSettlementAmount) || item.orderSettlementAmount < 0)) return `Đơn hàng ${item.orderCode}: tổng quyết toán phải là số không âm.`;
  }
  return null;
}
