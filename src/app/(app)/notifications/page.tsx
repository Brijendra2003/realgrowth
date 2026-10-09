import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationsReadAction } from "@/actions/leads";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { getNotifications } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const items = await getNotifications(user.id);
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      <PageTitle
        eyebrow="Notifications"
        title="What's new"
        description={unread ? `${unread} unread` : "You're all caught up."}
        action={
          unread > 0 && (
            <form action={markNotificationsReadAction}>
              <SubmitButton className="btn btn-outline btn-sm" pendingText="…"><CheckCheck className="h-4 w-4" /> Mark all as read</SubmitButton>
            </form>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" body="We'll let you know about new enquiries and listing updates." />
      ) : (
        <ul className="card divide-y divide-line-soft">
          {items.map((n) => {
            const body = (
              <div className="flex gap-4 p-4">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? "bg-line" : "bg-clay"}`} />
                <div className="flex-1">
                  <p className={n.read_at ? "font-medium" : "font-semibold"}>{n.title}</p>
                  <p className="text-sm text-ink-soft">{n.body}</p>
                </div>
                <p className="shrink-0 text-xs text-muted">{timeAgo(n.created_at)}</p>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-canvas">{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </>
  );
}
