import type { DocumentItemInput } from '../types/document';

export interface ProductSettlementResult {
  settlementAmount: number | null;
  minimumAmount: number | null;
  profitLoss: number | null;
}

/**
 * Phân bổ tổng quyết toán của một đơn theo tỷ trọng giá bán của từng sản phẩm.
 * Ví dụ: sản phẩm A chiếm 60% tổng giá bán của đơn thì nhận 60% tổng quyết toán.
 *
 * Kết quả được làm tròn đến đồng và phần chênh lệch do làm tròn được dồn vào
 * sản phẩm cuối cùng để tổng quyết toán từng sản phẩm luôn khớp tổng quyết toán đơn.
 */
export function calculateProductSettlements(
  items: DocumentItemInput[],
  totalSettlement: number | null,
): ProductSettlementResult[] {
  if (totalSettlement == null || !Number.isFinite(totalSettlement) || totalSettlement < 0) {
    return items.map((item) => ({
      settlementAmount: null,
      minimumAmount: item.minimumSettlement == null ? null : item.minimumSettlement * item.quantity,
      profitLoss: null,
    }));
  }

  const saleValues = items.map((item) => {
    if (item.salePrice == null || !Number.isFinite(item.salePrice) || item.salePrice < 0) return null;
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) return null;
    return item.salePrice * item.quantity;
  });

  const totalSaleValue = saleValues.every((value) => value != null)
    ? saleValues.reduce((sum, value) => sum + (value ?? 0), 0)
    : 0;

  if (totalSaleValue <= 0 || !saleValues.every((value) => value != null)) {
    return items.map((item) => ({
      settlementAmount: null,
      minimumAmount: item.minimumSettlement == null ? null : item.minimumSettlement * item.quantity,
      profitLoss: null,
    }));
  }

  const rawAllocations = saleValues.map((value) => totalSettlement * (value as number) / totalSaleValue);
  const roundedAllocations = rawAllocations.map((value) => Math.round(value));
  const roundedTotal = roundedAllocations.reduce((sum, value) => sum + value, 0);
  const lastIndex = roundedAllocations.length - 1;
  if (lastIndex >= 0) roundedAllocations[lastIndex] += Math.round(totalSettlement) - roundedTotal;

  return items.map((item, index) => {
    const settlementAmount = roundedAllocations[index];
    const minimumAmount = item.minimumSettlement == null ? null : item.minimumSettlement * item.quantity;
    return {
      settlementAmount,
      minimumAmount,
      profitLoss: minimumAmount == null ? null : settlementAmount - minimumAmount,
    };
  });
}

export function formatVND(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
