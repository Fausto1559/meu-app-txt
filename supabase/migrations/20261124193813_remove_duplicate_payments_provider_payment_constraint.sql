-- The non-partial unique index below is the conflict target used by the
-- recovery webhook's PostgREST upsert. Keep that index and remove the
-- equivalent UNIQUE constraint/index to avoid duplicate B-tree storage.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_payment_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class i
    JOIN pg_namespace n ON n.oid = i.relnamespace
    WHERE n.nspname = 'public'
      AND i.relname = 'payments_provider_payment_upsert_uidx'
      AND i.relkind = 'i'
  ) THEN
    RAISE EXCEPTION 'Required payments upsert unique index is missing';
  END IF;
END
$$;
