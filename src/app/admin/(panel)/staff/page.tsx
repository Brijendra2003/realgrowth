import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { removeStaffAction } from "@/actions/admin";
import { StaffForm } from "@/components/admin/staff-form";
import { RoleChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireStaff } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { getStaff } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireStaff(["super_admin"]);
  const staff = await getStaff();
  return (
    <>
      <PageTitle eyebrow="System" title="Team members" description="Only super admins can add or remove staff accounts." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ul className="card divide-y divide-line-soft">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-green-900 text-sm font-bold text-brand-cream">{initials(s.full_name)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">{s.full_name} <RoleChip role={s.role} /></p>
                <p className="text-xs text-muted">+91 {s.phone}{s.email ? ` · ${s.email}` : ""} · since {formatDate(s.created_at)}</p>
              </div>
              {s.id !== me.id ? (
                <form action={removeStaffAction}>
                  <input type="hidden" name="user_id" value={s.id} />
                  <SubmitButton className="btn btn-ghost btn-sm text-danger" pendingText="…"><Trash2 className="h-4 w-4" /> Remove</SubmitButton>
                </form>
              ) : (
                <span className="text-xs text-muted">You</span>
              )}
            </li>
          ))}
        </ul>
        <section className="card p-6">
          <h2 className="mb-4 font-semibold">Add a team member</h2>
          <StaffForm />
        </section>
      </div>
    </>
  );
}
