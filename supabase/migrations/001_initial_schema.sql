-- Project Firefly - Initial Database Schema
-- Minimal schema for MVP demo

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  roles TEXT[] DEFAULT ARRAY['customer']::TEXT[],
  default_role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery persons table
CREATE TABLE public.delivery_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  vehicle_type TEXT DEFAULT 'bike',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  delivery_person_id UUID REFERENCES public.delivery_persons(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table (stores snapshot of items at order time)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery assignments table
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES public.delivery_persons(id),
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_menu_items_vendor ON public.menu_items(vendor_id);
CREATE INDEX idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_person ON public.delivery_assignments(delivery_person_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo (permissive for testing)

-- Users: can read all, update own
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Vendors: readable by everyone
CREATE POLICY "Vendors are viewable by everyone" ON public.vendors
  FOR SELECT USING (true);
CREATE POLICY "Vendors can update own record" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

-- Menu items: readable by everyone
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items
  FOR SELECT USING (true);

-- Orders: customers see own, vendors see theirs, delivery sees assigned
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Vendors can view their orders" ON public.orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Delivery can view assigned orders" ON public.orders
  FOR SELECT USING (
    delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  );
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Vendors can update their orders" ON public.orders
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Delivery can update assigned orders" ON public.orders
  FOR UPDATE USING (
    delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  );

-- Order items: same as orders
CREATE POLICY "Order items viewable with order access" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()
        OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
        OR delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Customers can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

-- Delivery persons: readable by everyone
CREATE POLICY "Delivery persons viewable by everyone" ON public.delivery_persons
  FOR SELECT USING (true);

-- Delivery assignments
CREATE POLICY "Delivery can view own assignments" ON public.delivery_assignments
  FOR SELECT USING (
    delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  );
CREATE POLICY "Vendors can view order assignments" ON public.delivery_assignments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "System can create assignments" ON public.delivery_assignments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Delivery can update own assignments" ON public.delivery_assignments
  FOR UPDATE USING (
    delivery_person_id IN (SELECT id FROM public.delivery_persons WHERE user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for orders and assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
