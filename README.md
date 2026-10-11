# Real Growth

A verified real-estate listing and lead portal for the **Mira Road → Dahanu Road** corridor. Developers, owners and brokers list properties; the Real Growth team verifies them; buyers browse and enquire without an account; listers work each lead through to a won or lost deal.

Full product spec: [Architecture.md](Architecture.md).

## Set up

1. **Environment.** Copy `.env.example` to `.env.local` and fill it in. Every value is explained in that file. `SESSION_SECRET`, the Supabase URL and service role key are required; the app will not start without them.
2. **Database.** In the Supabase SQL editor, run these in order:
   1. `supabase/migrations/0001_init.sql`: tables, indexes, triggers
   2. `supabase/migrations/0002_server_side_access.sql`: accounts, lock-down, rate limiting
   3. `supabase/seed.sql`: the areas and property types (reference data, not sample listings)
3. **First team account.** `npm run create-admin` asks for a name, mobile number and password and creates a super admin. After that, super admins add staff at `/admin/staff`.
4. **Run it.**

   ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```

There is no sample data. The site starts empty: listers sign up at `/signup`, add a property, and the team approves it at `/admin/verification`.

## Going live

- Set every variable from `.env.local` in the hosting dashboard, with a **new** `SESSION_SECRET` and the real `NEXT_PUBLIC_SITE_URL`.
- Add the Turnstile keys. Without them the sign-in, sign-up and enquiry forms are not protected against bots (the server logs a warning).
- Replace the placeholder phone number, email and address in `SITE` in `src/lib/constants.ts`.
- Have the Privacy and Terms pages reviewed; they are templates.

## What's included

| Area | Pages |
|---|---|
| Public site | Home, search with filters (`/projects`), project detail with gallery, MahaRERA panel, EMI calculator and enquiry form (no account needed), About, Contact, Privacy, Terms, sitemap and robots |
| Sign-up / sign-in | Three lister role cards, mobile number and password, separate team sign-in at `/admin/login` |
| Listers | Dashboard, 5-step "Add your property" form (MahaRERA rule, photo upload), My properties, Leads inbox grouped by buyer with the repeat-enquirer badge, lead detail with stage stepper, timeline, notes, site visits and follow-ups |
| Team console | Overview and reports, verification queue with checklist and approve/reject, all projects, users (block/unblock), all leads, activity feed, staff (super admin), areas and settings, audit CSV export |

## How it's built

- **Next.js 16 App Router**, using Cache Components, Server Components, Server Actions and `proxy.ts` route guards
- **Tailwind CSS v4**: design tokens live in `src/app/globals.css`
- **Zod** validation, shared by forms and server actions
- **Supabase (Postgres)**: every read goes through `src/lib/queries.ts` and every write through `src/actions/*`, on the server, with the service role key. Row Level Security is on with no policies, so the public anon key can reach nothing.
- **Accounts**: mobile number and scrypt password hash in `profiles`, with a signed, http-only session cookie (`src/lib/auth.ts`). Supabase Auth is not used.
- **Photos**: uploaded by the browser straight to Cloudinary with a server-made signature (`/api/cloudinary/sign`); only images in the lister's own folder are accepted.
- **Abuse protection**: Cloudflare Turnstile on sign-in, sign-up and enquiries, plus database-backed rate limits (`src/lib/rate-limit.ts`)

```
src/
  app/(public)/     home, search, project detail, static pages
  app/(auth)/       signup, login
  app/(app)/        signed-in area: dashboard, listings, leads…
  app/admin/        team console (+ /admin/login)
  app/api/          cloudinary/sign, admin/audit-export
  actions/          server actions: auth, projects, leads, admin, profile
  components/       brand, layout, ui, project, lead, admin
  lib/              supabase, queries, auth, captcha, rate-limit, cloudinary, validators
scripts/
  create-admin.mjs  make or reset a team account
supabase/
  migrations/       0001 schema, 0002 access model
  seed.sql          areas and property types
  drop_all.sql      wipes the public schema (destructive, read the header first)
```

## Not built yet

- One-time-code (OTP) sign-in and "forgot password". Both need an SMS provider (Twilio or MSG91). Until then a super admin can reset a team password with `npm run create-admin`; listers have no self-service reset.
- Email / WhatsApp notifications. Listers see new enquiries in the app only.
