-- ============================================================
-- Project Firefly — Full Reset
-- Drops everything and rebuilds schema, policies, and seed data.
-- Run this in Supabase SQL Editor.
--
-- Test accounts after running:
--   customer@test.firefly  / test1234
--   vendor@test.firefly    / test1234
--   delivery@test.firefly  / test1234
-- ============================================================


-- ------------------------------------------------------------
-- PART 1: DROP EVERYTHING
-- ------------------------------------------------------------

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.delivery_person_has_assignment(UUID);
DROP FUNCTION IF EXISTS public.update_updated_at();

-- Drop tables (cascade handles foreign keys)
DROP TABLE IF EXISTS public.delivery_assignments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.delivery_persons CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Remove test auth users
DELETE FROM auth.users WHERE email IN (
  'customer@test.firefly',
  'vendor@test.firefly',
  'delivery@test.firefly'
);


-- ------------------------------------------------------------
-- PART 2: SCHEMA
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  roles        TEXT[] DEFAULT ARRAY['customer']::TEXT[],
  default_role TEXT DEFAULT 'customer',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE public.vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  address     TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vendors_user_id_unique UNIQUE (user_id)
);

-- Menu items
CREATE TABLE public.menu_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  image_url    TEXT,
  category     TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery persons
CREATE TABLE public.delivery_persons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_active    BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  vehicle_type TEXT DEFAULT 'bike',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT delivery_persons_user_id_unique UNIQUE (user_id)
);

-- Orders
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES public.users(id),
  vendor_id         UUID NOT NULL REFERENCES public.vendors(id),
  delivery_person_id UUID REFERENCES public.delivery_persons(id),
  status            TEXT NOT NULL DEFAULT 'pending',
  vendor_accepted   BOOLEAN DEFAULT false,
  total_amount      DECIMAL(10,2) NOT NULL,
  delivery_address  TEXT NOT NULL,
  delivery_notes    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  name         TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery assignments
CREATE TABLE public.delivery_assignments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES public.delivery_persons(id),
  status             TEXT NOT NULL DEFAULT 'pending',
  assigned_at        TIMESTAMPTZ DEFAULT NOW(),
  accepted_at        TIMESTAMPTZ,
  picked_up_at       TIMESTAMPTZ,
  delivered_at       TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_orders_customer   ON public.orders(customer_id);
CREATE INDEX idx_orders_vendor     ON public.orders(vendor_id);
CREATE INDEX idx_orders_status     ON public.orders(status);
CREATE INDEX idx_menu_items_vendor ON public.menu_items(vendor_id);
CREATE INDEX idx_delivery_assignments_order  ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_person ON public.delivery_assignments(delivery_person_id);


-- ------------------------------------------------------------
-- PART 3: FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, roles, default_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '',
    ARRAY['customer'],
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURITY DEFINER function to check delivery assignments without recursion
CREATE OR REPLACE FUNCTION public.delivery_person_has_assignment(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_assignments da
    JOIN public.delivery_persons dp ON dp.id = da.delivery_person_id
    WHERE da.order_id = order_uuid
      AND dp.user_id = auth.uid()
  );
$$;


-- ------------------------------------------------------------
-- PART 4: ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_persons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users are viewable by everyone"  ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own record"      ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own record"      ON public.users FOR UPDATE USING (auth.uid() = id);

-- vendors
CREATE POLICY "Vendors are viewable by everyone" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Users can insert own vendor"      ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors can update own record"    ON public.vendors FOR UPDATE USING (auth.uid() = user_id);

