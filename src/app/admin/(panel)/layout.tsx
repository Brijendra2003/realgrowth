import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { LogoMark } from "@/components/brand/logo";
import { AdminNav } from "@/components/layout/account-nav";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";

export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col bg-brand-green-900 text-brand-cream lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <LogoMark className="h-11 w-auto" line="#FFDFA0" />
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.22em]">REAL GROWTH</p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-brand-gold">Team console</p>
          </div>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4 max-lg:max-h-72">
          <AdminNav role={user.role} />
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-cream text-xs font-bold text-brand-green-900">{initials(user.full_name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
              <p className="text-xs text-brand-gold">{ROLE_LABELS[user.role]}</p>
            </div>
            <form action={logoutAction}>
              <button className="grid h-9 w-9 place-items-center rounded-full text-brand-cream/70 hover:bg-white/10 hover:text-white" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <Link href="/" className="mt-3 flex items-center gap-1.5 text-xs text-brand-cream/60 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" /> View public site
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
