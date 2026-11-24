-- The production owner membership was provisioned as a one-time,
-- environment-specific operation on 2026-11-24 after verifying exactly one
-- confirmed account matched the authorized owner identity.
-- Do not auto-assign owner privileges in other environments.
do $$
begin
  raise notice 'Owner membership is environment-specific and must be provisioned through the approved operator workflow.';
end
$$;
