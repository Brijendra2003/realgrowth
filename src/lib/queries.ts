import "server-only";
import { ALL_BUDGETS, OPEN_STAGES, type LeadStage, type UserRole } from "./constants";
import { readDb } from "./db";
import { slugify } from "./format";
import type { Area, Database, Lead, LeadActivity, Profile, Project, PropertyType } from "./types";

export type ListerSummary = Pick<Profile, "id" | "full_name" | "role" | "company_name" | "agent_rera_no" | "created_at">;

export type ProjectView = Project & {
  area: Area;
  type: PropertyType;
  lister: ListerSummary;
  cover: string | null;
};

function lister(db: Database, id: string): ListerSummary {
  const p = db.profiles.find((x) => x.id === id);
  return p
    ? { id: p.id, full_name: p.full_name, role: p.role, company_name: p.company_name, agent_rera_no: p.agent_rera_no, created_at: p.created_at }
    : { id, full_name: "Unknown", role: "owner", company_name: null, agent_rera_no: null, created_at: "" };
}

export function hydrate(db: Database, p: Project): ProjectView {
  return {
    ...p,
    area: db.areas.find((a) => a.id === p.area_id)!,
    type: db.property_types.find((t) => t.id === p.property_type_id)!,
    lister: lister(db, p.lister_id),
    cover: [...p.media].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  };
}

function withoutPassword(p: Profile): Omit<Profile, "password_hash"> {
  const copy: Partial<Profile> = { ...p };
  delete copy.password_hash;
  return copy as Omit<Profile, "password_hash">;
}

const newestFirst = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);

/* ───────────── Reference data ───────────── */

