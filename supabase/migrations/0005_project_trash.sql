-- Real Growth — staff can take a listing offline or move it to the trash
-- Run once in the Supabase SQL editor, after 0004_project_address.sql.
--
-- hidden:  a live listing our team took off the site. The lister can edit it
--          and send it back for review; staff can put it straight back live.
-- trashed: removed by our team. Hidden from buyers and from the lister, and
--          deleted for good (with its photos and leads) 30 days after
--          trashed_at — see src/lib/trash.ts and /api/cron/purge-trash.
--          status_before_trash is what "Restore" puts back.

-- New enum values can't be added inside a transaction block on older Postgres.
alter type project_status add value if not exists 'hidden';
alter type project_status add value if not exists 'trashed';

begin;

alter table projects
  add column if not exists trashed_at timestamptz,
  add column if not exists status_before_trash project_status;

create index if not exists projects_trashed_idx on projects (trashed_at) where trashed_at is not null;

commit;
