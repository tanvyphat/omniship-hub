export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      warehouse_documents: {
        Row: {
          id: string;
          platform: 'tiktok' | 'shopee';
          type: 'outbound' | 'return';
          document_date: string;
          order_code: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: 'tiktok' | 'shopee';
          type: 'outbound' | 'return';
          document_date: string;
          order_code?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['warehouse_documents']['Insert']>;
      };
      marketplace_product_prices: {
        Row: { id: string; platform: 'tiktok' | 'shopee'; sku: string; product_name: string; sale_price: number; minimum_payout: number; cost_price: number | null; updated_at: string; created_at: string };
        Insert: { id?: string; platform: 'tiktok' | 'shopee'; sku: string; product_name: string; sale_price: number; minimum_payout: number; cost_price?: number | null; updated_at?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['marketplace_product_prices']['Insert']>;
      };
      marketplace_order_settlements: {
        Row: { id: string; platform: 'tiktok' | 'shopee'; order_code: string; payout_amount: number; payout_kind: 'estimated' | 'actual'; source_file: string | null; updated_at: string; created_at: string };
        Insert: { id?: string; platform: 'tiktok' | 'shopee'; order_code: string; payout_amount: number; payout_kind?: 'estimated' | 'actual'; source_file?: string | null; updated_at?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['marketplace_order_settlements']['Insert']>;
      };
      warehouse_document_items: {
        Row: {
          id: string;
          document_id: string;
          order_code: string;
          product_name: string;
          sku: string;
          unit: string;
          variant: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          order_code: string;
          product_name: string;
          sku: string;
          unit: string;
          variant: string;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['warehouse_document_items']['Insert']>;
      };
    };
    Functions: {
      create_warehouse_document: {
        Args: { p_document: Json; p_items: Json };
        Returns: string;
      };
      update_warehouse_document: {
        Args: { p_document_id: string; p_document: Json; p_items: Json };
        Returns: string;
      };
    };
  };
}
