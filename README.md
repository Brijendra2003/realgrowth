# Real Growth

A verified real-estate listing and lead portal for the **Mira Road → Dahanu Road** corridor. Developers, owners and brokers list properties; the Real Growth team verifies them; buyers browse and enquire; listers work each lead through to a won or lost deal.

Full product spec: [Architecture.md](Architecture.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

No cloud accounts are needed for local development. On first run the app creates `.data/db.json` with demo data. To start over with fresh data, stop the server and delete the `.data/` folder.

### Demo accounts

Every demo account uses the password `demo1234`. If you sign in with a one-time code instead, the demo code is `123456`.

| Role | Mobile | Where to start |
|---|---|---|
| Developer (Skyline Developers) | 9820011111 | `/dashboard`, `/leads` |
| Owner | 9820044444 | `/my-projects` |
| Broker | 9820033333 | `/leads` |
| Buyer (repeat enquirer) | 9820055555 | `/my-enquiries` |
| Super admin | 9000000001 | `/admin/login` |
| Admin | 9000000002 | `/admin/login` |
| Ops | 9000000003 | `/admin/login` |

## What's included

| Area | Pages |
|---|---|
| Public site | Home, search with filters (`/projects`), project detail with gallery, MahaRERA panel, EMI calculator and enquiry form, About, Contact, Privacy, Terms, sitemap and robots |
| Sign-up / sign-in | Four role cards, password or OTP sign-in, separate team sign-in at `/admin/login` |
| Listers | Dashboard, 5-step "Add your property" form (MahaRERA rule, photo upload), My properties, Leads inbox grouped by buyer with the repeat-enquirer badge, lead detail with stage stepper, timeline, notes, site visits and follow-ups |
| Buyers | Dashboard, My enquiries, Saved, Notifications, Profile (with DPDP account deletion) |
| Team console | Overview and reports, verification queue with checklist and approve/reject, all projects, users (block/unblock), all leads, activity feed, staff (super admin), areas and settings, audit CSV export |

## How it's built

- **Next.js 16 App Router**, using Cache Components, Server Components, Server Actions and `proxy.ts` route guards
- **Tailwind CSS v4**: design tokens live in `src/app/globals.css`. Fonts are Inter and Inter Tight (from the reference site), with Fraunces italic for accent words. Icons are Lucide at 1.5 stroke.
- **Zod** validation, shared by forms and server actions
- **Data layer:** every read goes through `src/lib/queries.ts` and every write through `src/actions/*`. Both use `src/lib/db.ts`, a file-backed store that mirrors the Supabase tables row for row.

```
src/
  app/(public)/     home, search, project detail, static pages
  app/(auth)/       signup, login
  app/(app)/        signed-in area: dashboard, listings, leads, enquiries…
  app/admin/        team console (+ /admin/login)
  app/api/          media, cloudinary/sign, admin/audit-export
  actions/          server actions: auth, projects, leads, admin, profile
  components/       brand, layout, ui, project, lead, admin
  lib/              constants, types, validators, auth, db, queries, seed
supabase/
  migrations/0001_init.sql   enums, tables, indexes, triggers, view, RLS
  seed.sql                   areas and property types
```

## Going to production

1. Create a Supabase project, then run `supabase/migrations/0001_init.sql` and `supabase/seed.sql`.
2. Copy `.env.example` to `.env.local` and fill it in. Set a strong `SESSION_SECRET`.
3. Replace the bodies of `readDb` and `mutate` in `src/lib/db.ts` (and the queries that use them) with Supabase client calls. The rest of the app does not need to change.
4. Point photo uploads at `/api/cloudinary/sign`. It already returns signed parameters once the Cloudinary keys are set.
5. Choose an SMS provider for OTP (Twilio or MSG91; see Open Questions in Architecture.md). Until then, the OTP flow uses a demo code.
