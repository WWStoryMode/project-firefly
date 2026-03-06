-- ============================================================
-- Project Firefly — Reset & Seed
-- Run this in Supabase SQL Editor to wipe all data and create
-- three ready-to-use test accounts.
--
-- Credentials after running:
--   customer@test.firefly  / test1234  (customer role)
--   vendor@test.firefly    / test1234  (vendor role)
--   delivery@test.firefly  / test1234  (delivery role)
-- ============================================================

-- ------------------------------------------------------------
-- 1. WIPE all app data (preserves schema & policies)
-- ------------------------------------------------------------
DELETE FROM public.delivery_assignments;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.menu_items;
DELETE FROM public.delivery_persons;
DELETE FROM public.vendors;
DELETE FROM public.users;

-- Remove existing test auth users (ignore errors if they don't exist)
DELETE FROM auth.users WHERE email IN (
  'customer@test.firefly',
  'vendor@test.firefly',
  'delivery@test.firefly'
);

-- ------------------------------------------------------------
-- 2. CREATE auth users
--    Using Supabase's built-in function so passwords are hashed
--    correctly and sessions work immediately (no email confirm needed).
-- ------------------------------------------------------------
SELECT extensions.uuid_generate_v4(); -- ensure uuid extension is loaded

DO $$
DECLARE
  customer_id  UUID := '00000000-0000-0000-0000-000000000001';
  vendor_id    UUID := '00000000-0000-0000-0000-000000000002';
  delivery_id  UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Customer
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    customer_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'customer@test.firefly',
    crypt('test1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Test Customer"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  );

  -- Vendor
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    vendor_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vendor@test.firefly',
    crypt('test1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Maria Garcia"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  );

  -- Delivery
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    delivery_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'delivery@test.firefly',
    crypt('test1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Alex Johnson"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  );
END $$;

-- ------------------------------------------------------------
-- 3. SEED public.users profiles
-- ------------------------------------------------------------
INSERT INTO public.users (id, email, name, phone, roles, default_role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer@test.firefly',  'Test Customer', '555-0101', ARRAY['customer'],         'customer'),
  ('00000000-0000-0000-0000-000000000002', 'vendor@test.firefly',    'Maria Garcia',  '555-0102', ARRAY['vendor'],           'vendor'),
  ('00000000-0000-0000-0000-000000000003', 'delivery@test.firefly',  'Alex Johnson',  '555-0103', ARRAY['delivery'],         'delivery')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. SEED vendor & menu
-- ------------------------------------------------------------
INSERT INTO public.vendors (id, user_id, name, description, address, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Maria''s Kitchen',
  'Authentic homemade Mexican food prepared with love.',
  '123 Main Street, Downtown',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.menu_items (id, vendor_id, name, description, price, category, is_available) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chicken Tacos',     'Three soft corn tortillas with seasoned chicken, fresh cilantro, onions, and salsa verde',               12.99, 'Tacos',       true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Beef Burrito',      'Large flour tortilla stuffed with seasoned ground beef, rice, beans, cheese, and pico de gallo',        14.99, 'Burritos',    true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Veggie Quesadilla', 'Grilled flour tortilla with melted cheese, peppers, onions, and mushrooms. Served with sour cream',     10.99, 'Quesadillas', true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Chips & Guacamole', 'Fresh house-made guacamole with crispy tortilla chips',                                                  7.99, 'Sides',       true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Horchata',          'Traditional Mexican rice drink with cinnamon (16oz)',                                                    3.99, 'Drinks',      true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. SEED delivery person profile
-- ------------------------------------------------------------
INSERT INTO public.delivery_persons (id, user_id, is_active, is_available, vehicle_type)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  true, true, 'bike'
) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Done. Test accounts:
--   customer@test.firefly  / test1234
--   vendor@test.firefly    / test1234
--   delivery@test.firefly  / test1234
-- ------------------------------------------------------------
