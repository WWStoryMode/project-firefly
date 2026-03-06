-- Fix infinite recursion: delivery orders policy referenced delivery_assignments
-- which has a foreign key back to orders, causing a loop.
-- Use a SECURITY DEFINER function to break the cycle.

DROP POLICY IF EXISTS "Delivery can view assigned orders" ON public.orders;

-- This function runs as DB owner (bypasses RLS), so it can safely query
-- delivery_assignments without re-triggering the orders policy.
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

CREATE POLICY "Delivery can view assigned orders" ON public.orders
  FOR SELECT USING (
    delivery_person_id IN (
      SELECT id FROM public.delivery_persons WHERE user_id = auth.uid()
    )
    OR public.delivery_person_has_assignment(id)
  );
