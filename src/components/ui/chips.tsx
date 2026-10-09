import { BadgeCheck, Building2, Crown, Flame, Home, Repeat, UserRound } from "lucide-react";
import {
  LEAD_STAGE_LABELS,
  PROJECT_STATUS_LABELS,
  ROLE_LABELS,
  type LeadStage,
  type ProjectStatus,
  type UserRole,
} from "@/lib/constants";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  unverified: "bg-brand-gold-50 text-[#8a6100] ring-1 ring-brand-gold/30",
  verified: "bg-brand-green-50 text-brand-green ring-1 ring-brand-green/20",
  rejected: "bg-clay-50 text-clay ring-1 ring-clay/25",
  sold: "bg-[#ece8f7] text-[#5b4a99] ring-1 ring-[#5b4a99]/20",
  withdrawn: "bg-line-soft text-muted ring-1 ring-line",
};

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={`chip ${STATUS_STYLE[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

const STAGE_STYLE: Record<LeadStage, string> = {
  new: "bg-[#e6f0fb] text-info",
  contacted: "bg-brand-gold-50 text-[#8a6100]",
  site_visit_scheduled: "bg-[#efe9fb] text-[#5b4a99]",
  site_visit_done: "bg-[#e8f3f7] text-[#24708a]",
  negotiation: "bg-clay-50 text-clay",
  closed_won: "bg-brand-green-50 text-brand-green",
  closed_lost: "bg-line-soft text-muted",
};

export function LeadStageChip({ stage }: { stage: LeadStage }) {
  return <span className={`chip ${STAGE_STYLE[stage]}`}>{LEAD_STAGE_LABELS[stage]}</span>;
}

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span className={`chip bg-brand-green text-white shadow-sm ${size === "md" ? "px-3 py-1 text-xs" : ""}`}>
      <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
      Verified
    </span>
  );
}

export function ListerBadge({ role }: { role: UserRole }) {
  const Icon = role === "developer" ? Building2 : role === "broker" ? UserRound : Home;
  return (
    <span className="chip bg-sand text-ink-soft">
      <Icon className="h-3 w-3" strokeWidth={1.8} />
      {ROLE_LABELS[role]}
    </span>
  );
}

export function RepeatBadge({ count }: { count: number }) {
  return (
    <span className="chip bg-clay text-white">
      <Repeat className="h-3 w-3" strokeWidth={2.2} />
      Repeat enquirer — {count} projects
    </span>
  );
}

export function PriorityBadge() {
  return (
    <span className="chip bg-clay-50 text-clay ring-1 ring-clay/20">
      <Flame className="h-3 w-3" strokeWidth={2} />
      High priority
    </span>
  );
}

export function RoleChip({ role }: { role: UserRole }) {
  const staff = role === "ops" || role === "admin" || role === "super_admin";
  return (
    <span className={`chip ${staff ? "bg-brand-green-900 text-brand-cream" : "bg-sand text-ink-soft"}`}>
      {role === "super_admin" && <Crown className="h-3 w-3" strokeWidth={2} />}
      {ROLE_LABELS[role]}
    </span>
  );
}
