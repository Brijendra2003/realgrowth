import type { Metadata } from "next";
import { Ban, CircleCheck } from "lucide-react";
import { setBlockedAction } from "@/actions/admin";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { RoleChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireStaff } from "@/lib/auth";
import { PUBLIC_ROLES, ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getAllUsers } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const f = { role: typeof sp.role === "string" ? sp.role : undefined, q: typeof sp.q === "string" ? sp.q : undefined };
  const staff = await requireStaff();
  const canBlock = staff.role === "admin" || staff.role === "super_admin";
  const users = await getAllUsers(f);
  return (
    <>
      <PageTitle eyebrow="Moderation" title="Users" description={`${users.length} ${users.length === 1 ? "account" : "accounts"} · buyers and listers${canBlock ? "" : " · only admins can block accounts"}`} />
      <AutoSubmitGet action="/admin/users" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={f.q} placeholder="Search name, phone, email or company…" className="input sm:max-w-sm" />
        <select name="role" defaultValue={f.role ?? ""} className="input sm:max-w-[12rem]">
          <option value="">All roles</option>
          {PUBLIC_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button className="btn btn-outline">Search</button>
      </AutoSubmitGet>
      <div className="card overflow-x-auto">
        <table className="table-clean min-w-[52rem]">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Phone</th><th className="text-right">Listings</th><th className="text-right">Enquiries</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.is_blocked ? "opacity-60" : ""}>
                <td>
                  <p className="font-medium">{u.full_name}{u.is_blocked && <span className="chip ml-2 bg-[#fdecea] text-danger">Blocked</span>}</p>
                  <p className="text-xs text-muted">{u.company_name ?? u.email ?? ""}</p>
                </td>
                <td><RoleChip role={u.role} /></td>
                <td className="font-mono text-xs">+91 {u.phone}</td>
                <td className="text-right">{u.projects}</td>
                <td className="text-right">{u.enquiries}</td>
                <td className="text-xs text-muted">{formatDate(u.created_at)}</td>
                <td className="text-right">
                  {canBlock && (
                    <form action={setBlockedAction}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="block" value={u.is_blocked ? "0" : "1"} />
                      <SubmitButton className={`btn btn-sm ${u.is_blocked ? "btn-outline" : "btn-ghost text-danger"}`} pendingText="…">
                        {u.is_blocked ? <><CircleCheck className="h-4 w-4" /> Unblock</> : <><Ban className="h-4 w-4" /> Block</>}
                      </SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
