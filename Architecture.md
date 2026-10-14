# Real Growth — Architecture

> **Real Growth** is a real estate listing and lead portal for the **Mira Road → Dahanu Road** corridor (Western line, Mumbai region). Developers, property owners and brokers list projects; our team verifies them; buyers and tenants browse and send enquiries; the lister works those leads through to a closed or lost deal.

Similar in spirit to MagicBricks / 99acres, but deliberately narrow (one corridor) and simple to use for non-technical people.

---

## 1. Goals

| Goal | What it means |
|---|---|
| Simple | Short forms, plain language, few clicks. No jargon in the UI. |
| Trusted | Nothing goes public until our team verifies it. Under-construction projects need a MahaRERA number. |
| Direct leads | An enquiry goes to the person who listed the project, not to a call centre. |
| Visible to us | Super admin, admin and ops can see every activity on the platform. |
| Focused | Only serve Mira Road to Dahanu Road. |

---

## 2. Users and Roles

### 2.1 Public-side users (self sign-up)

| Role key | Label shown at sign-up | Can list? | Can enquire? |
|---|---|---|---|
| `developer` | I'm a developer | Yes | Yes |
| `owner` | I own a property to list | Yes | Yes |
| `broker` | I'm a broker / channel partner | Yes | Yes |
| `buyer` | I'm looking to buy or rent | No | Yes |
| (visitor) | No sign-up. Buyers and tenants enquire without an account | No | Yes |

Listers (`developer`, `owner`, `broker`) also get a **Leads dashboard** and **Matching buyers**. Enquiring never needs an account: an enquiry only needs a name and mobile number, and a visitor is recognised by that number. A buyer registers only to **post a requirement** (§3.5). When an account is created, or signs in, with a number that already sent enquiries as a visitor, those enquiries are attached to the account.

### 2.2 Website team (created by Super Admin only)

| Role key | Purpose |
|---|---|
| `super_admin` | Full control: manage staff, settings, all data, audit logs, delete/override anything. |
| `admin` | Verify/reject projects, manage users, view all leads and activity. Cannot manage super admins or system settings. |
| `ops` | Day-to-day: verify documents, call listers to confirm details, add internal notes, monitor leads. Cannot delete users or change settings. |

### 2.3 Permission matrix

| Action | Buyer | Lister | Ops | Admin | Super Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Browse verified projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send enquiry | ✅ | ✅ (not own) | — | — | — |
| Create / edit own project | — | ✅ | — | — | — |
| See leads on own project | — | ✅ | — | — | — |
| Update lead stage (own leads) | — | ✅ | — | — | — |
| Verify / reject project | — | — | ✅ | ✅ | ✅ |
| View all projects, leads, activity | — | — | ✅ | ✅ | ✅ |
| Block / unblock users | — | — | — | ✅ | ✅ |
| Create / remove staff | — | — | — | — | ✅ |
| System settings, areas, audit export | — | — | — | — | ✅ |

---

## 3. Core Flows

### 3.1 Main flow

```
Sign up / Sign in
      │
      ▼
Lister creates project  ──►  status = UNVERIFIED (not visible to public)
      │
      ▼
Ops / Admin reviews  ──►  Verified  ──►  appears on Home + Search
      │                        │
      │                        └──► Rejected (with reason, lister can fix and resubmit)
      ▼
Buyer browses → opens project → submits enquiry form (no login needed)
      │
      ▼
Lead is created for that project, owned by the lister
      │
      ▼
Lister works the lead:
  New → Contacted → Site visit scheduled → Site visit done → Negotiation → Closed (Won) | Lost
```

### 3.2 Project listing flow

1. User signs in (login is required before listing).
2. Clicks **List your project**.
3. Short form: category, type, location (from fixed area list), size, price, photos, description.
4. If **Project status = Under construction** → **MahaRERA number is required** (form blocks submit without it).
5. Submit → project saved as `unverified`.
6. Lister sees "Under review by our team" on their dashboard.
7. Ops/Admin verifies → status becomes `verified` → project goes live on the home page.
8. If something is wrong, Ops/Admin rejects with a reason → lister edits and resubmits.

