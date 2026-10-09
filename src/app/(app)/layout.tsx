import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountNav } from "@/components/layout/account-nav";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABELS, isStaff } from "@/lib/constants";
import { initials } from "@/lib/format";

export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (isStaff(user.role)) redirect("/admin");

  return (
    <>
      <SiteHeader />
      <div className="container-page grid grid-cols-1 flex-1 gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-green font-display text-sm font-bold text-brand-cream">
                {initials(user.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.full_name}</p>
                <p className="truncate text-xs text-muted">{user.company_name ?? ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <AccountNav role={user.role} />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 lg:hidden">
            <AccountNav role={user.role} horizontal />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
