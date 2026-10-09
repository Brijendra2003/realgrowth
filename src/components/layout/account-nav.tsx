"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/constants";
import { accountLinks, adminLinks } from "./account-links";

export function AccountNav({ role, horizontal = false }: { role: UserRole; horizontal?: boolean }) {
  const pathname = usePathname();
  const links = accountLinks(role);
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  if (horizontal) {
    return (
      <nav aria-label="Account" className="flex w-max gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium ${
              active(l.href) ? "border-brand-green bg-brand-green text-white" : "border-line bg-paper text-ink-soft"
            }`}
          >
            <l.icon className="h-4 w-4" strokeWidth={1.6} /> {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Account" className="rounded-2xl border border-line bg-paper p-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={active(l.href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active(l.href) ? "bg-brand-green text-white shadow-sm" : "text-ink-soft hover:bg-canvas hover:text-ink"
          }`}
        >
          <l.icon className="h-[18px] w-[18px]" strokeWidth={1.6} /> {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = adminLinks(role);
  const groups = [...new Set(links.map((l) => l.group))];
  const active = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-cream/45">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {links
              .filter((l) => l.group === g)
              .map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active(l.href) ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active(l.href) ? "bg-brand-cream text-brand-green-900" : "text-brand-cream/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <l.icon className="h-[18px] w-[18px]" strokeWidth={1.6} /> {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
