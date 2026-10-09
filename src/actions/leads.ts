"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logActivity, notify } from "@/lib/activity";
import { getSessionUser, requireUser } from "@/lib/auth";
import { isStaff, LEAD_STAGE_LABELS } from "@/lib/constants";
import { mutate, nowIso, uid } from "@/lib/db";
import type { ActionState, Database } from "@/lib/types";
import { enquirySchema, fieldErrors, formValues, leadStageSchema } from "@/lib/validators";

/* Simple in-memory rate limit (per IP + phone). Swap for Upstash/Redis in production. */
const g = globalThis as unknown as { __rgRate?: Map<string, number[]> };
const hits = (g.__rgRate ??= new Map());
function limited(key: string, max = 8, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t: number) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

/** Mirrors the DB trigger: flag every lead of a buyer with a lister once they've enquired on 2+ projects. */
function recomputeRepeat(db: Database, buyerId: string, listerId: string) {
  const mine = db.leads.filter((l) => l.buyer_id === buyerId && l.lister_id === listerId);
  for (const l of mine) l.is_repeat = mine.length >= 2;
  return mine.length;
}

export async function enquiryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { message: "Please sign in to send an enquiry." };
  if (isStaff(user.role)) return { message: "Team accounts can't send enquiries." };

  const values = formValues(fd);
  const parsed = enquirySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(`enq:${ip}:${input.phone}`)) return { message: "You've sent a lot of enquiries in a short time. Please try again in a while.", values };

  const result = await mutate((db) => {
    const project = db.projects.find((p) => p.id === input.project_id && p.status === "verified");
    if (!project) return { error: "This property is no longer available." };
    if (project.lister_id === user.id) return { error: "This is your own listing, so you can't enquire on it." };

    const at = nowIso();
    let lead = db.leads.find((l) => l.project_id === project.id && l.buyer_id === user.id);
    const isNew = !lead;
    if (lead) {
      // on conflict (project_id, buyer_id) → update message, bump timestamp
      lead.message = input.message || lead.message;
      lead.phone = input.phone;
      lead.name = input.name;
      lead.updated_at = at;
      db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "note", from_stage: null, to_stage: null, note: `Enquired again: ${input.message || "(no message)"}`, created_at: at });
    } else {
      lead = {
        id: uid(),
        project_id: project.id,
        lister_id: project.lister_id,
        buyer_id: user.id,
        name: input.name,
        phone: input.phone,
        email: user.email,
        message: input.message,
        stage: "new",
        lost_reason: null,
        site_visit_at: null,
        next_followup_at: null,
        is_repeat: false,
        created_at: at,
        updated_at: at,
      };
      db.leads.push(lead);
      db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "created", from_stage: null, to_stage: "new", note: input.message || null, created_at: at });
    }

    const count = recomputeRepeat(db, user.id, project.lister_id);
    const repeat = count >= 2;
    notify(
      db,
      project.lister_id,
      repeat ? `Repeat enquirer — ${count} projects` : "New enquiry",
      `${input.name} enquired about ${project.title}.`,
      `/leads/${lead.id}`,
    );
    logActivity(db, user, isNew ? "lead.created" : "lead.updated", { type: "lead", id: lead.id }, { project: project.title, repeat, projects_with_lister: count });
    return { repeat, count };
  });

  if ("error" in result) return { message: result.error };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: result.repeat
      ? `Sent! The lister can see you're interested in ${result.count} of their properties, so expect a call soon.`
      : "Sent! The lister will call you shortly. You can track this under My enquiries.",
  };
}

export async function updateLeadAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/leads");
  const parsed = leadStageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  if (input.stage === "closed_lost" && !input.lost_reason) return { errors: { lost_reason: "Pick a reason so we can learn from it" } };
  if (input.stage === "site_visit_scheduled" && !input.site_visit_at) return { errors: { site_visit_at: "Choose the visit date and time" } };

  const result = await mutate((db) => {
    const lead = db.leads.find((l) => l.id === input.lead_id && l.lister_id === user.id);
    if (!lead) return { error: "Lead not found." };
    const at = nowIso();
    const from = lead.stage;
    if (from !== input.stage) {
      lead.stage = input.stage;
      db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "stage_change", from_stage: from, to_stage: input.stage, note: input.note, created_at: at });
      logActivity(db, user, "lead.stage_changed", { type: "lead", id: lead.id }, { from, to: input.stage });
    } else if (input.note) {
      db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "note", from_stage: null, to_stage: null, note: input.note, created_at: at });
      logActivity(db, user, "lead.note_added", { type: "lead", id: lead.id });
    }
    if (input.stage === "site_visit_scheduled" && input.site_visit_at) {
      lead.site_visit_at = new Date(input.site_visit_at).toISOString();
      db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "site_visit", from_stage: null, to_stage: null, note: `Site visit set for ${new Date(input.site_visit_at).toLocaleString("en-IN")}`, created_at: at });
    }
    lead.lost_reason = input.stage === "closed_lost" ? input.lost_reason : null;
    lead.updated_at = at;
    return { stage: input.stage, changed: from !== input.stage };
  });

  if ("error" in result) return { message: result.error };
  revalidatePath("/", "layout");
  return { ok: true, message: result.changed ? `Moved to “${LEAD_STAGE_LABELS[result.stage!]}”.` : "Note saved." };
}

export async function setFollowupAction(fd: FormData) {
  const user = await requireUser("/leads");
  const leadId = String(fd.get("lead_id"));
  const when = String(fd.get("next_followup_at") ?? "");
  await mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId && l.lister_id === user.id);
    if (!lead) return;
    lead.next_followup_at = when ? new Date(when).toISOString() : null;
    lead.updated_at = nowIso();
    db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "followup", from_stage: null, to_stage: null, note: when ? `Follow-up set for ${new Date(when).toLocaleString("en-IN")}` : "Follow-up cleared", created_at: nowIso() });
    logActivity(db, user, "lead.followup_set", { type: "lead", id: lead.id });
  });
  revalidatePath("/", "layout");
}

export async function logCallAction(fd: FormData) {
  const user = await requireUser("/leads");
  const leadId = String(fd.get("lead_id"));
  await mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId && l.lister_id === user.id);
    if (!lead) return;
    db.lead_activities.push({ id: uid(), lead_id: lead.id, actor_id: user.id, type: "call", from_stage: null, to_stage: null, note: "Called the buyer", created_at: nowIso() });
  });
  revalidatePath("/", "layout");
}

export async function markNotificationsReadAction() {
  const user = await requireUser("/notifications");
  await mutate((db) => {
    for (const n of db.notifications) if (n.user_id === user.id && !n.read_at) n.read_at = nowIso();
  });
  revalidatePath("/", "layout");
}
