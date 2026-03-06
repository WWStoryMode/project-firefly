-- Ensure each user can only have one delivery_person record
-- Before adding constraint, remove duplicates by keeping the oldest per user_id
DELETE FROM public.delivery_assignments
WHERE delivery_person_id IN (
  SELECT id FROM public.delivery_persons
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.delivery_persons
    ORDER BY user_id, created_at ASC
  )
);

DELETE FROM public.delivery_persons
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.delivery_persons
  ORDER BY user_id, created_at ASC
);

ALTER TABLE public.delivery_persons
  ADD CONSTRAINT delivery_persons_user_id_unique UNIQUE (user_id);

-- Re-ensure INSERT policies exist (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'delivery_persons'
      AND policyname = 'Users can create own delivery person'
  ) THEN
    CREATE POLICY "Users can create own delivery person" ON public.delivery_persons
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vendors'
      AND policyname = 'Users can insert own vendor'
  ) THEN
    CREATE POLICY "Users can insert own vendor" ON public.vendors
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
