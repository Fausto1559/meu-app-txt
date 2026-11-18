-- Política de acesso alinhada ao schema efetivamente utilizado pelo Copiloto Financeiro.
-- Execute somente após revisar o schema do projeto Supabase de destino.

ALTER TABLE IF EXISTS public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.card_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios visualizam apenas seus proprios lancamentos" ON public.financial_records;
DROP POLICY IF EXISTS "Usuarios inserem apenas em sua propria conta" ON public.financial_records;
DROP POLICY IF EXISTS "Usuarios atualizam apenas seus proprios lancamentos" ON public.financial_records;
DROP POLICY IF EXISTS "Usuarios excluem apenas seus proprios lancamentos" ON public.financial_records;
DROP POLICY IF EXISTS "Users manage own financial records" ON public.financial_records;
CREATE POLICY "Users manage own financial records"
  ON public.financial_records FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own card machines" ON public.card_machines;
CREATE POLICY "Users manage own card machines"
  ON public.card_machines FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Eventos de webhook são gravados somente pelo backend com service_role.
-- Não conceder acesso direto a anon/authenticated nem criar policy para esses papéis.
REVOKE ALL PRIVILEGES ON TABLE public.webhook_events FROM PUBLIC, anon, authenticated;

-- Tabela legada: sem consumidor ativo confirmado; manter inacessível pela Data API.
REVOKE ALL PRIVILEGES ON TABLE public.transacoes_financeiras FROM PUBLIC, anon, authenticated;
