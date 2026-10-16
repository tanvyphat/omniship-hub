export type Platform = 'tiktok' | 'shopee';
export type DocumentType = 'outbound' | 'return';

export interface DocumentItemInput {
  orderGroupId?: string;
  orderCode: string;
  productName: string;
  sku: string;
  variant: string;
  unit: string;
  quantity: number;
  orderSettlementAmount: number | null;
  salePrice: number | null;
  minimumSettlement: number | null;
}

export interface DocumentInput {
  platform: Platform;
  type: DocumentType;
  documentDate: string;
  items: DocumentItemInput[];
}

export interface DocumentHistoryItem {
  id: string;
  platform: Platform;
  type: DocumentType;
  documentDate: string;
  orderCount: number;
  itemCount: number;
  totalQuantity: number;
  totalSettlement: number;
  totalProfitLoss: number | null;
  createdAt: string;
}
