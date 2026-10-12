import Link from "next/link";
import { Building2, CircleUserRound, Flag, Inbox, KeyRound, MapPinned, ShieldCheck } from "lucide-react";
import { RoleChip } from "@/components/ui/chips";
import { LEAD_STAGE_LABELS, ROLE_LABELS, type LeadStage, type UserRole } from "@/lib/constants";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { ActivityLog } from "@/lib/types";

type Entry = ActivityLog & { actor: string };

const ICONS: Record<string, typeof Inbox> = {
  user: CircleUserRound,
  project: Building2,
  lead: Inbox,
  staff: ShieldCheck,
  area: MapPinned,
};

// The log stores raw keys ("super_admin", "site_visit_done"); show the same labels as the rest of the app.
const roleName = (v: unknown) => (typeof v === "string" ? (ROLE_LABELS[v as UserRole] ?? v) : undefined);
const stageName = (v: unknown) => (typeof v === "string" ? (LEAD_STAGE_LABELS[v as LeadStage] ?? v) : "—");

function describe(e: Entry): string {
  const m = e.metadata as Record<string, string | boolean | number | undefined>;
  switch (e.action) {
    case "user.signup": return `signed up as ${roleName(m.role) ?? "a user"}`;
    case "user.login": return m.via ? `signed in (${m.via})` : "signed in";
    case "user.logout": return "signed out";
    case "user.blocked": return `blocked ${m.name}`;
    case "user.unblocked": return `unblocked ${m.name}`;
    case "user.profile_updated": return "updated their profile";
    case "user.deleted": return "deleted their account";
    case "project.created": return `listed “${m.title}”`;
    case "project.edited": return `edited “${m.title}”${m.key_fields_changed ? " (key fields)" : ""}`;
    case "project.resubmitted": return `resubmitted “${m.title}” for review`;
    case "project.verified": return `verified “${m.title}”`;
    case "project.rejected": return `rejected “${m.title}”${m.reason ? ` — ${m.reason}` : ""}`;
    case "project.sold": return `marked “${m.title}” as sold`;
    case "project.withdrawn": return `withdrew “${m.title}”`;
    case "lead.created": return `enquired on “${m.project}”`;
    case "lead.updated": return `enquired again on “${m.project}”`;
    case "lead.stage_changed": return `moved a lead ${stageName(m.from)} → ${stageName(m.to)}`;
    case "lead.note_added": return "added a note to a lead";
    case "lead.followup_set": return "set a follow-up";
    case "staff.created": return `added ${m.name} as ${roleName(m.role) ?? "staff"}`;
    case "staff.removed": return `removed ${m.name}`;
    case "area.created": return `added area ${m.name}`;
    case "area.hidden": return `hid area ${m.name}`;
    case "area.shown": return `showed area ${m.name}`;
    default: return e.action;
  }
}

function link(e: Entry) {
  if (e.entity_type === "project" && e.entity_id) return `/admin/verification/${e.entity_id}`;
  return null;
}

export function ActivityList({ entries, compact = false }: { entries: Entry[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-line-soft">
      {entries.map((e) => {
        const Icon = ICONS[e.action.split(".")[0]!] ?? KeyRound;
        const repeat = e.action === "lead.created" && (e.metadata as { repeat?: boolean }).repeat;
        const href = link(e);
        const text = (
          <>
            <strong className="font-semibold">{e.actor}</strong> {describe(e)}
          </>
        );
        return (
          <li key={e.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-brand-green">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-ink-soft">{href ? <Link href={href} className="hover:text-brand-green">{text}</Link> : text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {e.actor_role && !compact && <RoleChip role={e.actor_role} />}
                <span title={formatDateTime(e.created_at)}>{timeAgo(e.created_at)}</span>
                {repeat && (
                  <span className="chip bg-clay-50 text-clay"><Flag className="h-3 w-3" /> Repeat enquirer</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
