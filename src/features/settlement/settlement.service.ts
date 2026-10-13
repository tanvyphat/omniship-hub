import { supabase } from '../../lib/supabase';
import type { DocumentItemInput, Platform } from '../../types/document';

export interface ProductPriceRule {
  platform: Platform;
  sku: string;
  product_name: string;
  sale_price: number;
  minimum_payout: number;
  cost_price: number | null;
}
export interface OrderPayout {
  platform: Platform;
  order_code: string;
  payout_amount: number;
  payout_kind: 'estimated' | 'actual';
  source_file?: string | null;
}
export type SettlementLine = Omit<DocumentItemInput, 'salePrice' | 'settlementAmount' | 'costPrice'> & {
  salePrice: number | null;
  settlementAmount: number | null;
  costPrice: number | null;
  minimumPayout: number | null;
  grossAmount: number | null;
  allocatedPayout: number | null;
  targetAmount: number | null;
  targetDifference: number | null;
  profit: number | null;
};
export interface SettlementOrderReport {
  orderCode: string;
  payout: OrderPayout | null;
  saleTotal: number;
  targetTotal: number;
  costTotal: number;
  allocatedTotal: number | null;
  targetDifference: number | null;
  profit: number | null;
  lines: SettlementLine[];
}

export async function fetchSettlementReport(platform: Platform, items: DocumentItemInput[]): Promise<SettlementOrderReport[]> {
  const orderCodes = [...new Set(items.map((item) => item.orderCode.trim()).filter(Boolean))];
  const skus = [...new Set(items.map((item) => item.sku.trim()).filter(Boolean))];
  if (!orderCodes.length) return [];
  const [priceResult, payoutResult] = await Promise.all([
    skus.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('marketplace_product_prices').select('platform, sku, product_name, sale_price, minimum_payout, cost_price').eq('platform', platform).in('sku', skus)
      : Promise.resolve({ data: [], error: null }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('marketplace_order_settlements').select('platform, order_code, payout_amount, payout_kind, source_file').eq('platform', platform).in('order_code', orderCodes),
  ]);
  if (priceResult.error) throw priceResult.error;
  if (payoutResult.error) throw payoutResult.error;
  const prices = new Map<string, ProductPriceRule>((priceResult.data ?? []).map((row: ProductPriceRule) => [row.sku.trim(), row] as const));
  const payouts = new Map<string, OrderPayout>((payoutResult.data ?? []).map((row: OrderPayout) => [row.order_code.trim(), row] as const));
  const grouped = new Map<string, DocumentItemInput[]>();
  for (const item of items) {
    const key = item.orderCode.trim();
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return [...grouped.entries()].map(([orderCode, orderItems]) => {
    const lines: SettlementLine[] = orderItems.map((item) => {
      const price = prices.get(item.sku.trim());
      const quantity = Math.max(0, Number(item.quantity) || 0);
      return {
        ...item,
        salePrice: price ? Number(price.sale_price) : null,
        minimumPayout: price ? Number(price.minimum_payout) : null,
        costPrice: price && price.cost_price !== null ? Number(price.cost_price) : null,
        grossAmount: price ? Number(price.sale_price) * quantity : null,
        allocatedPayout: null,
        targetAmount: price ? Number(price.minimum_payout) * quantity : null,
        targetDifference: null,
        profit: null,
      };
    });
    const saleTotal = lines.reduce((sum, line) => sum + (line.grossAmount ?? 0), 0);
    const targetTotal = lines.reduce((sum, line) => sum + (line.targetAmount ?? 0), 0);
    const costTotal = lines.reduce((sum, line) => sum + (line.costPrice ?? 0) * line.quantity, 0);
    const payout = payouts.get(orderCode) ?? null;
    const canAllocate = lines.every((line) => line.grossAmount !== null) && saleTotal > 0;
    if (payout && canAllocate) {
      let allocatedSoFar = 0;
      const pricedLines = lines.filter((line) => line.grossAmount !== null && line.grossAmount > 0);
      const lastLine = pricedLines[pricedLines.length - 1];
      for (const line of lines) {
        if (line.grossAmount === null || line.grossAmount <= 0) continue;
        const allocated = line === lastLine
          ? Number(payout.payout_amount) - allocatedSoFar
          : Math.round(Number(payout.payout_amount) * line.grossAmount / saleTotal);
        line.allocatedPayout = allocated;
        allocatedSoFar += allocated;
        line.targetDifference = line.targetAmount === null ? null : allocated - line.targetAmount;
        line.profit = line.costPrice === null ? null : allocated - line.costPrice * line.quantity;
      }
    }
    const allocatedTotal = payout && canAllocate ? Number(payout.payout_amount) : null;
    const hasAllTargets = lines.every((line) => line.targetAmount !== null);
    const hasAllCosts = lines.every((line) => line.costPrice !== null);
    return {
      orderCode,
      payout,
      saleTotal,
      targetTotal,
      costTotal,
      allocatedTotal,
      targetDifference: allocatedTotal !== null && hasAllTargets ? allocatedTotal - targetTotal : null,
      profit: allocatedTotal !== null && hasAllCosts ? allocatedTotal - costTotal : null,
      lines,
    };
  });
}

export async function saveOrderPayout(platform: Platform, orderCode: string, payoutAmount: number, payoutKind: 'estimated' | 'actual', sourceFile: string | null = null) {
  if (!orderCode.trim()) throw new Error('Mã đơn hàng không được để trống.');
  if (!Number.isFinite(payoutAmount) || payoutAmount < 0) throw new Error('Tiền quyết toán phải là số không âm.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('marketplace_order_settlements').upsert({
    platform,
    order_code: orderCode.trim(),
    payout_amount: payoutAmount,
    payout_kind: payoutKind,
    source_file: sourceFile,
  }, { onConflict: 'platform,order_code' });
  if (error) throw error;
}