> Any edit to key fields of a verified project (price, location, RERA number, ownership) sends it back to `unverified`. Minor edits (description, photos) do not.

### 3.3 Enquiry and lead flow

1. Buyer opens a verified project and fills the **Enquiry form** (name, phone, message). No account is needed.
2. A `lead` is created and linked to the project and the lister.
3. Lister gets an in-app notification (email / WhatsApp later).
4. Lister opens **Leads**, calls the buyer, and moves the lead through stages.
5. Every stage change and note is stored with a timestamp.
6. Final outcome is **Closed (Won)** or **Lost** (with a reason).

### 3.4 Repeat-enquiry rule (2+ projects, same lister)

If one buyer (same account, or same mobile number for visitors) submits enquiries for **two or more projects of the same lister**, the system groups them:

- **Lister's view:** one buyer card with a "Repeat enquirer — N projects" badge, listing every project the buyer enquired about, with the latest first. Priority is raised automatically.
- **Ops/Admin view:** same grouping, plus a flag in the activity feed.
- **Buyer's view:** on the lister's later projects, the enquiry form is prefilled and shows "You've already enquired on N projects from this lister".

> Assumption: "show the details accordingly" is interpreted as grouping and highlighting for the lister. See **Open Questions** at the end.

### 3.5 Buyer requirements and match percentage

1. A buyer who doesn't find what they want clicks **Post a requirement** on search. Visitors sign up as a buyer first, and the form starts prefilled from their search filters.
2. Requirement: buy/rent, residential/commercial, areas (one or more), property types, sizes, categories, budget range, minimum carpet area, note. Up to 5 per buyer; each can be paused or deleted.
3. Every live listing is scored against it (`src/lib/matching.ts`). Buy/rent and residential/commercial must agree; the rest is out of 100:

   | Rule | Points | Partial credit |
   |---|---|---|
   | Area | 30 | 15 for another area in the same zone |
   | Budget | 30 | 25 if ≤5% over or below the minimum, 20 if ≤10% over, 10 if ≤20% over |
   | Property type | 20 | — (empty = any) |
   | Size (BHK) | 10 | 5 for one size off |
   | Carpet area | 5 | 3 if within 10% of the minimum |
   | Category | 5 | — (empty = any) |

   Only matches of **50% or more** are shown anywhere.
4. **Buyer** sees matching properties best first, with the percentage and a per-rule breakdown.
5. **Lister** sees, per live property, the matching buyers and percentage, but **not their name or number**. They can **Request contact**. The buyer accepts (shares their number, which creates a normal lead on that property) or declines.
6. **Staff** see every requirement with buyer details, match counts and top matches (`/admin/requirements`).
7. Notifications (in-app): listers with a matching live property when a requirement is posted; buyers when a newly verified property matches; the buyer on a contact request; the lister when it is accepted or declined.

---

## 4. Features

### 4.1 Public site

- **Home page:** hero with search, category tiles, all verified projects (paginated grid), how-it-works, list-your-project call-to-action.
- **Search and filters:** Looking for (Residential / Commercial), Category (New project under construction / Ready to move / Resale), Station area, Property type, Budget, free-text search.
- **Project detail page:** gallery, key facts, RERA number (when applicable), "Verified" badge, lister type badge, enquiry form.
- **Static pages:** About, Contact, Privacy, Terms.

### 4.2 Lister dashboard

- My projects (with status chips: Unverified / Verified / Rejected / Sold / Withdrawn)
- Add / edit / withdraw project
- Leads inbox: filters by project, stage, date; repeat-enquirer badge; click-to-call and WhatsApp buttons
- Lead detail: timeline, notes, next follow-up date, site-visit schedule, close (won/lost)

### 4.3 Buyer dashboard

- My requirements, with matching properties by percentage and lister contact requests (§3.5)
- My enquiries (project, lister, date, status)
- Saved projects (optional, phase 2)
- Profile

