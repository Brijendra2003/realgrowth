import Link from "next/link";
import { ArchiveRestore, Eye, EyeOff, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { moderateProjectAction } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { TRASH_DAYS, type ProjectStatus } from "@/lib/constants";

type Op = { op: string; label: string; icon: LucideIcon; confirm?: string; tone: "neutral" | "go" | "danger" };

const TRASH: Op = {
  op: "trash",
  label: "Move to trash",
  icon: Trash2,
  confirm: `Move this listing to the trash? It will be deleted for good after ${TRASH_DAYS} days.`,
  tone: "danger",
};
const OPS: Partial<Record<ProjectStatus, Op[]>> = {
  verified: [
    { op: "hide", label: "Take offline", icon: EyeOff, confirm: "Take this listing off the site? The lister will be told and can send it back for review.", tone: "neutral" },
    TRASH,
  ],
  hidden: [{ op: "relist", label: "Make live", icon: Eye, tone: "go" }, TRASH],
  trashed: [{ op: "restore", label: "Restore", icon: ArchiveRestore, tone: "go" }],
};

const TONE: Record<Op["tone"], string> = {
  neutral: "text-ink-soft hover:border-brand-green/40 hover:bg-brand-green-50 hover:text-brand-green",
  go: "text-brand-green hover:border-brand-green/40 hover:bg-brand-green-50",
  danger: "text-ink-soft hover:border-danger/30 hover:bg-danger/10 hover:text-danger",
};

const BUTTON = "grid h-9 w-9 place-items-center rounded-xl border border-line bg-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:opacity-60";

/** Whole days left before a trashed listing is deleted for good. */
export function daysLeft(trashedAt: string | null) {
  if (!trashedAt) return TRASH_DAYS;
  return Math.max(0, TRASH_DAYS - Math.floor((Date.now() - new Date(trashedAt).getTime()) / 86_400_000));
}

/** The row of icon buttons the team uses on a listing: edit, plus whatever its status allows. */
export function ProjectActions({ id, status }: { id: string; status: ProjectStatus }) {
  return (
    <div className="flex justify-end gap-2">
      <div className="group relative">
        <Link href={`/admin/projects/${id}/edit`} aria-label="Edit" className={`${BUTTON} ${TONE.neutral}`}>
          <Pencil className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <Tooltip>Edit</Tooltip>
      </div>
      {(OPS[status] ?? [TRASH]).map((o) => (
        <form key={o.op} action={moderateProjectAction} className="group relative">
          <input type="hidden" name="project_id" value={id} />
          <SubmitButton name="op" value={o.op} label={o.label} confirm={o.confirm} pendingText="" className={`${BUTTON} ${TONE[o.tone]}`}>
            <o.icon className="h-4 w-4" strokeWidth={1.8} />
          </SubmitButton>
          <Tooltip>{o.label}</Tooltip>
        </form>
      ))}
    </div>
  );
}

/**
 * Shown above its `group` parent on hover and keyboard focus. Anchored to the
 * right edge so the last button's tooltip never pokes out of the table.
 */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-brand-green-900 px-2.5 py-1 text-xs font-medium text-brand-cream opacity-0 shadow-pop transition group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {children}
    </span>
  );
}
