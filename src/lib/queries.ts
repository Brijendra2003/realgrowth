import "server-only";
import { ALL_BUDGETS, LEAD_STAGES, LISTER_ROLES, OPEN_STAGES, STAFF_ROLES, type LeadStage, type UserRole } from "./constants";
import { slugify } from "./format";
import { fetchAll, row, rows, sb, total } from "./supabase";
import type { ActivityLog, Area, Lead, LeadActivity, Notification, Profile, Project, ProjectReview, PropertyType } from "./types";

export type ListerSummary = Pick<Profile, "id" | "full_name" | "role" | "company_name" | "agent_rera_no" | "created_at">;
export type PublicProfile = Omit<Profile, "password_hash">;

export type ProjectView = Project & {
  area: Area;
  type: PropertyType;
  lister: ListerSummary;
  cover: string | null;
};

/* ───────────── Column lists and row mappers ───────────── */

const LISTER_COLS = "id,full_name,role,company_name,agent_rera_no,created_at";
const PROFILE_COLS = "id,role,full_name,phone,email,company_name,agent_rera_no,is_blocked,created_at,updated_at";
const PROJECT_COLS =
  "id,code,lister_id,title,slug,description,segment,category,construction_status,purpose,property_type_id,area_id,address_line,configuration,carpet_area_sqft,price,maharera_no,possession_date,amenities,status,rejection_reason,verified_by,verified_at,views_count,created_at,updated_at";
const PROJECT_SELECT = `${PROJECT_COLS},area:areas(id,zone,name,is_active),type:property_types(id,segment,name,slug),lister:profiles!projects_lister_id_fkey(${LISTER_COLS}),media:project_media(id,url,kind,sort_order,cloudinary_public_id)`;
const LEAD_COLS = "id,project_id,lister_id,buyer_id,name,phone,email,message,stage,lost_reason,site_visit_at,next_followup_at,is_repeat,created_at,updated_at";
const LEAD_SELECT = `${LEAD_COLS},project:projects(id,title,slug,code,price,purpose,area:areas(name),media:project_media(url,sort_order))`;

type ProjectRecord = Omit<ProjectView, "cover" | "lister"> & { lister: ListerSummary | null };

