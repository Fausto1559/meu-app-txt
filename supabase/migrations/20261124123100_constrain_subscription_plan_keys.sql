alter table public.subscriptions
  add constraint subscriptions_plan_key_valid
  check (plan_key in ('essencial','profissional','pro'));
