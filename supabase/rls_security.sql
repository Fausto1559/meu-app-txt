ALTER TABLE IF EXISTS public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_records FORCE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios visualizam apenas seus proprios lancamentos"
  ON public.financial_records FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Usuarios inserem apenas em sua propria conta"
  ON public.financial_records FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Usuarios atualizam apenas seus proprios lancamentos"
  ON public.financial_records FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Usuarios excluem apenas seus proprios lancamentos"
  ON public.financial_records FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);