function toView(r: ProjectRecord): ProjectView {
  const media = [...(r.media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...r,
    price: Number(r.price),
    carpet_area_sqft: Number(r.carpet_area_sqft),
    media,
    lister: r.lister ?? { id: r.lister_id, full_name: "Unknown", role: "owner", company_name: null, agent_rera_no: null, created_at: "" },
    cover: media[0]?.url ?? null,
  };
}

export type LeadRow = Lead & { project: Pick<Project, "id" | "title" | "slug" | "code" | "price" | "purpose"> & { area: string; cover: string | null } };

type LeadRecord = Lead & {
  project: Pick<Project, "id" | "title" | "slug" | "code" | "price" | "purpose"> & { area: { name: string } | null; media: { url: string; sort_order: number }[] };
};

function toLeadRow(r: LeadRecord): LeadRow {
  const { area, media, ...p } = r.project;
  const cover = [...(media ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
  return { ...r, project: { ...p, price: Number(p.price), area: area?.name ?? "", cover } };
}

const newestFirst = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);

/* ───────────── Reference data ───────────── */

export async function getReferenceData() {
  const db = await sb();
  const [areas, types] = await Promise.all([
    db.from("areas").select("id,zone,name,is_active").order("id"),
    db.from("property_types").select("id,segment,name,slug").order("id"),
  ]);
  const allAreas = rows<Area>(areas);
  return { areas: allAreas.filter((a) => a.is_active), allAreas, propertyTypes: rows<PropertyType>(types) };
}

/* ───────────── Public discovery ───────────── */

export type SearchFilters = {
  q?: string;
  segment?: string;
  category?: string;
  purpose?: string;
  area?: string; // area slug
  zone?: string;
  type?: string; // property type slug
  budget?: string;
  config?: string;
  sort?: string;
  page?: string;
};

export const PAGE_SIZE = 9;

const idList = (ids: (string | number)[]) => (ids.length ? ids : [-1]);

export async function searchProjects(f: SearchFilters) {
  const db = await sb();
  const { allAreas, propertyTypes } = await getReferenceData();

  // Free-text terms: letters and digits only, so they are safe inside a filter expression.
  const terms = (f.q ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .slice(0, 6);
  let companies: { id: string; company_name: string | null }[] = [];
  if (terms.length) {
    companies = rows(
      await db
        .from("profiles")
        .select("id,company_name")
        .in("role", [...LISTER_ROLES])
        .or(terms.map((t) => `company_name.ilike.%${t}%`).join(","))
        .limit(200),
    );
  }

  const budget = ALL_BUDGETS.find((b) => b.value === f.budget);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the query builder's generic type changes with every call
  const filtered = <Q extends { eq: any; in: any; gte: any; lte: any; or: any }>(query: Q): Q => {
    let q = query.eq("status", "verified");
    if (f.segment === "residential" || f.segment === "commercial") q = q.eq("segment", f.segment);
    if (f.category) q = q.eq("category", f.category);
    if (f.purpose === "sale" || f.purpose === "rent") q = q.eq("purpose", f.purpose);
    if (f.config) q = q.eq("configuration", f.config);
    if (f.area) q = q.in("area_id", idList(allAreas.filter((a) => slugify(a.name) === f.area).map((a) => a.id)));
    if (f.zone) q = q.in("area_id", idList(allAreas.filter((a) => slugify(a.zone) === f.zone).map((a) => a.id)));
    if (f.type) q = q.in("property_type_id", idList(propertyTypes.filter((t) => t.slug === f.type).map((t) => t.id)));
    if (budget) {
      q = q.eq("purpose", budget.value.startsWith("r-") ? "rent" : "sale");
      if (budget.min !== undefined) q = q.gte("price", budget.min);
      if (budget.max !== undefined) q = q.lte("price", budget.max);
    }
    for (const t of terms) {
      const parts = ["title", "description", "address_line", "configuration", "code"].map((c) => `${c}.ilike.%${t}%`);
      const areaIds = allAreas.filter((a) => `${a.name} ${a.zone}`.toLowerCase().includes(t)).map((a) => a.id);
      const typeIds = propertyTypes.filter((p) => p.name.toLowerCase().includes(t)).map((p) => p.id);
      const listerIds = companies.filter((c) => c.company_name?.toLowerCase().includes(t)).map((c) => c.id);
      if (areaIds.length) parts.push(`area_id.in.(${areaIds.join(",")})`);
      if (typeIds.length) parts.push(`property_type_id.in.(${typeIds.join(",")})`);
      if (listerIds.length) parts.push(`lister_id.in.(${listerIds.join(",")})`);
      q = q.or(parts.join(","));
    }
    return q;
  };

  const count = total(await filtered(db.from("projects").select("id", { count: "exact", head: true })));
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(f.page) || 1));
  if (count === 0) return { items: [] as ProjectView[], total: 0, page, pages };

  let query = filtered(db.from("projects").select(PROJECT_SELECT));
  if (f.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (f.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const items = rows<ProjectRecord>(await query.order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)).map(toView);
  return { items, total: count, page, pages };
}

export async function getNewestProjects(limit = 6) {
  const db = await sb();
  return rows<ProjectRecord>(
    await db.from("projects").select(PROJECT_SELECT).eq("status", "verified").order("created_at", { ascending: false }).limit(limit),
  ).map(toView);
}

export async function getHomeStats() {
  const db = await sb();
  const [{ allAreas }, live] = await Promise.all([
    getReferenceData(),
    fetchAll<Pick<Project, "area_id" | "category" | "segment" | "purpose" | "lister_id">>((from, to) =>
      db.from("projects").select("area_id,category,segment,purpose,lister_id").eq("status", "verified").order("id").range(from, to),
    ),
  ]);
  const zones = new Map<string, { zone: string; count: number; areas: Map<string, number> }>();
  for (const a of allAreas) {
    if (!zones.has(a.zone)) zones.set(a.zone, { zone: a.zone, count: 0, areas: new Map() });
  }
  for (const p of live) {
    const area = allAreas.find((a) => a.id === p.area_id);
    const z = area && zones.get(area.zone);
    if (!area || !z) continue;
    z.count++;
    z.areas.set(area.name, (z.areas.get(area.name) ?? 0) + 1);
  }
  return {
    liveCount: live.length,
    areaCount: allAreas.filter((a) => a.is_active).length,
    listerCount: new Set(live.map((p) => p.lister_id)).size,
    newProjects: live.filter((p) => p.category === "new_project").length,
    readyToMove: live.filter((p) => p.category === "ready_to_move").length,
    resale: live.filter((p) => p.category === "resale").length,
    commercial: live.filter((p) => p.segment === "commercial").length,
    rent: live.filter((p) => p.purpose === "rent").length,
    zones: [...zones.values()].map((z) => ({
      zone: z.zone,
      count: z.count,
      topAreas: [...z.areas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => ({ name, count })),
    })),
  };
}

/** Slugs and dates of every live listing, for the sitemap. */
export async function getLiveProjectSlugs() {
  const db = await sb();
  return fetchAll<Pick<Project, "slug" | "updated_at">>((from, to) =>
    db.from("projects").select("slug,updated_at").eq("status", "verified").order("id").range(from, to),
  );
}

/** Visible to the public when verified; to the lister and staff always. */
export async function getProjectBySlug(slug: string, viewer?: { id: string; role: UserRole } | null) {
  const db = await sb();
  const record = row<ProjectRecord>(await db.from("projects").select(PROJECT_SELECT).eq("slug", slug).maybeSingle());
  if (!record) return null;
  const p = toView(record);
  const isOwner = viewer?.id === p.lister_id;
  const isStaffViewer = !!viewer && (STAFF_ROLES as readonly string[]).includes(viewer.role);
  if (p.status !== "verified" && !isOwner && !isStaffViewer) return null;

  const [similarRes, liveRes] = await Promise.all([
    db
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("status", "verified")
      .neq("id", p.id)
      .or(`area_id.eq.${p.area_id},property_type_id.eq.${p.property_type_id}`)
      .order("created_at", { ascending: false })
      .limit(3),
    db.from("projects").select("id", { count: "exact", head: true }).eq("lister_id", p.lister_id).eq("status", "verified"),
  ]);

  let myEnquiry: Lead | null = null;
  let priorWithLister = 0;
  let saved = false;
  if (viewer) {
    const [mine, prior, save] = await Promise.all([
      db.from("leads").select(LEAD_COLS).eq("project_id", p.id).eq("buyer_id", viewer.id).maybeSingle(),
      db.from("leads").select("id", { count: "exact", head: true }).eq("lister_id", p.lister_id).eq("buyer_id", viewer.id).neq("project_id", p.id),
      db.from("saved_projects").select("project_id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("project_id", p.id),
    ]);
    myEnquiry = row<Lead>(mine);
    priorWithLister = total(prior);
    saved = total(save) > 0;
  }
  return {
    project: p,
    similar: rows<ProjectRecord>(similarRes).map(toView),
    listerLiveCount: total(liveRes),
    myEnquiry,
    priorWithLister,
    isOwner,
    saved,
  };
}

/* ───────────── Lister ───────────── */

export async function getListerProjects(listerId: string) {
  const db = await sb();
  const [projects, leads] = await Promise.all([
    db.from("projects").select(PROJECT_SELECT).eq("lister_id", listerId).order("updated_at", { ascending: false }),
    fetchAll<Pick<Lead, "project_id" | "stage">>((from, to) => db.from("leads").select("project_id,stage").eq("lister_id", listerId).order("id").range(from, to)),
  ]);
  return rows<ProjectRecord>(projects).map((r) => {
    const mine = leads.filter((l) => l.project_id === r.id);
    return { ...toView(r), leadCount: mine.length, openLeads: mine.filter((l) => OPEN_STAGES.includes(l.stage)).length };
  });
}

export async function getOwnProject(listerId: string, projectId: string) {
  const db = await sb();
  const record = row<ProjectRecord>(await db.from("projects").select(PROJECT_SELECT).eq("id", projectId).eq("lister_id", listerId).maybeSingle());
  return record ? toView(record) : null;
}

/** One person per lister: their account when signed in, otherwise their phone number. */
export const buyerKey = (l: Pick<Lead, "buyer_id" | "phone">) => l.buyer_id ?? `tel:${l.phone}`;

export type BuyerGroup = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  leads: LeadRow[]; // latest first
  isRepeat: boolean;
  lastAt: string;
  priority: "high" | "normal";
};

/** Groups leads by buyer per lister — implements the repeat-enquiry rule (§3.4). */
function groupByBuyer(leads: LeadRow[]): BuyerGroup[] {
  const map = new Map<string, BuyerGroup>();
  for (const l of [...leads].sort(newestFirst)) {
    const key = `${l.lister_id}:${buyerKey(l)}`;
    let g = map.get(key);
    if (!g) {
      g = { key, name: l.name, phone: l.phone, email: l.email, leads: [], isRepeat: false, lastAt: l.created_at, priority: "normal" };
      map.set(key, g);
    }
    g.leads.push(l);
  }
  const groups = [...map.values()];
  for (const g of groups) {
    g.isRepeat = g.leads.length >= 2;
    const open = g.leads.some((l) => OPEN_STAGES.includes(l.stage));
    g.priority = g.isRepeat && open ? "high" : "normal";
  }
  return groups.sort((a, b) => (a.priority === b.priority ? b.lastAt.localeCompare(a.lastAt) : a.priority === "high" ? -1 : 1));
}

async function listerLeadRows(listerId: string) {
  const db = await sb();
  return (await fetchAll<LeadRecord>((from, to) => db.from("leads").select(LEAD_SELECT).eq("lister_id", listerId).order("id").range(from, to))).map(toLeadRow);
}

const stageCounts = (leads: { stage: LeadStage }[]) =>
  Object.fromEntries(LEAD_STAGES.map((s) => [s, leads.filter((l) => l.stage === s).length])) as Record<LeadStage, number>;

export async function getListerLeads(listerId: string, f: { project?: string; stage?: string; range?: string } = {}) {
  const db = await sb();
  const [all, projectRes] = await Promise.all([
    listerLeadRows(listerId),
    db.from("projects").select("id,title").eq("lister_id", listerId).order("created_at", { ascending: false }),
  ]);
  let filtered = all;
  if (f.project) filtered = filtered.filter((l) => l.project_id === f.project);
  if (f.stage === "open") filtered = filtered.filter((l) => OPEN_STAGES.includes(l.stage));
  else if (f.stage) filtered = filtered.filter((l) => l.stage === f.stage);
  if (f.range) {
    const days = Number(f.range);
    if (days > 0) filtered = filtered.filter((l) => Date.now() - new Date(l.created_at).getTime() <= days * 86_400_000);
  }
  // Repeat status is about the whole relationship, so compute it on all leads.
  const repeatBuyers = new Set(groupByBuyer(all).filter((g) => g.isRepeat).map((g) => g.key));
  const groups = groupByBuyer(filtered).map((g) => ({ ...g, isRepeat: repeatBuyers.has(g.key) || g.isRepeat }));
  for (const g of groups) if (g.isRepeat && g.leads.some((l) => OPEN_STAGES.includes(l.stage))) g.priority = "high";
  groups.sort((a, b) => (a.priority === b.priority ? b.lastAt.localeCompare(a.lastAt) : a.priority === "high" ? -1 : 1));

  return { groups, projects: rows<Pick<Project, "id" | "title">>(projectRes), counts: stageCounts(all), total: all.length };
}

export type LeadDetail = {
  lead: LeadRow;
  activities: (LeadActivity & { actor: string })[];
  related: LeadRow[];
};

export async function getLeadDetail(leadId: string, viewer: { id: string; role: UserRole }): Promise<LeadDetail | null> {
  const db = await sb();
  const record = row<LeadRecord>(await db.from("leads").select(LEAD_SELECT).eq("id", leadId).maybeSingle());
  if (!record) return null;
  const staff = (STAFF_ROLES as readonly string[]).includes(viewer.role);
  if (!staff && record.lister_id !== viewer.id) return null;
  const l = toLeadRow(record);

  const [acts, related] = await Promise.all([
    db.from("lead_activities").select("id,lead_id,actor_id,type,from_stage,to_stage,note,created_at,actor:profiles(full_name)").eq("lead_id", l.id).order("created_at", { ascending: false }),
    db.from("leads").select(LEAD_SELECT).eq("lister_id", l.lister_id).eq("buyer_key", buyerKey(l)).neq("id", l.id).order("created_at", { ascending: false }),
  ]);
  const activities = rows<LeadActivity & { actor: { full_name: string } | null }>(acts).map((a) => ({
    ...a,
    actor: a.actor_id ? (a.actor?.full_name ?? "Someone") : l.name,
  }));
  return { lead: l, activities, related: rows<LeadRecord>(related).map(toLeadRow) };
}

export async function getListerDashboard(listerId: string) {
  const db = await sb();
  const [projectRes, leads] = await Promise.all([db.from("projects").select(PROJECT_SELECT).eq("lister_id", listerId), listerLeadRows(listerId)]);
  const projects = rows<ProjectRecord>(projectRes).map(toView);
  const upcoming = leads
    .filter((l) => (l.site_visit_at || l.next_followup_at) && OPEN_STAGES.includes(l.stage))
    .map((l) => ({ ...l, when: (l.site_visit_at ?? l.next_followup_at)!, kind: l.site_visit_at ? "Site visit" : "Follow-up" }))
    .sort((a, b) => a.when.localeCompare(b.when))
    .slice(0, 5);
  const groups = groupByBuyer(leads);
  return {
    stats: {
      live: projects.filter((p) => p.status === "verified").length,
      review: projects.filter((p) => p.status === "unverified").length,
      rejected: projects.filter((p) => p.status === "rejected").length,
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.stage === "new").length,
      won: leads.filter((l) => l.stage === "closed_won").length,
      views: projects.reduce((s, p) => s + p.views_count, 0),
      repeatBuyers: groups.filter((g) => g.isRepeat).length,
    },
    recentGroups: groups.slice(0, 5),
    upcoming,
    attention: projects.filter((p) => p.status === "rejected" || p.status === "unverified"),
  };
}

/* ───────────── Signed-in buyer (accounts that enquire while signed in) ───────────── */

export async function getBuyerEnquiries(buyerId: string) {
  const db = await sb();
  const res = await db.from("leads").select(`${LEAD_COLS},project:projects(${PROJECT_SELECT})`).eq("buyer_id", buyerId).order("created_at", { ascending: false });
  return rows<Lead & { project: ProjectRecord }>(res).map(({ project, ...lead }) => ({ lead: lead as Lead, project: toView(project) }));
}

export async function getSavedProjects(userId: string) {
  const db = await sb();
  const res = await db.from("saved_projects").select(`created_at,project:projects(${PROJECT_SELECT})`).eq("user_id", userId).order("created_at", { ascending: false });
  return rows<{ project: ProjectRecord | null }>(res)
    .map((s) => s.project)
    .filter((p): p is ProjectRecord => !!p && p.status === "verified")
    .map(toView);
}

export async function getNotifications(userId: string) {
  const db = await sb();
  return rows<Notification>(await db.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100));
}

