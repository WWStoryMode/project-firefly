// User roles
export type UserRole = 'customer' | 'vendor' | 'delivery';

// User profile
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  roles: UserRole[];
  default_role?: UserRole;
  created_at: string;
  updated_at: string;
}

// Vendor profile
export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  operating_hours?: Record<string, { open: string; close: string }>;
  created_at: string;
}

// Menu item
export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  ingredients?: string[];
  daily_limit?: number;
  is_available: boolean;
  category?: string;
  created_at: string;
}

// Order status
export type OrderStatus =
  | 'pending_delivery'     // Waiting for delivery assignment
  | 'confirmed'            // Delivery assigned, vendor notified
  | 'preparing'            // Vendor is preparing
  | 'ready'                // Ready for pickup
  | 'picked_up'            // Delivery picked up
  | 'delivered'            // Completed
  | 'cancelled';           // Cancelled

// Order
export interface Order {
  id: string;
  customer_id: string;
  vendor_id: string;
  delivery_id?: string;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  delivery_address: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

// Order item
export interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

// Delivery profile
export interface DeliveryProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  current_location?: { lat: number; lng: number };
  vehicle_type?: 'bike' | 'car' | 'scooter' | 'walking';
  created_at: string;
}

// Time slot for delivery availability
export interface TimeSlot {
  id: string;
  delivery_id: string;
  date: string;
  start_time: string;
  end_time: string;
  vendor_ids: string[];  // Which vendors they'll serve
}

// Chat message
export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: UserRole | 'system';
  content: string;
  message_type: 'text' | 'status_update' | 'system';
  created_at: string;
}

// Order chat (group chat for an order)
export interface OrderChat {
  id: string;
  order_id: string;
  created_at: string;
}

// Community feed activity
export interface ActivityFeedItem {
  id: string;
  type: 'order_placed' | 'order_delivered' | 'vendor_joined' | 'delivery_milestone';
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  description: string;
  created_at: string;
}