-- menu_items
CREATE POLICY "Menu items are viewable by everyone"  ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Vendors can insert own menu items"    ON public.menu_items FOR INSERT WITH CHECK (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
CREATE POLICY "Vendors can update own menu items"    ON public.menu_items FOR UPDATE USING (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
CREATE POLICY "Vendors can delete own menu items"    ON public.menu_items FOR DELETE USING (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

-- delivery_persons
CREATE POLICY "Delivery persons viewable by everyone"    ON public.delivery_persons FOR SELECT USING (true);
CREATE POLICY "Users can create own delivery person"     ON public.delivery_persons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- orders
CREATE POLICY "Customers can view own orders"    ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Vendors can view their orders"    ON public.orders FOR SELECT USING (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
CREATE POLICY "Delivery can view assigned orders" ON public.orders FOR SELECT USING (
  delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  OR public.delivery_person_has_assignment(id)
);
CREATE POLICY "Customers can create orders"      ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own orders"  ON public.orders FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Vendors can update their orders"  ON public.orders FOR UPDATE USING (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
CREATE POLICY "Delivery can update assigned orders" ON public.orders FOR UPDATE USING (
  delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  OR public.delivery_person_has_assignment(id)
);

-- order_items
CREATE POLICY "Order items viewable with order access" ON public.order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders
    WHERE customer_id = auth.uid()
      OR vendor_id    IN (SELECT id FROM public.vendors          WHERE user_id = auth.uid())
      OR delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Customers can create order items" ON public.order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
);

-- delivery_assignments
CREATE POLICY "Delivery can view own assignments"  ON public.delivery_assignments FOR SELECT USING (
  delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
);
CREATE POLICY "Vendors can view order assignments" ON public.delivery_assignments FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  )
);
CREATE POLICY "System can create assignments"      ON public.delivery_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Delivery can update own assignments" ON public.delivery_assignments FOR UPDATE USING (
  delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;


-- ------------------------------------------------------------
-- PART 5: CREATE TEST AUTH USERS
-- ------------------------------------------------------------

DO $$
DECLARE
  customer_id UUID := '00000000-0000-0000-0000-000000000001';
  vendor_id   UUID := '00000000-0000-0000-0000-000000000002';
  delivery_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
  (
    customer_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'customer@test.firefly',
    crypt('test1234', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"name":"Test Customer"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    false, '', '', '', ''
  ),
  (
    vendor_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'vendor@test.firefly',
    crypt('test1234', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"name":"Maria Garcia"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    false, '', '', '', ''
  ),
  (
    delivery_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'delivery@test.firefly',
    crypt('test1234', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"name":"Alex Johnson"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    false, '', '', '', ''
  );
END $$;


-- ------------------------------------------------------------
-- PART 6: SEED DATA
-- ------------------------------------------------------------

INSERT INTO public.users (id, email, name, phone, roles, default_role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer@test.firefly', 'Test Customer', '555-0101', ARRAY['customer'],  'customer'),
  ('00000000-0000-0000-0000-000000000002', 'vendor@test.firefly',   'Maria Garcia',  '555-0102', ARRAY['vendor'],    'vendor'),
  ('00000000-0000-0000-0000-000000000003', 'delivery@test.firefly', 'Alex Johnson',  '555-0103', ARRAY['delivery'],  'delivery')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vendors (id, user_id, name, description, address, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'Maria''s Kitchen', 'Authentic homemade Mexican food prepared with love.', '123 Main Street, Downtown', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.menu_items (id, vendor_id, name, description, price, category, is_available) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chicken Tacos',     'Three soft corn tortillas with seasoned chicken, fresh cilantro, onions, and salsa verde',            12.99, 'Tacos',       true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Beef Burrito',      'Large flour tortilla stuffed with seasoned ground beef, rice, beans, cheese, and pico de gallo',     14.99, 'Burritos',    true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Veggie Quesadilla', 'Grilled flour tortilla with melted cheese, peppers, onions, and mushrooms. Served with sour cream',  10.99, 'Quesadillas', true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Chips & Guacamole', 'Fresh house-made guacamole with crispy tortilla chips',                                               7.99, 'Sides',       true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Horchata',          'Traditional Mexican rice drink with cinnamon (16oz)',                                                 3.99, 'Drinks',      true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_persons (id, user_id, is_active, is_available, vehicle_type) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', true, true, 'bike')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Done.
--   customer@test.firefly  / test1234
--   vendor@test.firefly    / test1234
--   delivery@test.firefly  / test1234
-- ============================================================
