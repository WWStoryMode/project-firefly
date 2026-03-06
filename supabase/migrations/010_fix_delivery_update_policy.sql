-- Fix existing orders that are missing delivery_person_id
-- (Orders placed before the customer UPDATE policy was added)
UPDATE public.orders o
SET delivery_person_id = da.delivery_person_id
FROM public.delivery_assignments da
WHERE da.order_id = o.id
  AND o.delivery_person_id IS NULL;

-- Extend delivery UPDATE policy to also match via delivery_assignments
-- Uses the same SECURITY DEFINER function from migration 009 to avoid recursion
DROP POLICY IF EXISTS "Delivery can update assigned orders" ON public.orders;
CREATE POLICY "Delivery can update assigned orders" ON public.orders
  FOR UPDATE USING (
    delivery_person_id IN (
      SELECT id FROM public.delivery_persons WHERE user_id = auth.uid()
    )
    OR public.delivery_person_has_assignment(id)
  );