### 4.4 Admin panel (`/admin`)

- Verification queue (oldest first), with checklist and reject reason
- All projects, users, leads
- **Activity feed:** every sign-up, listing, edit, verification, enquiry and lead-stage change
- Staff management (super admin)
- Master data: areas, property types (super admin)
- Reports: listings per day, leads per project, lead-to-close conversion per lister

---

## 5. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js** (App Router) | Server Components for SEO pages, Server Actions for forms. |
| Language | **TypeScript** | Strict mode. |
| Styling | **Tailwind CSS** | Design tokens in `tailwind.config.ts`. |
| Database | **Supabase (PostgreSQL)** | Reached only from the server with the service role key. Row Level Security on every table, with no policies. |
| Auth | **Own accounts** | Mobile number + scrypt password hash in `profiles`, signed http-only session cookie. OTP sign-in waits on an SMS provider. See 7. |
| Media | **Cloudinary** | Signed uploads from the browser into a per-lister folder. |
| Validation | Zod | Shared between forms and server actions. |
| Bot protection | **Cloudflare Turnstile** | Sign-in, sign-up and enquiry forms, plus database-backed rate limits. |
| Hosting | Vercel | |

---

## 6. Design System

**Reference:** copy typography and icon style from `https://commerciallink.vercel.app/`.

> The automated page fetch returned content only, not the CSS. Before building, open the reference site → DevTools → Elements → `<body>` computed `font-family`, and the Network tab for the font files, and record the exact fonts and icon library in this table. Use the same family for headings and body, and the same icon set and stroke width.

| Item | Value |
|---|---|
| Heading font | _Copy from reference (confirm in DevTools)_ |
| Body font | _Copy from reference (confirm in DevTools)_ |
| Icon set | _Copy from reference (confirm in DevTools; load via `lucide-react`/same library)_ |
| Loading | `next/font` (no layout shift) |

### Brand (from the supplied logo)

| Token | Colour | Use |
|---|---|---|
| `brand-green` | Deep green `#0B5D4B` | Header, hero, primary buttons |
| `brand-gold` | Gold `#E5A913` | Accents, icons, highlights, dividers |
| `brand-cream` | Cream `#FFDFA0` | Text on green, wordmark |
| `ink` | Near black | Body text on light |
| `surface` | White / soft grey | Cards and page background |

Logo: circular emblem with a house held between two hands, wordmark **REAL GROWTH**, tagline **REAL ESTATE AGENT**. Stored in `public/brand/` as `emblem.png` (on its green disc, for light backgrounds) and `emblem-line.png` (transparent, for green backgrounds).

### UX rules (low technical knowledge)

- One primary action per screen, large tap targets, labels above fields.
- Dropdowns instead of free text wherever possible (area, type, budget).
- Plain words: "Add your property", not "Create listing".
- Show progress and errors in-line, in simple language.
- Mobile first; most users will be on phones.
- Optional hint text under every non-obvious field (e.g. under MahaRERA: "Starts with P99000…").

---

## 7. Authentication and Onboarding

1. **Sign up** asks for: name, mobile number (OTP), email (optional), and **role** via three large cards (listers only):
   - I'm a developer
   - I own a property to list
   - I'm a broker / channel partner
2. A profile row is created in `profiles` with that role.
3. Developers and brokers are asked (optionally at first) for company name and RERA agent number; owners need nothing extra.
4. **Sign in** works with OTP or password.
5. Staff accounts are created by the super admin and sign in at `/admin/login`.
6. Listing requires being signed in; the redirect brings the user back to where they were. Enquiring does not.

---

## 8. Service Area

Only the corridor **Mira Road → Dahanu Road** is allowed. This is enforced by a fixed `areas` table; there is no free-text location.

