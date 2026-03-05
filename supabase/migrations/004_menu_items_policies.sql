-- RLS policies for vendors to manage their own menu items

CREATE POLICY "Vendors can insert own menu items" ON public.menu_items
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors can update own menu items" ON public.menu_items
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
