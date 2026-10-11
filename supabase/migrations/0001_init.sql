-- Real Growth — initial schema (Architecture §9, §10)
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists pgcrypto;

-- ───────────── Enums ─────────────
create type user_role as enum ('developer','owner','broker','buyer','ops','admin','super_admin');
create type segment as enum ('residential','commercial');
create type listing_category as enum ('new_project','ready_to_move','resale');
create type construction_status as enum ('under_construction','ready','resale');
create type project_status as enum ('unverified','verified','rejected','sold','withdrawn');
create type lead_stage as enum ('new','contacted','site_visit_scheduled','site_visit_done','negotiation','closed_won','closed_lost');
create type listing_purpose as enum ('sale','rent');

-- ───────────── Tables ─────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'buyer',
  full_name text not null,
  phone text unique,
  email text,
  company_name text,
  agent_rera_no text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table areas (
  id serial primary key,
  zone text not null,
  name text not null unique,
  is_active boolean not null default true,
  lat double precision,
  lng double precision
);

create table property_types (
  id serial primary key,
  segment segment not null,
  name text not null,
  slug text not null unique
);

create sequence project_code_seq start 101;

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('RG-' || extract(year from now())::int || '-' || lpad(nextval('project_code_seq')::text, 6, '0')),
  lister_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text not null,
  segment segment not null,
  category listing_category not null,
  construction_status construction_status not null,
  purpose listing_purpose not null default 'sale',
  property_type_id int not null references property_types(id),
  area_id int not null references areas(id),
  address_line text not null,
  configuration text not null,
  carpet_area_sqft numeric not null check (carpet_area_sqft > 0),
  price numeric not null check (price > 0),
  maharera_no text check (maharera_no is null or maharera_no ~ '^P99\d{9}$'),
  possession_date date,
  amenities text[] not null default '{}',
  status project_status not null default 'unverified',
  rejection_reason text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  views_count int not null default 0,
  search tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maharera_required check (construction_status <> 'under_construction' or maharera_no is not null)
);

create table project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  cloudinary_public_id text,
  url text not null,
  kind text not null default 'image' check (kind in ('image','video','brochure')),
  sort_order int not null default 0
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  lister_id uuid not null references profiles(id) on delete cascade,
  buyer_id uuid references profiles(id) on delete cascade,  -- null: visitor without an account
  name text not null,
  phone text not null,
  email text,
  message text not null default '',
  stage lead_stage not null default 'new',
  lost_reason text,
  site_visit_at timestamptz,
  next_followup_at timestamptz,
  is_repeat boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one person per lister: their account when signed in, otherwise their phone number
  buyer_key text generated always as (coalesce(buyer_id::text, 'tel:' || phone)) stored,
  unique (project_id, buyer_key)
);

create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type text not null check (type in ('created','stage_change','note','call','site_visit','followup')),
  from_stage lead_stage,
  to_stage lead_stage,
  note text,
  created_at timestamptz not null default now()
);

