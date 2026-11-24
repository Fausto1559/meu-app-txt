create policy "deny client access to admin memberships"
on public.admin_memberships
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny client access to admin audit logs"
on public.admin_audit_logs
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

create index if not exists admin_memberships_created_by_idx
on public.admin_memberships (created_by)
where created_by is not null;
