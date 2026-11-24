-- Applied to production and homologation on 2026-11-24.
-- Prevents concurrent checkout requests from creating multiple open
-- local subscriptions for the same user.
create unique index if not exists subscriptions_one_open_per_user_uidx
on public.subscriptions(user_id)
where status in ('pending','active','overdue');
