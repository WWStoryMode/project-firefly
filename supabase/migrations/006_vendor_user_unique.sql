-- Ensure each user can only have one vendor record
-- Before adding constraint, remove any duplicates by keeping the oldest per user_id
DELETE FROM public.vendors
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.vendors
  ORDER BY user_id, created_at ASC
);

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_user_id_unique UNIQUE (user_id);
