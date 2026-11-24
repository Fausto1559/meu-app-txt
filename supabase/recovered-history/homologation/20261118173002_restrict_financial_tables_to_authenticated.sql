
revoke all privileges on table public.financial_records from anon, public;
revoke all privileges on table public.card_machines from anon, public;
revoke all privileges on table public.financial_records from authenticated;
revoke all privileges on table public.card_machines from authenticated;

grant select, insert, update, delete
  on table public.financial_records to authenticated;
grant select, insert, update, delete
  on table public.card_machines to authenticated;
