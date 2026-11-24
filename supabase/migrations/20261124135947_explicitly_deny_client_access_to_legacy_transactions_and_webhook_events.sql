-- Applied to production on 2026-11-24.
-- Financial legacy rows remain governed by any existing ownership policies;
-- this explicit deny policy prevents access where no narrower allow policy exists.
create policy "deny client access to legacy financial transactions"
on public.transacoes_financeiras
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny client access to webhook events"
on public.webhook_events
for all
to anon, authenticated
using (false)
with check (false);
