"use server";

import { revalidatePath } from "next/cache";
import { logActivity, notify } from "@/lib/activity";
import { getSessionUser, requireUser } from "@/lib/auth";
import { CAPTCHA_FAILED, verifyCaptcha } from "@/lib/captcha";
import { isStaff, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/constants";
import { buyerKey } from "@/lib/queries";
import { clientIp, limited } from "@/lib/rate-limit";
import { row, rows, sb, total } from "@/lib/supabase";
import type { ActionState, Lead, LeadActivity } from "@/lib/types";
import { enquirySchema, fieldErrors, formValues, leadStageSchema } from "@/lib/validators";

const HOUR = 60 * 60 * 1000;
const SEND_FAILED = "We couldn't send your enquiry just now. Please try again.";

/** Form date-times have no zone; the service area is India, so read them as IST wherever the server runs. */
function parseIst(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type NewActivity = Pick<LeadActivity, "lead_id" | "actor_id" | "type"> & Partial<Pick<LeadActivity, "from_stage" | "to_stage" | "note">>;

async function addActivity(a: NewActivity) {
  const db = await sb();
  const { error } = await db.from("lead_activities").insert(a);
  if (error) console.error(`[lead] activity: ${error.message}`);
}

/** Buyers don't need an account: a visitor is identified by the phone number they give. */
export async function enquiryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (user && isStaff(user.role)) return { message: "Team accounts can't send enquiries." };

  const values = formValues(fd);
  const parsed = enquirySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  if (!(await verifyCaptcha(fd))) return { message: CAPTCHA_FAILED, values };
  const ip = await clientIp();
  if ((await limited(`enq:${ip}:${input.phone}`, 8, HOUR)) || (await limited(`enq:${ip}`, 20, HOUR))) {
    return { message: "You've sent a lot of enquiries in a short time. Please try again in a while.", values };
  }

  const db = await sb();
  const project = row<{ id: string; title: string; lister_id: string }>(
    await db.from("projects").select("id,title,lister_id").eq("id", input.project_id).eq("status", "verified").maybeSingle(),
  );
  if (!project) return { message: "This property is no longer available." };
  const buyerId = user?.id ?? null;
  if (project.lister_id === buyerId) return { message: "This is your own listing, so you can't enquire on it." };
  const key = buyerKey({ buyer_id: buyerId, phone: input.phone });

  const existing = row<Pick<Lead, "id" | "message">>(await db.from("leads").select("id,message").eq("project_id", project.id).eq("buyer_key", key).maybeSingle());
  let leadId: string;
  if (existing) {
    // Same person, same property: update the message and remind the lister.
    leadId = existing.id;
    const { error } = await db.from("leads").update({ message: input.message || existing.message, phone: input.phone, name: input.name }).eq("id", leadId);
    if (error) {
      console.error(`[enquiry] ${error.message}`);
      return { message: SEND_FAILED, values };
    }
    await addActivity({ lead_id: leadId, actor_id: buyerId, type: "note", note: `Enquired again: ${input.message || "(no message)"}` });
  } else {
    const { data, error } = await db
      .from("leads")
      .insert({ project_id: project.id, lister_id: project.lister_id, buyer_id: buyerId, name: input.name, phone: input.phone, email: user?.email ?? null, message: input.message })
      .select("id")
      .single();
    if (error) {
      console.error(`[enquiry] ${error.message}`);
      return { message: SEND_FAILED, values };
    }
    leadId = (data as { id: string }).id;
    await addActivity({ lead_id: leadId, actor_id: buyerId, type: "created", to_stage: "new", note: input.message || null });
  }

  // The database trigger flags repeat enquirers; this only reads the result for the messages.
  const count = total(await db.from("leads").select("id", { count: "exact", head: true }).eq("lister_id", project.lister_id).eq("buyer_key", key));
  const repeat = count >= 2;
  await notify(project.lister_id, repeat ? `Repeat enquirer — ${count} projects` : "New enquiry", `${input.name} enquired about ${project.title}.`, `/leads/${leadId}`);
  await logActivity(user, existing ? "lead.updated" : "lead.created", { type: "lead", id: leadId }, { project: project.title, name: input.name, repeat, projects_with_lister: count });

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: repeat
      ? `Sent! The lister can see you're interested in ${count} of their properties, so expect a call soon.`
      : "Sent! The lister will call you shortly.",
  };
}

