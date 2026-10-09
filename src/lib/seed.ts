import "server-only";
import {
  AREA_ZONES,
  DEMO_PASSWORD,
  PROPERTY_TYPES,
  type ConstructionStatus,
  type LeadStage,
  type ListingCategory,
  type ProjectStatus,
  type Purpose,
  type Segment,
  type UserRole,
} from "./constants";
import { hashPassword } from "./password";
import { slugify } from "./format";
import type { Database, Lead, LeadActivity, Profile, Project } from "./types";

/** Demo data so every screen has something real to show on first run. */
export function buildSeed(): Database {
  const now = Date.now();
  const ago = (days: number, hours = 0) => new Date(now - (days * 24 + hours) * 3_600_000).toISOString();
  const ahead = (days: number, hour = 11) => {
    const d = new Date(now + days * 86_400_000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const pw = hashPassword(DEMO_PASSWORD);

  const areas = AREA_ZONES.flatMap((z) => z.areas.map((name) => ({ zone: z.zone, name }))).map((a, i) => ({
    id: i + 1,
    zone: a.zone,
    name: a.name,
    is_active: true,
  }));
  const areaId = (name: string) => areas.find((a) => a.name === name)!.id;
  const property_types = PROPERTY_TYPES.map((t, i) => ({ id: i + 1, ...t }));
  const typeId = (slug: string) => property_types.find((t) => t.slug === slug)!.id;

  const user = (
    id: string,
    role: UserRole,
    full_name: string,
    phone: string,
    extra: Partial<Profile> = {},
    created = 60,
  ): Profile => ({
    id,
    role,
    full_name,
    phone,
    email: `${full_name.split(" ")[0].toLowerCase()}@example.com`,
    company_name: null,
    agent_rera_no: null,
    password_hash: pw,
    is_blocked: false,
    created_at: ago(created),
    updated_at: ago(created),
    ...extra,
  });

  const profiles: Profile[] = [
    user("u-super", "super_admin", "Kavita Rao", "9000000001", { email: "superadmin@realgrowth.in" }, 120),
    user("u-admin", "admin", "Rahul Desai", "9000000002", { email: "admin@realgrowth.in" }, 110),
    user("u-ops", "ops", "Sneha Kulkarni", "9000000003", { email: "ops@realgrowth.in" }, 100),
    user("u-dev1", "developer", "Rohan Mehta", "9820011111", { company_name: "Skyline Developers", email: "rohan@skylinedev.in" }, 90),
    user("u-dev2", "developer", "Anita Pereira", "9820022222", { company_name: "Vasai Greens Realty", email: "anita@vasaigreens.in" }, 80),
    user("u-broker", "broker", "Imran Shaikh", "9820033333", { company_name: "Corridor Realty", agent_rera_no: "A51800012345" }, 75),
    user("u-owner", "owner", "Sunita Patil", "9820044444", {}, 45),
    user("u-buyer1", "buyer", "Priya Sharma", "9820055555", {}, 30),
    user("u-buyer2", "buyer", "Amit Verma", "9820066666", {}, 25),
    user("u-buyer3", "buyer", "Neha Joshi", "9820077777", {}, 20),
  ];

  const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
  const EXT = {
    tower: "1545324418-cc1a3fa10c00",
    blocks: "1460317442991-0ec209397118",
    office: "1486406146926-c627a92ad1ab",
    villa: "1512917774080-9991f1c4c750",
    house1: "1564013799919-ab600027ffc6",
    house2: "1568605114967-8130f3a36994",
    modern: "1580587771525-78b9dba3b914",
    villa2: "1613490493576-7fde63acd811",
    house3: "1600596542815-ffad4c1539a9",
    house4: "1600585154340-be6161a56a0c",
    house5: "1449844908441-8829872d2607",
    house6: "1430285561322-7808604715df",
    house7: "1582407947304-fd86f028f716",
    house8: "1605276374104-dee2a0ed3cd6",
    house9: "1558036117-15d82a90b9b1",
    land: "1416331108676-a22ccb276e35",
    house10: "1599809275671-b5942cabc7a2",
    house11: "1600047509807-ba8f99d2cdde",
  };
  const INT = [
    "1560448204-e02f11c3d0e2", "1502672260266-1c1ef2d93688", "1522708323590-d24dbb6b0267",
    "1493809842364-78817add7ffb", "1600607687939-ce8a6c25118c", "1600566753190-17f0baa2a6c3",
    "1484154218962-a197022b5858", "1554995207-c18c203602cb", "1567496898669-ee935f5f647a",
    "1574362848149-11496d93a7c7",
  ];
  const OFFICE_INT = ["1497366216548-37526070297c", "1497366811353-6870744d04b2"];

  type Seed = {
    title: string;
    lister: string;
    segment: Segment;
    category: ListingCategory;
    cs: ConstructionStatus;
    purpose: Purpose;
    type: string;
    area: string;
    config: string;
    sqft: number;
    price: number;
    rera?: string;
    possession?: string;
    amenities: string[];
    status?: ProjectStatus;
    reason?: string;
    days: number;
    photos: string[];
    views?: number;
    description: string;
    address: string;
  };

  const seeds: Seed[] = [
    {
      title: "Skyline Aurora", lister: "u-dev1", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "flat", area: "Mira Road East", config: "2 BHK", sqft: 680, price: 98_00_000,
      rera: "P99000051234", possession: "2028-06-30", days: 2, views: 412,
      amenities: ["Lift", "Covered parking", "24×7 security", "Gym", "Swimming pool", "Club house", "Near station"],
      photos: [EXT.tower, INT[0], INT[1], INT[2]],
      address: "Off Poonam Sagar Road, near Hatkesh Udyog Nagar",
      description: "A 32-storey tower seven minutes from Mira Road station. Every 2 BHK has a deck balcony facing the mangroves, vitrified flooring, and a modular kitchen platform. The podium has a lap pool, a gym and a kids' play zone.",
    },
    {
      title: "Skyline Horizon Towers", lister: "u-dev1", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "flat", area: "Bhayandar West", config: "3 BHK", sqft: 1050, price: 1_65_00_000,
      rera: "P99000052345", possession: "2027-12-31", days: 5, views: 288,
      amenities: ["Lift", "Covered parking", "24×7 security", "Club house", "Garden", "Sea view", "Power backup"],
      photos: [EXT.blocks, INT[3], INT[4], INT[5]],
      address: "Maxus Mall Road, Bhayandar West",
      description: "Twin towers with sea-facing 3 BHK homes, a rooftop garden and a double-height entrance lobby. Ten minutes' walk to Bhayandar station and the upcoming Metro Line 9.",
    },
    {
      title: "Skyline Business Bay", lister: "u-dev1", segment: "commercial", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "office", area: "Kashimira", config: "Not applicable", sqft: 540, price: 82_00_000,
      rera: "P99000053456", possession: "2027-09-30", days: 9, views: 164,
      amenities: ["Lift", "Covered parking", "Power backup", "CCTV", "24×7 security"],
      photos: [EXT.office, OFFICE_INT[0], OFFICE_INT[1]],
      address: "Western Express Highway, Kashimira junction",
      description: "Grade-A office floors right on the highway with full power backup, two high-speed lifts per wing and visitor parking. Ideal for clinics, CA firms and small IT teams.",
    },
    {
      title: "Skyline Aurora Studios", lister: "u-dev1", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "studio", area: "Mira Road East", config: "1 RK", sqft: 340, price: 36_00_000,
      rera: "P99000054567", possession: "2028-06-30", days: 14, views: 97,
      amenities: ["Lift", "24×7 security", "Gym", "Near station"],
      photos: [INT[6], EXT.tower, INT[7]],
      address: "Poonam Sagar Road, Mira Road East",
      description: "Smart studio homes in the Aurora complex — perfect first home or rental investment. Shares the full amenity podium with the main tower.",
    },
    {
      title: "Vasai Greens Phase II", lister: "u-dev2", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "flat", area: "Vasai Road West", config: "1 BHK", sqft: 420, price: 42_00_000,
      rera: "P99000061111", possession: "2027-03-31", days: 3, views: 356,
      amenities: ["Lift", "Garden", "Children's play area", "Jogging track", "Rainwater harvesting", "Near school"],
      photos: [EXT.house3, INT[8], INT[9]],
      address: "Ambadi Road, Vasai West",
      description: "Phase II of the popular Vasai Greens township: 1 BHK homes around a two-acre central garden with a jogging track and a play area. Walking distance to schools and the Ambadi Road market.",
    },
    {
      title: "Greens Riverside Villas", lister: "u-dev2", segment: "residential", category: "ready_to_move", cs: "ready",
      purpose: "sale", type: "villa", area: "Vasai Gaon", config: "4 BHK", sqft: 2100, price: 2_40_00_000, days: 11, views: 203,
      amenities: ["Covered parking", "Garden", "24×7 security", "CCTV", "Power backup", "Gas pipeline"],
      photos: [EXT.villa, EXT.villa2, INT[4], INT[5]],
      address: "Near Vasai Fort Road, Vasai Gaon",
      description: "Eight independent villas on the river bank with private gardens, two-car parking and a terrace sit-out. Occupation certificate received; ready for immediate possession.",
    },
    {
      title: "Virar Sunrise Residency", lister: "u-dev2", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "flat", area: "Virar West", config: "2 BHK", sqft: 610, price: 52_00_000,
      rera: "P99000062222", possession: "2028-01-31", days: 1, views: 141,
      amenities: ["Lift", "Gym", "Children's play area", "Power backup", "Intercom"],
      photos: [EXT.modern, INT[0], INT[3]],
      address: "Bolinj Road, Virar West",
      description: "Bright, east-facing 2 BHK homes with cross ventilation and no wasted passage space. Bus stop at the gate and Virar station 12 minutes away.",
    },
    {
      title: "Seaview 2 BHK near Palghar Station", lister: "u-broker", segment: "residential", category: "resale", cs: "resale",
      purpose: "sale", type: "flat", area: "Palghar West", config: "2 BHK", sqft: 650, price: 38_00_000, days: 6, views: 88,
      amenities: ["Lift", "Covered parking", "Near station", "Near hospital"],
      photos: [EXT.house4, INT[1], INT[2]],
      address: "Mahim Road, Palghar West",
      description: "Well-kept 7-year-old 2 BHK on the 5th floor with a partial sea view. Society has a lift, parking and its own borewell. Clear title, loan available.",
    },
    {
      title: "Corner Shop opposite Nalasopara Station", lister: "u-broker", segment: "commercial", category: "ready_to_move", cs: "ready",
      purpose: "sale", type: "shop", area: "Nalasopara East", config: "Not applicable", sqft: 280, price: 55_00_000, days: 4, views: 176,
      amenities: ["Near station", "CCTV", "Power backup"],
      photos: [EXT.house7, OFFICE_INT[1]],
      address: "Station Road, Nalasopara East",
      description: "High-footfall ground-floor corner shop with a 22 ft frontage directly opposite the station exit. Suits a pharmacy, mobile store or café.",
    },
    {
      title: "Furnished 1 BHK for Rent, Mira Road West", lister: "u-broker", segment: "residential", category: "ready_to_move", cs: "ready",
      purpose: "rent", type: "flat", area: "Mira Road West", config: "1 BHK", sqft: 450, price: 18_000, days: 2, views: 233,
      amenities: ["Lift", "24×7 security", "Gas pipeline", "Near station"],
      photos: [INT[7], INT[8], INT[9]],
      address: "Near Royal College, Mira Road West",
      description: "Fully furnished 1 BHK with a wardrobe, bed, sofa, fridge and washing machine. Family preferred. Two months' deposit.",
    },
    {
      title: "Warehouse for Lease, Tarapur MIDC", lister: "u-broker", segment: "commercial", category: "ready_to_move", cs: "ready",
      purpose: "rent", type: "warehouse", area: "Tarapur MIDC", config: "Not applicable", sqft: 6000, price: 1_20_000, days: 8, views: 59,
      amenities: ["Power backup", "CCTV", "24×7 security"],
      photos: [EXT.land, EXT.house5],
      address: "Plot W-42, Tarapur MIDC",
      description: "6,000 sq ft warehouse with a 28 ft clear height, a loading dock for two trucks and 50 kVA power. Five minutes from Boisar–Tarapur Road.",
    },
    {
      title: "Spacious 2 BHK in Beverly Park", lister: "u-owner", segment: "residential", category: "resale", cs: "resale",
      purpose: "sale", type: "flat", area: "Beverly Park", config: "2 BHK", sqft: 760, price: 1_05_00_000, days: 7, views: 191,
      amenities: ["Lift", "Covered parking", "Garden", "Near school", "Near hospital"],
      photos: [EXT.house8, INT[5], INT[6]],
      address: "Beverly Park, Mira Road East",
      description: "Owner-sold 2 BHK in a quiet, green society. Recently renovated kitchen and bathrooms, one covered parking space. No brokerage.",
    },
    {
      title: "Row House near Agashi Beach", lister: "u-owner", segment: "residential", category: "resale", cs: "resale",
      purpose: "sale", type: "row-house", area: "Agashi", config: "3 BHK", sqft: 1300, price: 85_00_000, days: 12, views: 122,
      amenities: ["Garden", "Covered parking", "Rainwater harvesting"],
      photos: [EXT.house1, EXT.house2, INT[2]],
      address: "Agashi Village Road, Virar West",
      description: "Two-storey row house with a front garden and a mango tree, a five-minute walk from the beach. Good for a weekend home or a large family.",
    },
    {
      title: "Office Space for Rent, Vasai Road East", lister: "u-broker", segment: "commercial", category: "ready_to_move", cs: "ready",
      purpose: "rent", type: "office", area: "Vasai Road East", config: "Not applicable", sqft: 900, price: 45_000, days: 10, views: 74,
      amenities: ["Lift", "Power backup", "CCTV", "Near station"],
      photos: [OFFICE_INT[0], EXT.office],
      address: "Evershine City, Vasai East",
      description: "Ready-to-use office with 14 workstations, a cabin, a conference room and a pantry. Lift and power backup in the building.",
    },
    {
      title: "Orchard Plots, Dahanu Road", lister: "u-dev2", segment: "residential", category: "ready_to_move", cs: "ready",
      purpose: "sale", type: "residential-plot", area: "Dahanu Road", config: "Not applicable", sqft: 2400, price: 24_00_000, days: 15, views: 66,
      amenities: ["Garden", "24×7 security", "Rainwater harvesting"],
      photos: [EXT.land, EXT.house6],
      address: "Dahanu–Gholwad Road",
      description: "NA-approved bungalow plots inside a gated chikoo orchard layout with internal roads, a boundary wall and electricity at every plot.",
    },
    {
      title: "Ready 1 BHK, Boisar West", lister: "u-dev2", segment: "residential", category: "ready_to_move", cs: "ready",
      purpose: "sale", type: "flat", area: "Boisar West", config: "1 BHK", sqft: 480, price: 28_00_000, days: 18, views: 81,
      amenities: ["Lift", "Children's play area", "Near station"],
      photos: [EXT.house9, INT[0]],
      address: "Navapur Road, Boisar West",
      description: "Affordable ready 1 BHK, ideal for MIDC professionals. OC received, home loans from major banks.",
    },
    // Not public yet — they show up in the verification queue.
    {
      title: "Skyline Cove", lister: "u-dev1", segment: "residential", category: "new_project", cs: "under_construction",
      purpose: "sale", type: "flat", area: "Uttan", config: "2 BHK", sqft: 720, price: 1_10_00_000, rera: "P99000055678",
      possession: "2029-03-31", days: 0, status: "unverified",
      amenities: ["Lift", "Sea view", "Club house", "Swimming pool"],
      photos: [EXT.house10, INT[1]],
      address: "Uttan Road, near Gorai",
      description: "Low-rise sea-facing homes near Uttan beach with a clubhouse and an infinity pool.",
    },
    {
      title: "1 BHK for Rent, Naigaon East", lister: "u-owner", segment: "residential", category: "ready_to_move", cs: "ready",
      purpose: "rent", type: "flat", area: "Naigaon East", config: "1 BHK", sqft: 430, price: 11_000, days: 1, status: "unverified",
      amenities: ["Lift", "Near station"],
      photos: [INT[3]],
      address: "Juchandra Road, Naigaon East",
      description: "Semi-furnished 1 BHK, five minutes from Naigaon station.",
    },
    {
      title: "Farm Plot, Saphale", lister: "u-broker", segment: "residential", category: "resale", cs: "resale",
      purpose: "sale", type: "residential-plot", area: "Saphale", config: "Not applicable", sqft: 5000, price: 18_00_000, days: 4,
      status: "rejected", reason: "Photos do not match the address. Please upload clear photos of the plot and the 7/12 extract number.",
      amenities: [],
      photos: [EXT.house11],
      address: "Saphale East",
      description: "Farm plot with road access.",
    },
    {
      title: "2 BHK, Bhayandar East", lister: "u-owner", segment: "residential", category: "resale", cs: "resale",
      purpose: "sale", type: "flat", area: "Bhayandar East", config: "2 BHK", sqft: 640, price: 78_00_000, days: 40, status: "sold",
      amenities: ["Lift"], photos: [INT[4]], address: "Navghar Road, Bhayandar East",
      description: "Sold through Real Growth.",
    },
  ];

  const projects: Project[] = seeds.map((s, i) => {
    const code = `RG-2026-${String(101 + i).padStart(6, "0")}`;
    const status = s.status ?? "verified";
    return {
      id: `p-${i + 1}`,
      code,
      lister_id: s.lister,
      title: s.title,
      slug: `${slugify(s.title)}-${101 + i}`,
      description: s.description,
      segment: s.segment,
      category: s.category,
      construction_status: s.cs,
      purpose: s.purpose,
      property_type_id: typeId(s.type),
      area_id: areaId(s.area),
      address_line: s.address,
      configuration: s.config,
      carpet_area_sqft: s.sqft,
      price: s.price,
      maharera_no: s.rera ?? null,
      possession_date: s.possession ?? null,
      amenities: s.amenities,
      media: s.photos.map((p, j) => ({ id: `m-${i}-${j}`, url: img(p), kind: "image", sort_order: j })),
      status,
      rejection_reason: s.reason ?? null,
      verified_by: status === "verified" || status === "sold" ? "u-ops" : null,
      verified_at: status === "verified" || status === "sold" ? ago(s.days, -3) : null,
      views_count: s.views ?? 0,
      created_at: ago(s.days, 5),
      updated_at: ago(s.days),
    };
  });

  const pid = (title: string) => projects.find((p) => p.title === title)!;
  const buyers = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const leads: Lead[] = [];
  const lead_activities: LeadActivity[] = [];
  let actN = 0;

  function addLead(
    buyerId: string,
    projectTitle: string,
    daysAgo: number,
    message: string,
    path: { stage: LeadStage; note?: string; daysAgo: number }[] = [],
    extra: Partial<Lead> = {},
  ) {
    const p = pid(projectTitle);
    const b = buyers[buyerId];
    const id = `l-${leads.length + 1}`;
    const last = path.at(-1);
    leads.push({
      id,
      project_id: p.id,
      lister_id: p.lister_id,
      buyer_id: buyerId,
      name: b.full_name,
      phone: b.phone,
      email: b.email,
      message,
      stage: last?.stage ?? "new",
      lost_reason: null,
      site_visit_at: null,
      next_followup_at: null,
      is_repeat: false,
      created_at: ago(daysAgo),
      updated_at: ago(last?.daysAgo ?? daysAgo),
      ...extra,
    });
    lead_activities.push({
      id: `a-${++actN}`, lead_id: id, actor_id: buyerId, type: "created",
      from_stage: null, to_stage: "new", note: message, created_at: ago(daysAgo),
    });
    let prev: LeadStage = "new";
    for (const step of path) {
      lead_activities.push({
        id: `a-${++actN}`, lead_id: id, actor_id: p.lister_id, type: "stage_change",
        from_stage: prev, to_stage: step.stage, note: step.note ?? null, created_at: ago(step.daysAgo),
      });
      prev = step.stage;
    }
  }

  addLead("u-buyer1", "Skyline Aurora", 2, "Is there a 2 BHK on a higher floor with a mangrove view? Looking to buy within 3 months.", [
    { stage: "contacted", note: "Spoke on phone. Prefers 15th floor and above. Budget up to ₹1 Cr.", daysAgo: 1 },
  ], { next_followup_at: ahead(1) });
  addLead("u-buyer1", "Skyline Horizon Towers", 1, "Please share the floor plan and the payment schedule for 3 BHK.");
  addLead("u-buyer1", "Skyline Business Bay", 0, "Also interested in a small office for my clinic. What is the carpet area of the smallest unit?");
  addLead("u-buyer2", "Skyline Aurora", 4, "Want to visit this weekend with family.", [
    { stage: "contacted", note: "Called. Family of four, first home.", daysAgo: 3 },
    { stage: "site_visit_scheduled", note: "Visit booked for Saturday 11 am.", daysAgo: 3 },
  ], { site_visit_at: ahead(2) });
  addLead("u-buyer2", "Greens Riverside Villas", 9, "Is the price negotiable for immediate payment?", [
    { stage: "contacted", daysAgo: 8 },
    { stage: "site_visit_scheduled", daysAgo: 7 },
    { stage: "site_visit_done", note: "Liked villa 3. Wife wants to see villa 6 also.", daysAgo: 5 },
    { stage: "negotiation", note: "Offered ₹2.25 Cr. Discussing with the partners.", daysAgo: 2 },
  ], { next_followup_at: ahead(0, 17) });
  addLead("u-buyer3", "Virar Sunrise Residency", 0, "What is the all-inclusive price including stamp duty and registration?");
  addLead("u-buyer3", "Seaview 2 BHK near Palghar Station", 5, "Is the society OC available?", [
    { stage: "contacted", note: "Shared OC copy on WhatsApp.", daysAgo: 4 },
  ]);
  addLead("u-buyer3", "Furnished 1 BHK for Rent, Mira Road West", 2, "Can I move in from the 1st of next month?", [
    { stage: "contacted", daysAgo: 2 },
    { stage: "site_visit_done", daysAgo: 1 },
    { stage: "closed_won", note: "Agreement signed. Token received.", daysAgo: 0 },
  ]);
  addLead("u-buyer1", "Vasai Greens Phase II", 3, "Is a home loan available from SBI?", [
    { stage: "contacted", daysAgo: 2 },
  ]);
  addLead("u-buyer2", "Vasai Greens Phase II", 12, "Looking for a ground floor unit.", [
    { stage: "contacted", daysAgo: 11 },
    { stage: "closed_lost", note: "No ground-floor units left.", daysAgo: 10 },
  ], { lost_reason: "Location not suitable" });

  // Repeat-enquiry rule: 2+ projects from the same lister by the same buyer.
  for (const l of leads) {
    l.is_repeat = leads.filter((o) => o.buyer_id === l.buyer_id && o.lister_id === l.lister_id).length >= 2;
  }

  const notifications = leads.slice(0, 6).map((l, i) => ({
    id: `n-${i + 1}`,
    user_id: l.lister_id,
    title: l.is_repeat ? "Repeat enquirer" : "New enquiry",
    body: `${l.name} enquired about ${projects.find((p) => p.id === l.project_id)!.title}.`,
    link: `/leads/${l.id}`,
    read_at: i > 2 ? ago(0) : null,
    created_at: l.created_at,
  }));

  let logN = 0;
  const activity_log: Database["activity_log"] = [];
  const log = (actor: string, action: string, entity_type: string, entity_id: string | null, at: string, metadata: Record<string, unknown> = {}) => {
    const actorProfile = profiles.find((p) => p.id === actor);
    activity_log.push({ id: ++logN, actor_id: actor, actor_role: actorProfile?.role ?? null, action, entity_type, entity_id, metadata, created_at: at });
  };
  for (const p of profiles) log(p.id, "user.signup", "profile", p.id, p.created_at, { name: p.full_name });
  for (const p of projects) {
    log(p.lister_id, "project.created", "project", p.id, p.created_at, { title: p.title });
    if (p.verified_at) log("u-ops", "project.verified", "project", p.id, p.verified_at, { title: p.title });
    if (p.status === "rejected") log("u-admin", "project.rejected", "project", p.id, p.updated_at, { title: p.title, reason: p.rejection_reason });
  }
  for (const l of leads) {
    log(l.buyer_id, "lead.created", "lead", l.id, l.created_at, { project: projects.find((p) => p.id === l.project_id)!.title, repeat: l.is_repeat });
  }
  for (const a of lead_activities.filter((a) => a.type === "stage_change")) {
    log(a.actor_id, "lead.stage_changed", "lead", a.lead_id, a.created_at, { from: a.from_stage, to: a.to_stage });
  }
  activity_log.sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach((e, i) => (e.id = i + 1));

  const project_reviews = projects
    .filter((p) => p.verified_at || p.status === "rejected")
    .map((p, i) => ({
      id: `r-${i + 1}`,
      project_id: p.id,
      reviewer_id: p.status === "rejected" ? "u-admin" : "u-ops",
      decision: (p.status === "rejected" ? "rejected" : "verified") as "verified" | "rejected",
      reason: p.rejection_reason,
      created_at: p.verified_at ?? p.updated_at,
    }));

  return {
    profiles,
    areas,
    property_types,
    projects,
    leads,
    lead_activities,
    project_reviews,
    notifications,
    activity_log,
    saved: [{ user_id: "u-buyer1", project_id: "p-6", created_at: ago(1) }],
  };
}
