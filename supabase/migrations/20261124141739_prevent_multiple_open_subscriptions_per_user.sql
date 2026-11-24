-- Applied to homologation on 2026-11-24.
-- Production applied the equivalent constraint as migration 20261124141736.
-- Keep this version because the homologation database records this timestamp.
create unique index if not exists subscriptions_one_open_per_user_uidx
on public.subscriptions(user_id)
where status in ('pending','active','overdue');
