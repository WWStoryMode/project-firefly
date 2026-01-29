-- Project Firefly - Seed Data for Demo
-- Creates demo accounts, vendor, menu items, and delivery person

-- Note: Run this after creating auth users in Supabase Dashboard
-- Demo users will be created with these emails:
-- - customer@demo.firefly (password: demo1234)
-- - vendor@demo.firefly (password: demo1234)
-- - delivery@demo.firefly (password: demo1234)

-- Insert demo users (after auth.users are created)
-- These UUIDs should match the auth.users IDs created in Supabase

-- Demo Customer
INSERT INTO public.users (id, email, name, phone, roles, default_role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'customer@demo.firefly',
  'Demo Customer',
  '555-0101',
  ARRAY['customer'],
  'customer'
) ON CONFLICT (id) DO NOTHING;

-- Demo Vendor Owner
INSERT INTO public.users (id, email, name, phone, roles, default_role)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'vendor@demo.firefly',
  'Maria Garcia',
  '555-0102',
  ARRAY['vendor'],
  'vendor'
) ON CONFLICT (id) DO NOTHING;

-- Demo Delivery Person
INSERT INTO public.users (id, email, name, phone, roles, default_role)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'delivery@demo.firefly',
  'Alex Johnson',
  '555-0103',
  ARRAY['delivery'],
  'delivery'
) ON CONFLICT (id) DO NOTHING;

-- Demo Vendor: Maria's Kitchen
INSERT INTO public.vendors (id, user_id, name, description, address, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Maria''s Kitchen',
  'Authentic homemade Mexican food prepared with love. Fresh ingredients sourced locally.',
  '123 Main Street, Downtown',
  true
) ON CONFLICT (id) DO NOTHING;

-- Menu Items for Maria's Kitchen
INSERT INTO public.menu_items (id, vendor_id, name, description, price, category, is_available) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Chicken Tacos',
  'Three soft corn tortillas with seasoned chicken, fresh cilantro, onions, and salsa verde',
  12.99,
  'Tacos',
  true
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Beef Burrito',
  'Large flour tortilla stuffed with seasoned ground beef, rice, beans, cheese, and pico de gallo',
  14.99,
  'Burritos',
  true
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'Veggie Quesadilla',
  'Grilled flour tortilla with melted cheese, peppers, onions, and mushrooms. Served with sour cream',
  10.99,
  'Quesadillas',
  true
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  'Chips & Guacamole',
  'Fresh house-made guacamole with crispy tortilla chips',
  7.99,
  'Sides',
  true
),
(
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'Horchata',
  'Traditional Mexican rice drink with cinnamon (16oz)',
  3.99,
  'Drinks',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Demo Delivery Person Profile
INSERT INTO public.delivery_persons (id, user_id, is_active, is_available, vehicle_type)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  true,
  true,
  'bike'
) ON CONFLICT (id) DO NOTHING;
