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
