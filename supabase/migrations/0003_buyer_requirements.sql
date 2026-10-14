-- Real Growth — buyer requirements and matching (Architecture §3.5)
-- Run once in the Supabase SQL editor, after 0002_server_side_access.sql.
--
-- Buyers can now create an account and post what they are looking for. The
-- app scores every live listing against each requirement (src/lib/matching.ts)
-- and shows the percentage to the buyer, the lister and our team. A lister
-- never sees the buyer's name or number until the buyer accepts a contact
-- request.

begin;

create table if not exists requirements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  purpose listing_purpose not null,
  segment segment not null,
  area_ids int[] not null check (cardinality(area_ids) between 1 and 60),
  property_type_ids int[] not null default '{}',          -- empty: any type
  configurations text[] not null default '{}',            -- empty: any size
  categories listing_category[] not null default '{}',    -- empty: any category
  budget_min numeric check (budget_min is null or budget_min >= 0),
  budget_max numeric not null check (budget_max > 0),
  min_carpet_sqft numeric check (min_carpet_sqft is null or min_carpet_sqft > 0),
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_range check (budget_min is null or budget_min <= budget_max)
);
create index if not exists requirements_match_idx on requirements (is_active, purpose, segment);
create index if not exists requirements_buyer_idx on requirements (buyer_id);

-- A lister asks to share one of their listings with a matching buyer.
-- The buyer accepts (their details go to the lister as a lead) or declines.
create table if not exists requirement_contacts (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  lister_id uuid not null references profiles(id) on delete cascade,
  match_percent int not null check (match_percent between 0 and 100),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requirement_id, project_id)
);
create index if not exists requirement_contacts_lister_idx on requirement_contacts (lister_id);

drop trigger if exists requirements_touch on requirements;
create trigger requirements_touch before update on requirements for each row execute function touch_updated_at();

-- Same access model as every other table: server only, no policies.
alter table requirements enable row level security;
alter table requirement_contacts enable row level security;
revoke all on requirements, requirement_contacts from anon, authenticated;

commit;
