-- Insert policies for lazy role provisioning
-- Allows authenticated users to create their own vendor/delivery records when switching roles

CREATE POLICY "Users can insert own vendor" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own delivery person" ON public.delivery_persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