export async function getUnreadCount(userId: string) {
  const db = await sb();
  return total(await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null));
}

export async function getProfile(userId: string) {
  const db = await sb();
  return row<PublicProfile>(await db.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle());
}

/* ───────────── Admin ───────────── */

type LeadFacts = Pick<Lead, "stage" | "lister_id" | "project_id" | "buyer_id" | "phone" | "is_repeat" | "created_at">;

async function allLeadFacts() {
  const db = await sb();
  return fetchAll<LeadFacts>((from, to) => db.from("leads").select("stage,lister_id,project_id,buyer_id,phone,is_repeat,created_at").order("id").range(from, to));
}

async function withActors(entries: ActivityLog[]) {
  const db = await sb();
  const ids = [...new Set(entries.map((e) => e.actor_id).filter((id): id is string => !!id))];
  const names = new Map<string, string>();
  if (ids.length) {
    for (const p of rows<Pick<Profile, "id" | "full_name">>(await db.from("profiles").select("id,full_name").in("id", ids))) names.set(p.id, p.full_name);
  }
  return entries.map((e) => ({ ...e, actor: (e.actor_id && names.get(e.actor_id)) || (e.actor_id ? "Deleted account" : "Visitor") }));
}

export async function getAdminOverview() {
  const db = await sb();
  const [leads, projects, listerRes, userCount, recentRes] = await Promise.all([
    allLeadFacts(),
    fetchAll<Pick<Project, "id" | "title" | "slug" | "status" | "lister_id" | "views_count" | "created_at">>((from, to) =>
      db.from("projects").select("id,title,slug,status,lister_id,views_count,created_at").order("id").range(from, to),
    ),
    db.from("profiles").select("id,full_name,company_name,role").in("role", [...LISTER_ROLES]).limit(1000),
    db.from("profiles").select("id", { count: "exact", head: true }).not("role", "in", `(${STAFF_ROLES.join(",")})`),
    db.from("activity_log").select("*").order("id", { ascending: false }).limit(8),
  ]);

  const day = 86_400_000;
  const now = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * day);
    start.setHours(0, 0, 0, 0);
    const end = start.getTime() + day;
    const inDay = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t < end;
    };
    return { date: start.toISOString(), listings: projects.filter((p) => inDay(p.created_at)).length, leads: leads.filter((l) => inDay(l.created_at)).length };
  });
  const counts = stageCounts(leads);
  const funnel = LEAD_STAGES.map((s) => ({ stage: s, count: counts[s] }));
  const listers = rows<Pick<Profile, "id" | "full_name" | "company_name" | "role">>(listerRes)
    .map((p) => {
      const mine = leads.filter((l) => l.lister_id === p.id);
      const won = mine.filter((l) => l.stage === "closed_won").length;
      return {
        id: p.id,
        name: p.company_name ?? p.full_name,
        role: p.role,
        projects: projects.filter((x) => x.lister_id === p.id).length,
        leads: mine.length,
        won,
        conversion: mine.length ? Math.round((won / mine.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);
  const leadsPerProject = projects
    .filter((p) => p.status === "verified")
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, leads: leads.filter((l) => l.project_id === p.id).length, views: p.views_count }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  return {
    stats: {
      queue: projects.filter((p) => p.status === "unverified").length,
      live: projects.filter((p) => p.status === "verified").length,
      users: total(userCount),
      leads: leads.length,
      openLeads: leads.filter((l) => OPEN_STAGES.includes(l.stage)).length,
      repeat: new Set(leads.filter((l) => l.is_repeat).map((l) => `${buyerKey(l)}:${l.lister_id}`)).size,
    },
    days,
    funnel,
    listers,
    leadsPerProject,
    recent: await withActors(rows<ActivityLog>(recentRes)),
  };
}

export async function getVerificationQueue() {
  const db = await sb();
  return rows<ProjectRecord>(
    await db.from("projects").select(PROJECT_SELECT).eq("status", "unverified").order("updated_at", { ascending: true }), // oldest first
  ).map(toView);
}

export async function getProjectForReview(id: string) {
  const db = await sb();
  const record = row<ProjectRecord>(await db.from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle());
  if (!record) return null;
  const [profileRes, reviewRes, leadRes] = await Promise.all([
    db.from("profiles").select(PROFILE_COLS).eq("id", record.lister_id).maybeSingle(),
    db.from("project_reviews").select("id,project_id,reviewer_id,decision,reason,created_at,reviewer:profiles(full_name)").eq("project_id", id).order("created_at", { ascending: false }),
    db.from("leads").select(LEAD_SELECT).eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  const listerProfile = row<PublicProfile>(profileRes);
  if (!listerProfile) return null;
  return {
    project: toView(record),
    listerProfile,
    reviews: rows<ProjectReview & { reviewer: { full_name: string } | null }>(reviewRes).map((r) => ({ ...r, reviewer: r.reviewer?.full_name ?? "Staff" })),
    leads: rows<LeadRecord>(leadRes).map(toLeadRow),
  };
}

export async function getAllProjects(f: { status?: string; q?: string } = {}) {
  const db = await sb();
  let query = db.from("projects").select(PROJECT_SELECT).order("updated_at", { ascending: false }).limit(500);
  if (f.status) query = query.eq("status", f.status);
  const [projectRes, leads] = await Promise.all([query, allLeadFacts()]);
  let items = rows<ProjectRecord>(projectRes).map((r) => ({ ...toView(r), leadCount: leads.filter((l) => l.project_id === r.id).length }));
  if (f.q) {
    const q = f.q.toLowerCase();
    items = items.filter((p) => `${p.title} ${p.code} ${p.lister.full_name} ${p.lister.company_name ?? ""} ${p.area.name}`.toLowerCase().includes(q));
  }
  return items;
}

export async function getAllUsers(f: { role?: string; q?: string } = {}) {
  const db = await sb();
  let query = db.from("profiles").select(PROFILE_COLS).not("role", "in", `(${STAFF_ROLES.join(",")})`).order("created_at", { ascending: false }).limit(1000);
  if (f.role) query = query.eq("role", f.role);
  const [profileRes, projects, leads] = await Promise.all([
    query,
    fetchAll<Pick<Project, "lister_id">>((from, to) => db.from("projects").select("lister_id").order("id").range(from, to)),
    allLeadFacts(),
  ]);
  let items = rows<PublicProfile>(profileRes).map((p) => ({
    ...p,
    projects: projects.filter((x) => x.lister_id === p.id).length,
    enquiries: leads.filter((l) => l.buyer_id === p.id).length,
  }));
  if (f.q) {
    const q = f.q.toLowerCase();
    items = items.filter((p) => `${p.full_name} ${p.phone} ${p.email ?? ""} ${p.company_name ?? ""}`.toLowerCase().includes(q));
  }
  return items;
}

export async function getAllLeadGroups(f: { stage?: string; repeat?: string } = {}) {
  const db = await sb();
  const records = await fetchAll<LeadRecord>((from, to) => {
    let query = db.from("leads").select(LEAD_SELECT);
    if (f.stage === "open") query = query.in("stage", OPEN_STAGES);
    else if (f.stage) query = query.eq("stage", f.stage);
    return query.order("id").range(from, to);
  });
  const grouped = groupByBuyer(records.map(toLeadRow));
  const listerIds = [...new Set(grouped.map((g) => g.leads[0]!.lister_id))];
  const listers = new Map<string, ListerSummary>();
  if (listerIds.length) {
    for (const p of rows<ListerSummary>(await db.from("profiles").select(LISTER_COLS).in("id", listerIds))) listers.set(p.id, p);
  }
  let groups = grouped.map((g) => {
    const id = g.leads[0]!.lister_id;
    return { ...g, lister: listers.get(id) ?? { id, full_name: "Unknown", role: "owner" as UserRole, company_name: null, agent_rera_no: null, created_at: "" } };
  });
  if (f.repeat === "1") groups = groups.filter((g) => g.isRepeat);
  return groups;
}

export async function getStaff() {
  const db = await sb();
  return rows<PublicProfile>(await db.from("profiles").select(PROFILE_COLS).in("role", [...STAFF_ROLES]).order("created_at", { ascending: true }));
}

const ACTIVITY_GROUPS = ["user", "project", "lead", "staff", "area"];

export async function getActivity(f: { role?: string; action?: string; q?: string; range?: string } = {}) {
  const db = await sb();
  const action = f.action && /^[a-z_.]+$/.test(f.action) ? f.action : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the query builder's generic type changes with every call
  const filtered = <Q extends { eq: any; like: any; gte: any }>(query: Q): Q => {
    let q = query;
    if (f.role) q = q.eq("actor_role", f.role);
    if (action) q = q.like("action", `${action}%`);
    const days = Number(f.range);
    if (days > 0) q = q.gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
    return q;
  };
  // A text search looks through the most recent 2,000 matching entries.
  const [countRes, listRes] = await Promise.all([
    filtered(db.from("activity_log").select("id", { count: "exact", head: true })),
    filtered(db.from("activity_log").select("*")).order("id", { ascending: false }).limit(f.q ? 2000 : 200),
  ]);
  let entries = await withActors(rows<ActivityLog>(listRes));
  let count = total(countRes);
  if (f.q) {
    const q = f.q.toLowerCase();
    entries = entries.filter((e) => `${e.actor} ${JSON.stringify(e.metadata)}`.toLowerCase().includes(q));
    count = entries.length;
  }
  return { entries: entries.slice(0, 200), total: count, actions: ACTIVITY_GROUPS };
}

/** The whole audit log, oldest first, for the CSV export. */
export async function getActivityForExport() {
  const db = await sb();
  const entries = await fetchAll<ActivityLog>((from, to) => db.from("activity_log").select("*").order("id").range(from, to), 200_000);
  return withActors(entries);
}
