// Database types for Supabase
// These match the schema defined in migrations/001_initial_schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type DeliveryAssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'delivered';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          avatar_url: string | null;
          roles: string[];
          default_role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          avatar_url?: string | null;
          roles?: string[];
          default_role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          roles?: string[];
          default_role?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          logo_url: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          is_active?: boolean;
        };
      };
      menu_items: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: string | null;
          is_available?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          vendor_id: string;
          delivery_person_id: string | null;
          status: OrderStatus;
          total_amount: number;
          delivery_address: string;
          delivery_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vendor_id: string;
          delivery_person_id?: string | null;
          status?: OrderStatus;
          total_amount: number;
          delivery_address: string;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vendor_id?: string;
          delivery_person_id?: string | null;
          status?: OrderStatus;
          total_amount?: number;
          delivery_address?: string;
          delivery_notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          name: string;
          quantity: number;
          unit_price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          name: string;
          quantity?: number;
          unit_price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          name?: string;
          quantity?: number;
          unit_price?: number;
          notes?: string | null;
        };
      };
      delivery_persons: {
        Row: {
          id: string;
          user_id: string | null;
          is_active: boolean;
          is_available: boolean;
          vehicle_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          vehicle_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          vehicle_type?: string;
        };
      };
      delivery_assignments: {
        Row: {
          id: string;
          order_id: string;
          delivery_person_id: string;
          status: DeliveryAssignmentStatus;
          assigned_at: string;
          accepted_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          delivery_person_id: string;
          status?: DeliveryAssignmentStatus;
          assigned_at?: string;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          delivery_person_id?: string;
          status?: DeliveryAssignmentStatus;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
        };
      };
    };
  };
}

// Helper types for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type Vendor = Database['public']['Tables']['vendors']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type DeliveryPerson = Database['public']['Tables']['delivery_persons']['Row'];
export type DeliveryAssignment = Database['public']['Tables']['delivery_assignments']['Row'];

// Order with items and vendor info
export interface OrderWithDetails extends Order {
  items: OrderItem[];
  vendor: Vendor;
  delivery_person?: DeliveryPerson & { user: User };
}
