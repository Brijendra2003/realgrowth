"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, notify } from "@/lib/activity";
import { requireBuyer, requireLister } from "@/lib/auth";
import { MAX_REQUIREMENTS } from "@/lib/constants";
import { describeRequirement, MATCH_THRESHOLD, scoreMatch } from "@/lib/matching";
import { getListersMatchingRequirement, getOwnRequirement, getReferenceData, type MatchFacts } from "@/lib/queries";
import { limited } from "@/lib/rate-limit";
import { row, sb, total } from "@/lib/supabase";
import type { ActionState, Lead, Requirement, RequirementContact } from "@/lib/types";
import { fieldErrors, formValues, requirementSchema } from "@/lib/validators";

const HOUR = 60 * 60 * 1000;
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);
const SAVE_FAILED = "We couldn't save that just now. Please try again.";

/* ───────────── Buyer: post, edit, pause, delete ───────────── */

export async function saveRequirementAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const user = await requireBuyer(id ? `/requirements/${id}/edit` : "/requirements/new");
  const values = formValues(fd);
  const raw: Record<string, unknown> = Object.fromEntries(fd);
  for (const k of ["area_ids", "property_type_ids", "configurations", "categories"]) raw[k] = fd.getAll(k).map(String);
  const parsed = requirementSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  // Areas and types must be real, live options, and types must suit the segment.
  const { areas, propertyTypes } = await getReferenceData();
  if (!input.area_ids.every((a) => areas.some((x) => x.id === a))) return { errors: { area_ids: "Pick areas from the list" }, values };
  if (!input.property_type_ids.every((t) => propertyTypes.some((x) => x.id === t && x.segment === input.segment))) {
    return { errors: { property_type_ids: "Pick property types from the list" }, values };
  }

  const db = await sb();
  const record = {
    purpose: input.purpose,
    segment: input.segment,
    area_ids: input.area_ids,
    property_type_ids: input.property_type_ids,
    configurations: input.segment === "commercial" ? [] : input.configurations,
    categories: input.categories,
    budget_min: input.budget_min,
    budget_max: input.budget_max,
    min_carpet_sqft: input.min_carpet_sqft,
    note: input.note,
  };

  if (id) {
    const existing = await getOwnRequirement(user.id, id);
    if (!existing) return { errors: { form: "This requirement was not found." }, values };
    const { error } = await db.from("requirements").update(record).eq("id", id).eq("buyer_id", user.id);
    if (error) {
      console.error(`[requirement.update] ${error.message}`);
      return { errors: { form: SAVE_FAILED }, values };
    }
    await logActivity(user, "requirement.updated", { type: "requirement", id });
    revalidatePath("/", "layout");
    redirect(`/requirements/${id}?saved=updated`);
  }

  const count = total(await db.from("requirements").select("id", { count: "exact", head: true }).eq("buyer_id", user.id));
  if (count >= MAX_REQUIREMENTS) {
    return { errors: { form: `You can keep up to ${MAX_REQUIREMENTS} requirements. Delete one you no longer need to add another.` }, values };
  }
  if (await limited(`req:${user.id}`, 10, HOUR)) return { errors: { form: "Too many changes in a short time. Please try again later." }, values };

  const { data, error } = await db.from("requirements").insert({ ...record, buyer_id: user.id }).select("*").single();
  if (error) {
    console.error(`[requirement.create] ${error.message}`);
    return { errors: { form: SAVE_FAILED }, values };
  }
  const created = data as Requirement;
  await logActivity(user, "requirement.created", { type: "requirement", id: created.id }, { purpose: input.purpose, segment: input.segment });

  // Tell each lister with a matching live listing that a new buyer is looking (once per lister).
  const ref = await getReferenceData();
  const summary = describeRequirement(created, { areas: ref.allAreas, propertyTypes: ref.propertyTypes });
  for (const m of await getListersMatchingRequirement(created)) {
    await notify(
      m.listerId,
      `New buyer — ${m.percent}% match`,
      `A buyer is looking for: ${summary.title}, ${summary.areas}, ${summary.budget}. It matches ${m.project.title}.`,
      `/matching-buyers?project=${m.project.id}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(`/requirements/${created.id}?saved=new`);
}

export async function toggleRequirementAction(fd: FormData) {
  const user = await requireBuyer();
  const r = await getOwnRequirement(user.id, String(fd.get("id")));
  if (!r) return;
  const db = await sb();
  await db.from("requirements").update({ is_active: !r.is_active }).eq("id", r.id);
  await logActivity(user, r.is_active ? "requirement.paused" : "requirement.resumed", { type: "requirement", id: r.id });
  revalidatePath("/", "layout");
}

export async function deleteRequirementAction(fd: FormData) {
  const user = await requireBuyer();
  const r = await getOwnRequirement(user.id, String(fd.get("id")));
  if (!r) return;
  const db = await sb();
  await db.from("requirements").delete().eq("id", r.id);
  await logActivity(user, "requirement.deleted", { type: "requirement", id: r.id });
  revalidatePath("/", "layout");
  redirect("/requirements?deleted=1");
}

/* ───────────── Lister asks to connect, buyer accepts or declines ───────────── */

export async function requestContactAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireLister("/matching-buyers");
  const requirementId = String(fd.get("requirement_id") ?? "");
  const projectId = String(fd.get("project_id") ?? "");
  if (!isUuid(requirementId) || !isUuid(projectId)) return { message: "Not found." };

  const db = await sb();
  const [project, requirement] = await Promise.all([
    db
      .from("projects")
      .select("id,lister_id,title,slug,purpose,segment,area_id,property_type_id,configuration,price,carpet_area_sqft,category")
      .eq("id", projectId)
      .eq("lister_id", user.id)
      .eq("status", "verified")
      .maybeSingle()
      .then((r) => row<MatchFacts>(r)),
    db.from("requirements").select("*").eq("id", requirementId).eq("is_active", true).maybeSingle().then((r) => row<Requirement>(r)),
  ]);
  if (!project || !requirement || requirement.buyer_id === user.id) return { message: "This buyer is no longer looking." };
  const { allAreas } = await getReferenceData();
  const percent = scoreMatch(requirement, project, allAreas)?.percent ?? 0;
  if (percent < MATCH_THRESHOLD) return { message: "This property no longer matches what the buyer wants." };
  if (await limited(`contact:${user.id}`, 40, 24 * HOUR)) return { message: "You've sent many requests today. Please try again tomorrow." };

  const { data, error } = await db
    .from("requirement_contacts")
    .insert({ requirement_id: requirement.id, project_id: project.id, lister_id: user.id, match_percent: percent })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: true, message: "Request already sent." };
    console.error(`[contact.request] ${error.message}`);
    return { message: SAVE_FAILED };
  }

  const from = user.company_name ?? user.full_name;
  await notify(
    requirement.buyer_id,
    `${percent}% match — ${from} wants to connect`,
    `${from} thinks ${project.title} suits what you're looking for. Accept to share your number with them.`,
    `/requirements/${requirement.id}#requests`,
  );
  await logActivity(user, "requirement.contact_requested", { type: "requirement_contact", id: (data as { id: string }).id }, { project: project.title, percent });
  revalidatePath("/", "layout");
  return { ok: true, message: "Request sent. You'll see their number here if they accept." };
}