create table project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  decision text not null check (decision in ('verified','rejected')),
  reason text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table saved_projects (
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table activity_log (
  id bigserial primary key,
  actor_id uuid,
  actor_role user_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ───────────── Indexes (§9.4) ─────────────
create index projects_filter_idx on projects (status, area_id, property_type_id, price);
create index projects_lister_idx on projects (lister_id);
create index projects_search_idx on projects using gin (search);
create index leads_lister_stage_idx on leads (lister_id, stage);
create index leads_buyer_idx on leads (buyer_id);
create index activity_created_idx on activity_log (created_at desc);

-- ───────────── Helpers & triggers ─────────────
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth_role() in ('ops','admin','super_admin'), false)
$$;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
create trigger projects_touch before update on projects for each row execute function touch_updated_at();
create trigger leads_touch before update on leads for each row execute function touch_updated_at();

-- Full-text search vector: title + description + area name
create or replace function projects_search_refresh() returns trigger language plpgsql as $$
begin
  new.search := to_tsvector('simple',
    coalesce(new.title,'') || ' ' || coalesce(new.description,'') || ' ' ||
    coalesce((select name || ' ' || zone from areas where id = new.area_id), ''));
  return new;
end $$;
create trigger projects_search before insert or update of title, description, area_id on projects
  for each row execute function projects_search_refresh();

-- Key-field edits on a live listing send it back to review (§3.2)
create or replace function projects_requeue_on_key_change() returns trigger language plpgsql as $$
begin
  if old.status = 'verified' and not is_staff() and (
       new.price is distinct from old.price or new.area_id is distinct from old.area_id or
       new.maharera_no is distinct from old.maharera_no or new.address_line is distinct from old.address_line or
       new.purpose is distinct from old.purpose or new.property_type_id is distinct from old.property_type_id) then
    new.status := 'unverified';
  end if;
  -- Listers cannot self-verify.
  if not is_staff() and new.status = 'verified' and old.status <> 'verified' then
    raise exception 'Only staff can verify listings';
  end if;
  return new;
end $$;
create trigger projects_requeue before update on projects for each row execute function projects_requeue_on_key_change();

-- Repeat-enquiry rule (§3.4): flag all of a buyer's leads with a lister once they hit 2+
create or replace function leads_mark_repeat() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update leads set is_repeat = (
    select count(*) >= 2 from leads l where l.buyer_key = new.buyer_key and l.lister_id = new.lister_id)
  where buyer_key = new.buyer_key and lister_id = new.lister_id;
  return null;
end $$;
create trigger leads_repeat after insert on leads for each row execute function leads_mark_repeat();

-- Buyers can't enquire on their own listing; lister_id is always taken from the project
create or replace function leads_before_insert() returns trigger language plpgsql as $$
begin
  select lister_id into new.lister_id from projects where id = new.project_id and status = 'verified';
  if new.lister_id is null then raise exception 'Project is not available'; end if;
  if new.lister_id = new.buyer_id then raise exception 'You cannot enquire on your own listing'; end if;
  return new;
end $$;
create trigger leads_guard before insert on leads for each row execute function leads_before_insert();

-- ───────────── Views ─────────────
create view buyer_lister_summary with (security_invoker = true) as
select lister_id, buyer_key, max(buyer_id::text)::uuid as buyer_id,
       count(*) as projects_enquired,
       array_agg(project_id order by created_at desc) as project_ids,
       max(created_at) as last_enquiry_at
from leads
group by lister_id, buyer_key;
-- projects_enquired >= 2 → show "Repeat enquirer" badge

-- ───────────── Row Level Security (§10) ─────────────
alter table profiles enable row level security;
alter table areas enable row level security;
alter table property_types enable row level security;
alter table projects enable row level security;
alter table project_media enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table project_reviews enable row level security;
alter table notifications enable row level security;
alter table saved_projects enable row level security;
alter table activity_log enable row level security;

-- reference data: public read, super admin write
create policy areas_read on areas for select using (true);
create policy areas_write on areas for all using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');
create policy types_read on property_types for select using (true);
create policy types_write on property_types for all using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- profiles
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()) and is_blocked = false);
create policy profiles_admin_update on profiles for update using (auth_role() in ('admin','super_admin'));
create policy profiles_insert_self on profiles for insert with check (id = auth.uid() and role in ('developer','owner','broker','buyer'));

-- projects
create policy projects_public_read on projects for select using (status = 'verified');
create policy projects_owner_read on projects for select using (lister_id = auth.uid());
create policy projects_staff_read on projects for select using (is_staff());
create policy projects_owner_insert on projects for insert
  with check (lister_id = auth.uid() and status = 'unverified' and auth_role() in ('developer','owner','broker'));
create policy projects_owner_update on projects for update using (lister_id = auth.uid()) with check (lister_id = auth.uid());
create policy projects_staff_update on projects for update using (is_staff());

-- project media
create policy media_public_read on project_media for select
  using (exists (select 1 from projects p where p.id = project_id and p.status = 'verified'));
create policy media_owner_all on project_media for all
  using (exists (select 1 from projects p where p.id = project_id and p.lister_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.lister_id = auth.uid()));
create policy media_staff_read on project_media for select using (is_staff());

-- leads (buyer phone visible only to the lister + staff)
create policy leads_buyer_read on leads for select using (buyer_id = auth.uid());
create policy leads_buyer_insert on leads for insert with check (buyer_id = auth.uid());
-- Visitors enquire without an account: the enquiry server action inserts those rows with the service role.
create policy leads_lister_read on leads for select using (lister_id = auth.uid());
create policy leads_lister_update on leads for update using (lister_id = auth.uid()) with check (lister_id = auth.uid());
create policy leads_staff_read on leads for select using (is_staff());

create policy lead_acts_lister on lead_activities for all
  using (exists (select 1 from leads l where l.id = lead_id and l.lister_id = auth.uid()))
  with check (exists (select 1 from leads l where l.id = lead_id and l.lister_id = auth.uid()));
create policy lead_acts_staff_read on lead_activities for select using (is_staff());

-- reviews, notifications, saved, activity
create policy reviews_staff on project_reviews for all using (is_staff()) with check (is_staff());
create policy reviews_owner_read on project_reviews for select
  using (exists (select 1 from projects p where p.id = project_id and p.lister_id = auth.uid()));
create policy notifications_self on notifications for select using (user_id = auth.uid());
create policy notifications_self_update on notifications for update using (user_id = auth.uid());
create policy saved_self on saved_projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy activity_staff_read on activity_log for select using (is_staff());
-- Inserts into notifications / activity_log happen through server actions using the service role key.
