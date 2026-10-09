import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/actions/profile";
import { ProfileForm } from "@/components/auth/profile-form";
import { RoleChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getProfile } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const profile = await getProfile(user.id);
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle eyebrow="Profile" title="Your details" description={<span className="flex items-center gap-2">Account type: <RoleChip role={user.role} /> · member since {formatDate(profile?.created_at)}</span>} />
      <section className="card p-6 sm:p-8">
        <ProfileForm user={user} />
      </section>

      <section className="rounded-2xl border border-danger/20 bg-[#fdf3f2] p-6">
        <h2 className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="h-4 w-4" /> Delete my account</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This permanently removes your account. Your listings are withdrawn and your name and number are removed from enquiries. This can&apos;t be undone.
        </p>
        <form action={deleteAccountAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="confirm" className="sr-only">Type DELETE to confirm</label>
          <input id="confirm" name="confirm" className="input sm:max-w-xs" placeholder="Type DELETE to confirm" required pattern="DELETE" />
          <SubmitButton className="btn btn-danger" pendingText="Deleting…">Delete account</SubmitButton>
        </form>
      </section>
    </div>
  );
}