| Zone | Areas |
|---|---|
| Mira Road & Bhayandar | Mira Road East, Mira Road West, Kashimira, Shanti Park, Beverly Park, Silver Park, Sheetal Nagar, Bhayandar East, Bhayandar West, Navghar, Uttan, Dongri |
| Vasai & Virar | Naigaon East/West, Juchandra, Vasai Road East/West, Vasai Gaon, Papdy, Nalasopara East/West, Achole, Virar East/West, Bolinj, Agashi, Arnala |
| Palghar & Dahanu | Vaitarna, Saphale, Kelve Road, Palghar East/West, Umroli, Boisar East/West, Tarapur MIDC, Vangaon, Chinchani, Dahanu Road |

Super admin can add or hide areas. Optionally store lat/lng per area for a map view later.

---

## 9. Data Model (PostgreSQL / Supabase)

### 9.1 Enums

```sql
create type user_role as enum ('developer','owner','broker','buyer','ops','admin','super_admin');
create type segment as enum ('residential','commercial');
create type listing_category as enum ('new_project','ready_to_move','resale');
create type construction_status as enum ('under_construction','ready','resale');
create type project_status as enum ('unverified','verified','rejected','sold','withdrawn');
create type lead_stage as enum ('new','contacted','site_visit_scheduled','site_visit_done','negotiation','closed_won','closed_lost');
create type listing_purpose as enum ('sale','rent');
```

### 9.2 Tables

```
profiles
  id uuid PK (= auth.users.id)
  role user_role not null
  full_name text, phone text unique, email text
  company_name text, agent_rera_no text
  is_blocked boolean default false
  created_at, updated_at

areas
  id serial PK, zone text, name text unique, is_active boolean

property_types
  id serial PK, segment segment, name text, slug text unique

projects
  id uuid PK
  code text unique              -- e.g. RG-2026-000123
  lister_id uuid -> profiles
  title text, slug text unique, description text
  segment segment
  category listing_category
  construction_status construction_status
  purpose listing_purpose        -- sale / rent
  property_type_id -> property_types
  area_id -> areas
  address_line text
  configuration text             -- "2 BHK" etc.
  carpet_area_sqft numeric
  price numeric                  -- total price or monthly rent
  maharera_no text               -- REQUIRED when construction_status = 'under_construction'
  possession_date date
  amenities text[]
  status project_status default 'unverified'
  rejection_reason text
  verified_by uuid -> profiles, verified_at timestamptz
  views_count int default 0
  created_at, updated_at

  CHECK (construction_status <> 'under_construction' OR maharera_no IS NOT NULL)

project_media
  id uuid PK, project_id -> projects
  cloudinary_public_id text, url text, kind text  -- image | video | brochure
  sort_order int

leads
  id uuid PK
  project_id -> projects
  lister_id uuid -> profiles      -- denormalised for fast dashboards + RLS
  buyer_id uuid -> profiles
  name text, phone text, email text, message text
  stage lead_stage default 'new'
  lost_reason text
  site_visit_at timestamptz
  next_followup_at timestamptz
  is_repeat boolean default false
  created_at, updated_at
  UNIQUE (project_id, buyer_id)   -- one live lead per buyer per project

lead_activities
  id uuid PK, lead_id -> leads
  actor_id -> profiles
  type text                       -- stage_change | note | call | site_visit
  from_stage lead_stage, to_stage lead_stage
  note text
  created_at

project_reviews                    -- verification trail
  id uuid PK, project_id, reviewer_id, decision text, reason text, created_at

notifications
  id uuid PK, user_id, title text, body text, link text, read_at, created_at

requirements                       -- what a registered buyer is looking for (§3.5)
  id uuid PK, buyer_id -> profiles
  purpose listing_purpose, segment segment
  area_ids int[], property_type_ids int[], configurations text[], categories listing_category[]  -- empty = any
  budget_min numeric, budget_max numeric, min_carpet_sqft numeric
  note text, is_active boolean
  created_at, updated_at

requirement_contacts               -- lister asks a matching buyer to share their number
  id uuid PK, requirement_id, project_id, lister_id, match_percent int
  status text                      -- pending | accepted | declined
  lead_id -> leads                 -- set when accepted
  created_at, responded_at
  UNIQUE (requirement_id, project_id)

activity_log                       -- the "see everything" table for staff
  id bigserial PK
  actor_id uuid, actor_role user_role
  action text                      -- user.signup, project.created, project.verified, lead.created ...
  entity_type text, entity_id uuid
  metadata jsonb
  created_at
```

