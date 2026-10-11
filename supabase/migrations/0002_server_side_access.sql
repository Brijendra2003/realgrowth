-- Real Growth — production access model
-- Run once in the Supabase SQL editor, after 0001_init.sql. Then run seed.sql.
--
-- The app talks to the database only from the server, with the service role
-- key, and keeps its own accounts (mobile number + password hash) in
-- `profiles`. So: no dependency on Supabase Auth, Row Level Security stays ON
-- with no policies (the public anon key can read and write nothing), and the
-- helpers that relied on auth.uid() go away.

begin;

-- ───────────── Accounts live in profiles ─────────────
alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();
alter table profiles alter column role drop default;
alter table profiles alter column phone set not null;
alter table profiles add column if not exists password_hash text not null;

-- Removing a staff account must not be blocked by, or erase, their review trail
alter table projects drop constraint if exists projects_verified_by_fkey;
alter table projects add constraint projects_verified_by_fkey
  foreign key (verified_by) references profiles(id) on delete set null;
alter table project_reviews alter column reviewer_id drop not null;
alter table project_reviews drop constraint if exists project_reviews_reviewer_id_fkey;
alter table project_reviews add constraint project_reviews_reviewer_id_fkey
  foreign key (reviewer_id) references profiles(id) on delete set null;

-- The audit log also records non-uuid entities (areas)
alter table activity_log alter column entity_id type text using entity_id::text;

-- ───────────── Drop everything that depended on auth.uid() ─────────────
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Re-review of key-field edits and "only staff can verify" are enforced in the server actions
drop trigger if exists projects_requeue on projects;
drop function if exists projects_requeue_on_key_change();
drop function if exists is_staff();
drop function if exists auth_role();

-- ───────────── View counter that doesn't count as an edit ─────────────
create or replace function projects_touch_updated_at() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'views_count' - 'updated_at') is distinct from (to_jsonb(old) - 'views_count' - 'updated_at') then
    new.updated_at = now();
  end if;
  return new;
end $$;
drop trigger if exists projects_touch on projects;
create trigger projects_touch before update on projects for each row execute function projects_touch_updated_at();

create or replace function increment_project_views(p_id uuid) returns void
language sql set search_path = public as $$
  update projects set views_count = views_count + 1 where id = p_id and status = 'verified'
$$;

-- ───────────── Rate limiting (sign-in, sign-up, enquiries) ─────────────
create table if not exists rate_hits (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_hits_key_idx on rate_hits (key, created_at desc);

-- ───────────── Lock the public API down ─────────────
alter table rate_hits enable row level security;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
grant execute on all functions in schema public to service_role;

commit;
