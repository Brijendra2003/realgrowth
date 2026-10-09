"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";
import { accountLinks } from "./account-links";

const MAIN = [
  { href: "/projects?purpose=sale", label: "Buy a home" },
  { href: "/projects?purpose=rent", label: "Rent" },
  { href: "/projects?category=new_project", label: "New projects" },
  { href: "/projects?segment=commercial", label: "Commercial" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-sand lg:hidden" aria-label="Open menu">
        <Menu className="h-6 w-6" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-brand-green-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-y-0 right-0 flex w-[min(22rem,100%)] animate-fade-up flex-col overflow-y-auto bg-paper shadow-pop"
            onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Close menu">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="px-2 py-3" aria-label="Mobile">
              {MAIN.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-3 text-[1.05rem] font-medium hover:bg-canvas">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mx-4 h-px bg-line" />
            {user ? (
              <div className="px-2 py-3">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {user.full_name} · {ROLE_LABELS[user.role]}
                </p>
                {accountLinks(user.role).map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-canvas">
                    <l.icon className="h-4 w-4 text-muted" strokeWidth={1.5} /> {l.label}
                  </Link>
                ))}
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-canvas">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid gap-2 p-4">
                <Link href="/login" className="btn btn-outline">Sign in</Link>
                <Link href="/signup" className="btn btn-primary">Create free account</Link>
              </div>
            )}
            <div className="mt-auto p-4">
              <Link href="/list-project" className="btn btn-gold w-full">List your property — free</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