### 9.3 Repeat-enquiry view

```sql
create view buyer_lister_summary as
select lister_id, buyer_id,
       count(*)              as projects_enquired,
       array_agg(project_id order by created_at desc) as project_ids,
       max(created_at)       as last_enquiry_at
from leads
group by lister_id, buyer_id;
-- projects_enquired >= 2  →  show "Repeat enquirer" badge
```

A database trigger on `leads` insert updates `is_repeat` for all that buyer's leads with the same lister.

### 9.4 Indexes

`projects(status, area_id, property_type_id, price)`, `projects(lister_id)`, `leads(lister_id, stage)`, `leads(buyer_id)`, `activity_log(created_at desc)`, plus a GIN index on a `tsvector` of title + description + area for search.

---

## 10. Security (Row Level Security)

> **As built:** the browser never talks to Supabase. All tables have RLS **on** with **no policies**, and privileges are revoked from the `anon` and `authenticated` roles (`0002_server_side_access.sql`). The rules in the table below are enforced in `src/lib/queries.ts` and the server actions, which check the signed-in user's role and row ownership on every call.

The access rules:

| Table | Public / anon | Owner of row | Staff |
|---|---|---|---|
| `projects` | Read only where `status = 'verified'` | Lister: read/insert/update own | Read all; update `status` (ops/admin) |
| `project_media` | Read where parent is verified | Lister: own | Read all |
| `leads` | None | Lister: read/update own leads. Buyer: read own, insert | Read all |
| `lead_activities` | None | Lister of the lead | Read all |
| `profiles` | None | Read/update own | Read all; block (admin+) |
| `activity_log` | None | None | Read (ops/admin/super_admin) |

Other rules:
- Buyer phone numbers are only visible to the lister of that project and to staff.
- Staff-only mutations (verify/reject, block, staff creation) go through server actions that re-check the role server-side. The Supabase **service role key is never exposed to the browser**.
- Rate-limit the enquiry form and OTP requests (per IP + phone) to prevent spam.
- Validate and sanitise all text; Cloudinary uploads use **signed** parameters and an upload preset restricted to images/PDF with size limits.
- Follow India's DPDP Act: consent checkbox on sign-up and enquiry, privacy page, ability to delete account.

---

## 11. Application Structure

```
real-growth/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx                    # Home + search + project grid
│  │  │  ├─ projects/page.tsx           # Search results
│  │  │  ├─ projects/[slug]/page.tsx    # Project detail + enquiry form
│  │  │  ├─ about/ contact/ privacy/ terms/
│  │  ├─ (auth)/
│  │  │  ├─ signup/page.tsx             # role cards
│  │  │  ├─ login/page.tsx
│  │  ├─ (app)/                         # signed-in users
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ list-project/page.tsx       # create
│  │  │  ├─ my-projects/page.tsx
│  │  │  ├─ my-projects/[id]/edit/page.tsx
│  │  │  ├─ leads/page.tsx              # lister inbox
│  │  │  ├─ leads/[id]/page.tsx         # lead detail + timeline
│  │  │  ├─ my-enquiries/page.tsx       # buyer
│  │  │  ├─ profile/page.tsx
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ page.tsx                    # Overview
│  │  │  ├─ verification/page.tsx       # queue
│  │  │  ├─ projects/ users/ leads/
│  │  │  ├─ activity/page.tsx           # full activity feed
│  │  │  ├─ staff/page.tsx              # super admin only
│  │  │  ├─ settings/page.tsx           # areas, types (super admin)
│  │  ├─ api/
│  │  │  ├─ cloudinary/sign/route.ts    # signed upload params
│  │  │  ├─ webhooks/…                  # future (WhatsApp / email)
│  ├─ components/ (ui/, forms/, project/, lead/, admin/, layout/)
│  ├─ lib/
│  │  ├─ supabase/ (client.ts, server.ts, admin.ts)
│  │  ├─ cloudinary.ts
│  │  ├─ auth.ts            # getSessionProfile, requireRole()
│  │  ├─ validators/        # Zod schemas
│  │  ├─ activity.ts        # logActivity()
│  │  ├─ constants.ts       # roles, stages, budgets
│  ├─ actions/              # Server Actions: projects, leads, admin, auth
│  ├─ types/                # generated Supabase types
│  ├─ middleware.ts         # session refresh + route guards
├─ supabase/
│  ├─ migrations/           # SQL: tables, enums, RLS, triggers, views
│  ├─ seed.sql              # areas, property_types
├─ public/brand/            # logo svg, favicon
├─ Architecture.md
├─ .env.local
```

