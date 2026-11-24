-- Lease timestamps allow safe reclamation of webhook events abandoned by
-- a terminated serverless invocation. Existing processing rows use received_at
-- as their initial lease origin.
alter table public.webhook_events
  add column if not exists processing_started_at timestamptz;

update public.webhook_events
   set processing_started_at = received_at
 where processing_status = 'processing'
   and processing_started_at is null;

create index if not exists webhook_events_processing_lease_idx
  on public.webhook_events(processing_started_at)
  where processing_status = 'processing';
