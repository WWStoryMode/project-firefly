-- Allow the server (running as customer) to update their own orders
-- This is needed so delivery_person_id gets set when an order is placed
CREATE POLICY "Customers can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = customer_id);

-- Extend delivery order visibility to also cover orders linked via delivery_assignments
-- Handles the case where orders.delivery_person_id wasn't set due to the missing policy above
DROP POLICY IF EXISTS "Delivery can view assigned orders" ON public.orders;
CREATE POLICY "Delivery can view assigned orders" ON public.orders
  FOR SELECT USING (
    delivery_person_id IN (
      SELECT id FROM public.delivery_persons WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT order_id FROM public.delivery_assignments
      WHERE delivery_person_id IN (
        SELECT id FROM public.delivery_persons WHERE user_id = auth.uid()
      )
    )
  );
