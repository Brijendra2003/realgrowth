"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABELS, isStaff } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/types";
import { accountLinks } from "./account-links";

export function UserMenu({ user, unread }: { user: SessionUser; unread: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hidden items-center gap-1 sm:flex" ref={ref}>
      {!isStaff(user.role) && (
        <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-sand" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[0.6rem] font-bold text-white">{unread}</span>
          )}
        </Link>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 transition hover:border-brand-green/40"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-green text-xs font-bold text-brand-cream">{initials(user.full_name)}</span>
          <span className="hidden max-w-28 truncate text-sm font-medium md:block">{user.full_name.split(" ")[0]}</span>
          <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-full mt-2 w-64 animate-fade-up rounded-2xl border border-line bg-paper p-2 shadow-pop">
            <div className="px-3 pb-3 pt-2">
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-xs text-muted">
                {ROLE_LABELS[user.role]}
                {user.company_name ? ` · ${user.company_name}` : ""}
              </p>
            </div>
            <div className="h-px bg-line-soft" />
            <ul className="py-1">
              {accountLinks(user.role).map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-canvas hover:text-ink"
                  >
                    <l.icon className="h-4 w-4 text-muted" strokeWidth={1.5} />
                    {l.label}
                    {l.href === "/notifications" && unread > 0 && (
                      <span className="ml-auto rounded-full bg-clay px-1.5 text-[0.65rem] font-bold text-white">{unread}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="h-px bg-line-soft" />
            <form action={logoutAction} className="pt-1">
              <button type="submit" role="menuitem" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-canvas hover:text-danger">
                <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
