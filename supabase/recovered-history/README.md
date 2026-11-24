# Recovered Supabase migration history (archive only)

Inspection/recovery date: 2026-11-24.

These six SQL files were restored from the authoritative `supabase_migrations.schema_migrations.statements` rows in the database where each version was originally applied. They preserve environment-specific historical SQL that was not present in the repository's Git history.

## Contents

- `production/`: versions `20261118101033` and `20261118101616`, recovered from project `genbxhvhmrgyflptnrpi`.
- `homologation/`: versions `20261118172905`, `20261118173002`, `20261123150254`, and `20261123150310`, recovered from project `eerqeimqzkgdpvutjfhm`.

The database migration records returned `rollback = NULL` for these six versions.

## Important — do not execute from this directory

This is a source archive, not an active Supabase migration directory. Keep these files outside `supabase/migrations/`.

Production and homologation have different migration version histories. If both sets were placed into one active migration directory, each database could consider the other environment's historical versions pending. Some archived SQL uses non-idempotent `CREATE TABLE` statements and could fail or conflict with the later schema.

Before any future migration push:
1. Compare each target database's recorded versions to the active migration set.
2. Use an explicitly environment-specific migration strategy or a reviewed baseline/schema reconciliation.
3. Do not apply the other environment's archived SQL merely to make version numbers match.

No SQL from these archive files was executed as part of this recovery step.