/** A lead the signed-in lister owns, or null. */
async function ownLead(leadId: string, listerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  const db = await sb();
  return row<Pick<Lead, "id" | "stage">>(await db.from("leads").select("id,stage").eq("id", leadId).eq("lister_id", listerId).maybeSingle());
}

export async function updateLeadAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/leads");
  const parsed = leadStageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  if (input.stage === "closed_lost" && !input.lost_reason) return { errors: { lost_reason: "Pick a reason so we can learn from it" } };
  const visitAt = parseIst(input.site_visit_at);
  if (input.stage === "site_visit_scheduled" && !visitAt) return { errors: { site_visit_at: "Choose the visit date and time" } };

  const lead = await ownLead(input.lead_id, user.id);
  if (!lead) return { message: "Lead not found." };
  const from: LeadStage = lead.stage;
  const changed = from !== input.stage;
  const scheduled = input.stage === "site_visit_scheduled" && visitAt;

  const db = await sb();
  const { error } = await db
    .from("leads")
    .update({
      stage: input.stage,
      lost_reason: input.stage === "closed_lost" ? input.lost_reason : null,
      ...(scheduled ? { site_visit_at: visitAt.toISOString() } : {}),
    })
    .eq("id", lead.id);
  if (error) {
    console.error(`[lead.update] ${error.message}`);
    return { message: "We couldn't save that just now. Please try again." };
  }

  if (changed) {
    await addActivity({ lead_id: lead.id, actor_id: user.id, type: "stage_change", from_stage: from, to_stage: input.stage, note: input.note });
    await logActivity(user, "lead.stage_changed", { type: "lead", id: lead.id }, { from, to: input.stage });
  } else if (input.note) {
    await addActivity({ lead_id: lead.id, actor_id: user.id, type: "note", note: input.note });
    await logActivity(user, "lead.note_added", { type: "lead", id: lead.id });
  }
  if (scheduled) {
    await addActivity({ lead_id: lead.id, actor_id: user.id, type: "site_visit", note: `Site visit set for ${visitAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` });
  }

  revalidatePath("/", "layout");
  return { ok: true, message: changed ? `Moved to “${LEAD_STAGE_LABELS[input.stage]}”.` : "Note saved." };
}

export async function setFollowupAction(fd: FormData) {
  const user = await requireUser("/leads");
  const lead = await ownLead(String(fd.get("lead_id")), user.id);
  if (!lead) return;
  const raw = String(fd.get("next_followup_at") ?? "");
  const when = parseIst(raw);
  if (raw && !when) return;
  const db = await sb();
  await db.from("leads").update({ next_followup_at: when ? when.toISOString() : null }).eq("id", lead.id);
  await addActivity({
    lead_id: lead.id,
    actor_id: user.id,
    type: "followup",
    note: when ? `Follow-up set for ${when.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : "Follow-up cleared",
  });
  await logActivity(user, "lead.followup_set", { type: "lead", id: lead.id });
  revalidatePath("/", "layout");
}

export async function logCallAction(fd: FormData) {
  const user = await requireUser("/leads");
  const lead = await ownLead(String(fd.get("lead_id")), user.id);
  if (!lead) return;
  await addActivity({ lead_id: lead.id, actor_id: user.id, type: "call", note: "Called the buyer" });
  revalidatePath("/", "layout");
}

export async function markNotificationsReadAction() {
  const user = await requireUser("/notifications");
  const db = await sb();
  rows(await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null).select("id"));
  revalidatePath("/", "layout");
}
