-- The setter was only needed during initial Stripe provisioning.
-- Runtime code only needs the read-only get_runtime_secret RPC.
DROP FUNCTION IF EXISTS public.set_runtime_secret(text, text, text);
