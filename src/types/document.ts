export type Platform = 'tiktok' | 'shopee';
export type DocumentType = 'outbound' | 'return';

export interface DocumentItemInput {
  orderCode: string;
  productName: string;
  sku: string;
  variant: string;
  unit: string;
  quantity: number;
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
  createdAt: string;
}
