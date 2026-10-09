import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AREA_ZONES, SITE } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export const NAV = [
  { href: "/projects?purpose=sale", label: "Buy", mega: true },
  { href: "/projects?purpose=rent", label: "Rent" },
  { href: "/projects?category=new_project", label: "New Projects" },
  { href: "/projects?segment=commercial", label: "Commercial" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-brand-green-900 text-[0.78rem] text-brand-cream/90 md:block">
        <div className="container-page flex h-9 items-center justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" strokeWidth={1.8} />
            Every listing is checked by our team before it goes live
            <span className="mx-2 h-3 w-px bg-white/20" />
            <MapPin className="h-3.5 w-3.5 text-brand-gold" strokeWidth={1.8} />
            Serving {SITE.corridor}
          </p>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
            <Phone className="h-3.5 w-3.5" strokeWidth={1.8} /> {SITE.phone}
          </a>
        </div>
      </div>

      <div className="border-b border-line/80 bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75">
        <div className="container-page flex h-[4.5rem] items-center gap-6">
          <Logo />

          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) =>
              item.mega ? (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.92rem] font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" strokeWidth={2} />
                  </Link>
                  <MegaMenu />
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-[0.92rem] font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Suspense fallback={<div className="h-10 w-40 animate-pulse rounded-full bg-sand" />}>
              <HeaderAuth />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

async function HeaderAuth() {
  const user = await getSessionUser();
  const unread = user ? await getUnreadCount(user.id) : 0;
  return (
    <>
      <Link href="/list-project" className="btn btn-gold btn-sm hidden sm:inline-flex">
        List property
        <span className="rounded-full bg-brand-green px-1.5 py-px text-[0.6rem] font-bold tracking-wider text-brand-cream">FREE</span>
      </Link>
      {user ? (
        <UserMenu user={user} unread={unread} />
      ) : (
        <Link href="/login" className="btn btn-outline btn-sm hidden sm:inline-flex">
          Sign in
        </Link>
      )}
      <MobileNav user={user} />
    </>
  );
}

function MegaMenu() {
  return (
    <div className="invisible absolute left-0 top-full w-[46rem] translate-y-2 pt-3 opacity-0 transition duration-300 ease-out-soft group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_13rem] gap-6 rounded-2xl border border-line bg-paper p-6 shadow-pop">
        {AREA_ZONES.map((z) => (
          <div key={z.zone}>
            <p className="eyebrow !text-[0.65rem]">{z.zone}</p>
            <ul className="mt-3 space-y-1.5">
              {z.areas.slice(0, 7).map((a) => (
                <li key={a}>
                  <Link href={`/projects?purpose=sale&area=${slugify(a)}`} className="link-underline text-sm text-ink-soft hover:text-brand-green">
                    {a}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/projects?zone=${slugify(z.zone)}`} className="text-sm font-semibold text-brand-green">
                  All of {z.zone.split(" ")[0]} →
                </Link>
              </li>
            </ul>
          </div>
        ))}
        <div className="rounded-xl bg-brand-green p-4 text-brand-cream">
          <p className="font-display text-lg font-semibold leading-tight text-white">Browse by type</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/projects?category=new_project">New projects</Link></li>
            <li><Link className="hover:text-white" href="/projects?category=ready_to_move">Ready to move</Link></li>
            <li><Link className="hover:text-white" href="/projects?category=resale">Resale homes</Link></li>
            <li><Link className="hover:text-white" href="/projects?type=villa">Villas & row houses</Link></li>
            <li><Link className="hover:text-white" href="/projects?type=residential-plot">Plots</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