export async function getReferenceData() {
  const db = await readDb();
  return {
    areas: db.areas.filter((a) => a.is_active),
    allAreas: db.areas,
    propertyTypes: db.property_types,
  };
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

export async function searchProjects(f: SearchFilters) {
  const db = await readDb();
  let items = db.projects.filter((p) => p.status === "verified").map((p) => hydrate(db, p));

  if (f.segment === "residential" || f.segment === "commercial") items = items.filter((p) => p.segment === f.segment);
  if (f.category) items = items.filter((p) => p.category === f.category);
  if (f.purpose === "sale" || f.purpose === "rent") items = items.filter((p) => p.purpose === f.purpose);
  if (f.area) items = items.filter((p) => slugify(p.area.name) === f.area);
  if (f.zone) items = items.filter((p) => slugify(p.area.zone) === f.zone);
  if (f.type) items = items.filter((p) => p.type.slug === f.type);
  if (f.config) items = items.filter((p) => p.configuration === f.config);
  const budget = ALL_BUDGETS.find((b) => b.value === f.budget);
  if (budget) {
    const isRent = budget.value.startsWith("r-");
    items = items.filter(
      (p) =>
        (isRent ? p.purpose === "rent" : p.purpose === "sale") &&
        (budget.min === undefined || p.price >= budget.min) &&
        (budget.max === undefined || p.price <= budget.max),
    );
  }
  if (f.q?.trim()) {
    const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const hay = `${p.title} ${p.description} ${p.area.name} ${p.area.zone} ${p.type.name} ${p.configuration} ${p.lister.company_name ?? ""} ${p.code}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  if (f.sort === "price_asc") items.sort((a, b) => a.price - b.price);
  else if (f.sort === "price_desc") items.sort((a, b) => b.price - a.price);
  else items.sort(newestFirst);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(f.page) || 1));
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pages };
}

export async function getNewestProjects(limit = 6) {
  const db = await readDb();
  return db.projects
    .filter((p) => p.status === "verified")
    .sort(newestFirst)
    .slice(0, limit)
    .map((p) => hydrate(db, p));
}

export async function getHomeStats() {
  const db = await readDb();
  const live = db.projects.filter((p) => p.status === "verified");
  const zones = new Map<string, { zone: string; count: number; areas: Map<string, number> }>();
  for (const a of db.areas) {
    if (!zones.has(a.zone)) zones.set(a.zone, { zone: a.zone, count: 0, areas: new Map() });
  }
  for (const p of live) {
    const area = db.areas.find((a) => a.id === p.area_id)!;
    const z = zones.get(area.zone)!;
    z.count++;
    z.areas.set(area.name, (z.areas.get(area.name) ?? 0) + 1);
  }
  return {
    liveCount: live.length,
    areaCount: db.areas.filter((a) => a.is_active).length,
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

/** Visible to the public when verified; to the lister and staff always. */
export async function getProjectBySlug(slug: string, viewer?: { id: string; role: UserRole } | null) {
  const db = await readDb();
  const p = db.projects.find((x) => x.slug === slug);
  if (!p) return null;
  const isOwner = viewer?.id === p.lister_id;
  const isStaffViewer = !!viewer && ["ops", "admin", "super_admin"].includes(viewer.role);
  if (p.status !== "verified" && !isOwner && !isStaffViewer) return null;

  const project = hydrate(db, p);
  const similar = db.projects
    .filter((x) => x.id !== p.id && x.status === "verified" && (x.area_id === p.area_id || x.property_type_id === p.property_type_id))
    .sort(newestFirst)
    .slice(0, 3)
    .map((x) => hydrate(db, x));
  const listerLiveCount = db.projects.filter((x) => x.lister_id === p.lister_id && x.status === "verified").length;

  let myEnquiry: Lead | null = null;
  let priorWithLister = 0;
  let saved = false;
  if (viewer) {
    myEnquiry = db.leads.find((l) => l.project_id === p.id && l.buyer_id === viewer.id) ?? null;
    priorWithLister = db.leads.filter((l) => l.lister_id === p.lister_id && l.buyer_id === viewer.id && l.project_id !== p.id).length;
    saved = db.saved.some((s) => s.user_id === viewer.id && s.project_id === p.id);
  }
  return { project, similar, listerLiveCount, myEnquiry, priorWithLister, isOwner, saved };
}

/* ───────────── Lister ───────────── */

export async function getListerProjects(listerId: string) {
  const db = await readDb();
  return db.projects
    .filter((p) => p.lister_id === listerId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((p) => {
      const leads = db.leads.filter((l) => l.project_id === p.id);
      return { ...hydrate(db, p), leadCount: leads.length, openLeads: leads.filter((l) => OPEN_STAGES.includes(l.stage)).length };
    });
}

export async function getOwnProject(listerId: string, projectId: string) {
  const db = await readDb();
  const p = db.projects.find((x) => x.id === projectId && x.lister_id === listerId);
  return p ? hydrate(db, p) : null;
}

export type LeadRow = Lead & { project: Pick<Project, "id" | "title" | "slug" | "code" | "price" | "purpose"> & { area: string; cover: string | null } };

function leadRow(db: Database, l: Lead): LeadRow {
  const p = db.projects.find((x) => x.id === l.project_id)!;
  const h = hydrate(db, p);
  return { ...l, project: { id: p.id, title: p.title, slug: p.slug, code: p.code, price: p.price, purpose: p.purpose, area: h.area.name, cover: h.cover } };
}

export type BuyerGroup = {
  buyer_id: string;
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
    const key = `${l.lister_id}:${l.buyer_id}`;
    let g = map.get(key);
    if (!g) {
      g = { buyer_id: l.buyer_id, name: l.name, phone: l.phone, email: l.email, leads: [], isRepeat: false, lastAt: l.created_at, priority: "normal" };
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

export async function getListerLeads(listerId: string, f: { project?: string; stage?: string; range?: string } = {}) {
  const db = await readDb();
  const all = db.leads.filter((l) => l.lister_id === listerId);
  let rows = all.map((l) => leadRow(db, l));
  if (f.project) rows = rows.filter((l) => l.project_id === f.project);
  if (f.stage === "open") rows = rows.filter((l) => OPEN_STAGES.includes(l.stage));
  else if (f.stage) rows = rows.filter((l) => l.stage === f.stage);
  if (f.range) {
    const days = Number(f.range);
    if (days > 0) rows = rows.filter((l) => Date.now() - new Date(l.created_at).getTime() <= days * 86_400_000);
  }
  // Repeat status is about the whole relationship, so compute it on all leads.
  const repeatBuyers = new Set(groupByBuyer(all.map((l) => leadRow(db, l))).filter((g) => g.isRepeat).map((g) => g.buyer_id));
  const groups = groupByBuyer(rows).map((g) => ({ ...g, isRepeat: repeatBuyers.has(g.buyer_id) || g.isRepeat }));
  for (const g of groups) if (g.isRepeat && g.leads.some((l) => OPEN_STAGES.includes(l.stage))) g.priority = "high";
  groups.sort((a, b) => (a.priority === b.priority ? b.lastAt.localeCompare(a.lastAt) : a.priority === "high" ? -1 : 1));

  const projects = db.projects.filter((p) => p.lister_id === listerId).map((p) => ({ id: p.id, title: p.title }));
  const counts = Object.fromEntries(
    (["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation", "closed_won", "closed_lost"] as LeadStage[]).map((s) => [
      s,
      all.filter((l) => l.stage === s).length,
    ]),
  ) as Record<LeadStage, number>;
  return { groups, projects, counts, total: all.length };
}

export type LeadDetail = {
  lead: LeadRow;
  activities: (LeadActivity & { actor: string })[];
  related: LeadRow[];
};

export async function getLeadDetail(leadId: string, viewer: { id: string; role: UserRole }): Promise<LeadDetail | null> {
  const db = await readDb();
  const l = db.leads.find((x) => x.id === leadId);
  if (!l) return null;
  const staff = ["ops", "admin", "super_admin"].includes(viewer.role);
  if (!staff && l.lister_id !== viewer.id) return null;
  const activities = db.lead_activities
    .filter((a) => a.lead_id === l.id)
    .sort(newestFirst)
    .map((a) => ({ ...a, actor: db.profiles.find((p) => p.id === a.actor_id)?.full_name ?? "Someone" }));
  const related = db.leads
    .filter((x) => x.id !== l.id && x.buyer_id === l.buyer_id && x.lister_id === l.lister_id)
    .sort(newestFirst)
    .map((x) => leadRow(db, x));
  return { lead: leadRow(db, l), activities, related };
}

export async function getListerDashboard(listerId: string) {
  const db = await readDb();
  const projects = db.projects.filter((p) => p.lister_id === listerId);
  const leads = db.leads.filter((l) => l.lister_id === listerId);
  const upcoming = leads
    .filter((l) => (l.site_visit_at || l.next_followup_at) && OPEN_STAGES.includes(l.stage))
    .map((l) => ({ ...leadRow(db, l), when: (l.site_visit_at ?? l.next_followup_at)!, kind: l.site_visit_at ? "Site visit" : "Follow-up" }))
    .sort((a, b) => a.when.localeCompare(b.when))
    .slice(0, 5);
  const groups = groupByBuyer(leads.map((l) => leadRow(db, l)));
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
    attention: projects.filter((p) => p.status === "rejected" || p.status === "unverified").map((p) => hydrate(db, p)),
  };
}

/* ───────────── Buyer ───────────── */

export async function getBuyerEnquiries(buyerId: string) {
  const db = await readDb();
  return db.leads
    .filter((l) => l.buyer_id === buyerId)
    .sort(newestFirst)
    .map((l) => {
      const p = hydrate(db, db.projects.find((x) => x.id === l.project_id)!);
      return { lead: l, project: p };
    });
}

export async function getSavedProjects(userId: string) {
  const db = await readDb();
  return db.saved
    .filter((s) => s.user_id === userId)
    .sort(newestFirst)
    .map((s) => db.projects.find((p) => p.id === s.project_id))
    .filter((p): p is Project => !!p && p.status === "verified")
    .map((p) => hydrate(db, p));
}

export async function getNotifications(userId: string) {
  const db = await readDb();
  return db.notifications.filter((n) => n.user_id === userId).sort(newestFirst);
}

export async function getUnreadCount(userId: string) {
  const db = await readDb();
  return db.notifications.filter((n) => n.user_id === userId && !n.read_at).length;
}

export async function getProfile(userId: string) {
  const db = await readDb();
  return db.profiles.find((p) => p.id === userId) ?? null;
}

/* ───────────── Admin ───────────── */

export async function getAdminOverview() {
  const db = await readDb();
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
    return {
      date: start.toISOString(),
      listings: db.projects.filter((p) => inDay(p.created_at)).length,
      leads: db.leads.filter((l) => inDay(l.created_at)).length,
    };
  });
  const funnel = (["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation", "closed_won", "closed_lost"] as LeadStage[]).map(
    (s) => ({ stage: s, count: db.leads.filter((l) => l.stage === s).length }),
  );
  const listers = db.profiles
    .filter((p) => ["developer", "owner", "broker"].includes(p.role))
    .map((p) => {
      const leads = db.leads.filter((l) => l.lister_id === p.id);
      const won = leads.filter((l) => l.stage === "closed_won").length;
      return {
        id: p.id,
        name: p.company_name ?? p.full_name,
        role: p.role,
        projects: db.projects.filter((x) => x.lister_id === p.id).length,
        leads: leads.length,
        won,
        conversion: leads.length ? Math.round((won / leads.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);
  const leadsPerProject = db.projects
    .filter((p) => p.status === "verified")
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, leads: db.leads.filter((l) => l.project_id === p.id).length, views: p.views_count }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  return {
    stats: {
      queue: db.projects.filter((p) => p.status === "unverified").length,
      live: db.projects.filter((p) => p.status === "verified").length,
      users: db.profiles.filter((p) => !["ops", "admin", "super_admin"].includes(p.role)).length,
      leads: db.leads.length,
      openLeads: db.leads.filter((l) => OPEN_STAGES.includes(l.stage)).length,
      repeat: new Set(db.leads.filter((l) => l.is_repeat).map((l) => `${l.buyer_id}:${l.lister_id}`)).size,
    },
    days,
    funnel,
    listers,
    leadsPerProject,
    recent: await decorateActivity(db, [...db.activity_log].sort((a, b) => b.id - a.id).slice(0, 8)),
  };
}

export async function getVerificationQueue() {
  const db = await readDb();
  return db.projects
    .filter((p) => p.status === "unverified")
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at)) // oldest first
    .map((p) => hydrate(db, p));
}

export async function getProjectForReview(id: string) {
  const db = await readDb();
  const p = db.projects.find((x) => x.id === id);
  if (!p) return null;
  const listerProfile = db.profiles.find((x) => x.id === p.lister_id)!;
  const reviews = db.project_reviews
    .filter((r) => r.project_id === id)
    .sort(newestFirst)
    .map((r) => ({ ...r, reviewer: db.profiles.find((x) => x.id === r.reviewer_id)?.full_name ?? "Staff" }));
  return {
    project: hydrate(db, p),
    listerProfile: withoutPassword(listerProfile),
    reviews,
    leads: db.leads.filter((l) => l.project_id === id).map((l) => leadRow(db, l)),
  };
}

export async function getAllProjects(f: { status?: string; q?: string } = {}) {
  const db = await readDb();
  let items = db.projects.map((p) => ({ ...hydrate(db, p), leadCount: db.leads.filter((l) => l.project_id === p.id).length }));
  if (f.status) items = items.filter((p) => p.status === f.status);
  if (f.q) {
    const q = f.q.toLowerCase();
    items = items.filter((p) => `${p.title} ${p.code} ${p.lister.full_name} ${p.lister.company_name ?? ""} ${p.area.name}`.toLowerCase().includes(q));
  }
  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getAllUsers(f: { role?: string; q?: string } = {}) {
  const db = await readDb();
  let items = db.profiles
    .filter((p) => !["ops", "admin", "super_admin"].includes(p.role))
    .map(withoutPassword)
    .map((p) => ({
      ...p,
      projects: db.projects.filter((x) => x.lister_id === p.id).length,
      enquiries: db.leads.filter((l) => l.buyer_id === p.id).length,
    }));
  if (f.role) items = items.filter((p) => p.role === f.role);
  if (f.q) {
    const q = f.q.toLowerCase();
    items = items.filter((p) => `${p.full_name} ${p.phone} ${p.email ?? ""} ${p.company_name ?? ""}`.toLowerCase().includes(q));
  }
  return items.sort(newestFirst);
}

export async function getAllLeadGroups(f: { stage?: string; repeat?: string } = {}) {
  const db = await readDb();
  let rows = db.leads.map((l) => leadRow(db, l));
  if (f.stage === "open") rows = rows.filter((l) => OPEN_STAGES.includes(l.stage));
  else if (f.stage) rows = rows.filter((l) => l.stage === f.stage);
  let groups = groupByBuyer(rows).map((g) => ({ ...g, lister: lister(db, g.leads[0]!.lister_id) }));
  if (f.repeat === "1") groups = groups.filter((g) => g.isRepeat);
  return groups;
}

export async function getStaff() {
  const db = await readDb();
  return db.profiles
    .filter((p) => ["ops", "admin", "super_admin"].includes(p.role))
    .map(withoutPassword)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function decorateActivity(db: Database, entries: Database["activity_log"]) {
  return entries.map((e) => ({ ...e, actor: db.profiles.find((p) => p.id === e.actor_id)?.full_name ?? "System" }));
}

export async function getActivity(f: { role?: string; action?: string; q?: string; range?: string } = {}) {
  const db = await readDb();
  let entries = [...db.activity_log].sort((a, b) => b.id - a.id);
  if (f.role) entries = entries.filter((e) => e.actor_role === f.role);
  if (f.action) entries = entries.filter((e) => e.action.startsWith(f.action!));
  if (f.range) {
    const days = Number(f.range);
    if (days > 0) entries = entries.filter((e) => Date.now() - new Date(e.created_at).getTime() <= days * 86_400_000);
  }
  let decorated = await decorateActivity(db, entries);
  if (f.q) {
    const q = f.q.toLowerCase();
    decorated = decorated.filter((e) => `${e.actor} ${JSON.stringify(e.metadata)}`.toLowerCase().includes(q));
  }
  return { entries: decorated.slice(0, 200), total: decorated.length, actions: [...new Set(db.activity_log.map((e) => e.action.split(".")[0]!))] };
}