### Route protection (middleware)

| Path | Rule |
|---|---|
| `/list-project`, `/my-projects`, `/leads`, `/dashboard` | Signed in; listing pages require lister role |
| `/my-enquiries` | Signed in |
| `/requirements/*` | Signed in, buyer role |
| `/matching-buyers` | Signed in, lister role |
| `/admin/*` | Staff roles only; `/admin/staff`, `/admin/settings` super admin only |

---

## 12. Key Implementation Details

### Project form logic
- `construction_status = under_construction` → show **MahaRERA number** field, required, regex-validated (`^P99\d{9}$`).
- Category `new_project` defaults construction status to under construction; user can change.
- Area, property type and budget come from dropdowns.
- Photos upload straight to Cloudinary (signed), only returned `public_id`/`url` are saved. Minimum 1, maximum about 15 images.

### Search
- Server-side query on `projects where status = 'verified'` with filters from the URL query string (shareable links).
- Full-text search via Postgres `tsvector`; sort by newest / price.
- Home page shows newest verified projects first; paginate or infinite scroll.

### Lead creation (server action)
1. Verify session and that buyer is not the lister.
2. Insert lead (`on conflict (project_id, buyer_id)` → update message, bump timestamp).
3. Recompute repeat flag via trigger.
4. Insert `notifications` row for lister and `activity_log` row.
5. Return success with a plain-language confirmation.

### Activity logging
A single `logActivity(actor, action, entity, metadata)` helper is called by every server action; the admin **Activity** page filters by user, role, action and date.

---

## 13. Environment Variables

See `.env.example` for the full list with explanations.

```
SESSION_SECRET=                     # server only, required
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=          # server only
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=              # server only
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=               # server only
```

---

## 14. Build Phases

| Phase | Scope |
|---|---|
| **1 — Foundation** | Next.js + Tailwind setup, design tokens, Supabase schema + RLS, auth with 4 roles, staff roles |
| **2 — Listing** | List-project form, Cloudinary uploads, MahaRERA rule, lister dashboard, `unverified` state |
| **3 — Verification** | Admin queue, approve/reject with reason, project goes live |
| **4 — Discovery** | Home page, search + filters, project detail page, SEO and sitemap |
| **5 — Leads** | Enquiry form, lead inbox, stages, notes, site-visit scheduling, won/lost, repeat-enquirer grouping |
| **6 — Oversight** | Activity feed, reports, staff management, settings |
| **7 — Polish** | Notifications (email / WhatsApp), saved projects, requirement posting, performance and accessibility pass |

---

## 15. Open Questions

1. **Repeat enquiries (feature 3):** does "show the details accordingly" mean (a) grouping and highlighting for the lister (assumed here), or (b) revealing extra details (e.g. lister contact) to the buyer after 2+ enquiries?
2. **Rent vs sale:** list both from day one? (Schema supports both.)
3. **Verification documents:** should owners upload ownership papers, or is the call from ops enough for v1?
4. **Lister limits:** free for all, or cap on active projects per lister?
5. **OTP provider:** Supabase phone auth needs an SMS provider (e.g. Twilio / MSG91). Which one?
6. **Fonts and icons:** exact families to be confirmed from the reference site (see section 6).
