-- The recovery webhook uses PostgREST upsert with
-- ON CONFLICT (provider, provider_payment_id). PostgreSQL cannot infer a
-- partial unique index for that conflict target unless its predicate is
-- repeated. Keep a non-partial unique index for reliable inference.
--
-- PostgreSQL UNIQUE indexes allow multiple NULL provider_payment_id values,
-- so rows without a gateway payment ID remain valid.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.payments
    WHERE provider_payment_id IS NOT NULL
    GROUP BY provider, provider_payment_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create payments upsert index: duplicate (provider, provider_payment_id) values exist.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_upsert_uidx
  ON public.payments (provider, provider_payment_id);
