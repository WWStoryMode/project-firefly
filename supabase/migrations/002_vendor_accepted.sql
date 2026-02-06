-- Add vendor_accepted column to orders table
-- This enables AND logic: both vendor AND delivery must accept before order is confirmed

ALTER TABLE public.orders ADD COLUMN vendor_accepted BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.orders.vendor_accepted IS 'True when vendor has accepted the order. Order status becomes confirmed only when both vendor_accepted=true AND delivery assignment status=accepted';
