-- Allow users to update their own profile (e.g. adding roles)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow vendors to update their own vendor record (name, address, is_active)
CREATE POLICY "Vendors can update own vendor" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow vendors to delete their own menu items (for bulk clear)
CREATE POLICY "Vendors can delete own menu items" ON public.menu_items
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