export async function respondContactAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireBuyer();
  const contactId = String(fd.get("contact_id") ?? "");
  const accept = fd.get("decision") === "accept";
  if (!isUuid(contactId)) return { message: "Request not found." };

  const db = await sb();
  const contact = row<RequirementContact & { requirement: Pick<Requirement, "buyer_id"> | null; project: { title: string } | null }>(
    await db.from("requirement_contacts").select("*,requirement:requirements(buyer_id),project:projects(title)").eq("id", contactId).maybeSingle(),
  );
  if (!contact || contact.requirement?.buyer_id !== user.id) return { message: "Request not found." };
  if (contact.status !== "pending") return { ok: true, message: "You've already answered this request." };
  const title = contact.project?.title ?? "their property";
  const now = new Date().toISOString();

  if (!accept) {
    await db.from("requirement_contacts").update({ status: "declined", responded_at: now }).eq("id", contact.id);
    await notify(contact.lister_id, "A buyer said no thanks", `A matching buyer declined to connect about ${title}.`, `/matching-buyers?project=${contact.project_id}`);
    await logActivity(user, "requirement.contact_declined", { type: "requirement_contact", id: contact.id });
    revalidatePath("/", "layout");
    return { ok: true, message: "Declined. The lister won't see your details." };
  }

  // Accepting works like an enquiry: the buyer becomes a lead on that listing.
  const existing = row<Pick<Lead, "id">>(await db.from("leads").select("id").eq("project_id", contact.project_id).eq("buyer_key", user.id).maybeSingle());
  let leadId = existing?.id;
  if (!leadId) {
    const { data, error } = await db
      .from("leads")
      .insert({
        project_id: contact.project_id,
        lister_id: contact.lister_id,
        buyer_id: user.id,
        name: user.full_name,
        phone: user.phone,
        email: user.email,
        message: `Matched with their requirement (${contact.match_percent}% match). They accepted your request to connect.`,
      })
      .select("id")
      .single();
    if (error) {
      console.error(`[contact.accept] ${error.message}`);
      return { message: "This property is no longer available." };
    }
    leadId = (data as { id: string }).id;
    await db.from("lead_activities").insert({ lead_id: leadId, actor_id: user.id, type: "created", to_stage: "new", note: `From a requirement match (${contact.match_percent}%)` });
  }
  await db.from("requirement_contacts").update({ status: "accepted", responded_at: now, lead_id: leadId }).eq("id", contact.id);
  await notify(contact.lister_id, `Buyer accepted — ${contact.match_percent}% match`, `${user.full_name} shared their number for ${title}. Call them soon.`, `/leads/${leadId}`);
  await logActivity(user, "lead.created", { type: "lead", id: leadId }, { project: title, name: user.full_name, source: "requirement_match", percent: contact.match_percent });
  revalidatePath("/", "layout");
  return { ok: true, message: "Shared! The lister will call you shortly. You can track it under My enquiries." };
}
