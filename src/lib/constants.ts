// Domain constants — mirrors the enums in supabase/migrations/0001_init.sql.

export const PUBLIC_ROLES = ["developer", "owner", "broker", "buyer"] as const;
export const LISTER_ROLES = ["developer", "owner", "broker"] as const;
export const STAFF_ROLES = ["ops", "admin", "super_admin"] as const;
export const ALL_ROLES = [...PUBLIC_ROLES, ...STAFF_ROLES] as const;

export type PublicRole = (typeof PUBLIC_ROLES)[number];
export type ListerRole = (typeof LISTER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type UserRole = (typeof ALL_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  developer: "Developer",
  owner: "Owner",
  broker: "Broker",
  buyer: "Buyer",
  ops: "Operations",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const SIGNUP_ROLE_CARDS: { role: PublicRole; title: string; body: string }[] = [
  { role: "developer", title: "I'm a developer", body: "List new projects and towers, and get enquiries straight to your sales team." },
  { role: "owner", title: "I own a property to list", body: "Sell or rent out your flat, shop or plot — no middlemen needed." },
  { role: "broker", title: "I'm a broker / channel partner", body: "List properties for your clients and manage every lead in one place." },
  { role: "buyer", title: "I'm looking to buy or rent", body: "Find verified homes and offices between Mira Road and Dahanu Road." },
];

export const isLister = (role?: UserRole | null): role is ListerRole =>
  !!role && (LISTER_ROLES as readonly string[]).includes(role);
export const isStaff = (role?: UserRole | null): role is StaffRole =>
  !!role && (STAFF_ROLES as readonly string[]).includes(role);

export const SEGMENTS = ["residential", "commercial"] as const;
export type Segment = (typeof SEGMENTS)[number];
export const SEGMENT_LABELS: Record<Segment, string> = { residential: "Residential", commercial: "Commercial" };

export const CATEGORIES = ["new_project", "ready_to_move", "resale"] as const;
export type ListingCategory = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  new_project: "New project (under construction)",
  ready_to_move: "Ready to move",
  resale: "Resale",
};
export const CATEGORY_SHORT: Record<ListingCategory, string> = {
  new_project: "New project",
  ready_to_move: "Ready to move",
  resale: "Resale",
};

export const CONSTRUCTION_STATUSES = ["under_construction", "ready", "resale"] as const;
export type ConstructionStatus = (typeof CONSTRUCTION_STATUSES)[number];
export const CONSTRUCTION_LABELS: Record<ConstructionStatus, string> = {
  under_construction: "Under construction",
  ready: "Ready",
  resale: "Resale",
};

export const PURPOSES = ["sale", "rent"] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_LABELS: Record<Purpose, string> = { sale: "For sale", rent: "For rent" };

export const PROJECT_STATUSES = ["unverified", "verified", "rejected", "sold", "withdrawn"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  unverified: "Under review",
  verified: "Live",
  rejected: "Needs changes",
  sold: "Sold",
  withdrawn: "Withdrawn",
};

export const LEAD_STAGES = [
  "new",
  "contacted",
  "site_visit_scheduled",
  "site_visit_done",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit_scheduled: "Site visit scheduled",
  site_visit_done: "Site visit done",
  negotiation: "Negotiation",
  closed_won: "Closed (Won)",
  closed_lost: "Lost",
};
export const OPEN_STAGES: LeadStage[] = ["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation"];

export const LOST_REASONS = [
  "Budget did not match",
  "Bought elsewhere",
  "Not reachable",
  "Location not suitable",
  "Just exploring",
  "Other",
];

/** Service corridor: Mira Road → Dahanu Road. No free-text locations. */
export const AREA_ZONES: { zone: string; areas: string[] }[] = [
  {
    zone: "Mira Road & Bhayandar",
    areas: [
      "Mira Road East", "Mira Road West", "Kashimira", "Shanti Park", "Beverly Park", "Silver Park",
      "Sheetal Nagar", "Bhayandar East", "Bhayandar West", "Navghar", "Uttan", "Dongri",
    ],
  },
  {
    zone: "Vasai & Virar",
    areas: [
      "Naigaon East", "Naigaon West", "Juchandra", "Vasai Road East", "Vasai Road West", "Vasai Gaon",
      "Papdy", "Nalasopara East", "Nalasopara West", "Achole", "Virar East", "Virar West", "Bolinj",
      "Agashi", "Arnala",
    ],
  },
  {
    zone: "Palghar & Dahanu",
    areas: [
      "Vaitarna", "Saphale", "Kelve Road", "Palghar East", "Palghar West", "Umroli", "Boisar East",
      "Boisar West", "Tarapur MIDC", "Vangaon", "Chinchani", "Dahanu Road",
    ],
  },
];

export const PROPERTY_TYPES: { segment: Segment; name: string; slug: string }[] = [
  { segment: "residential", name: "Flat / Apartment", slug: "flat" },
  { segment: "residential", name: "Independent House / Villa", slug: "villa" },
  { segment: "residential", name: "Row House", slug: "row-house" },
  { segment: "residential", name: "Residential Plot", slug: "residential-plot" },
  { segment: "residential", name: "Studio Apartment", slug: "studio" },
  { segment: "commercial", name: "Office Space", slug: "office" },
  { segment: "commercial", name: "Shop / Showroom", slug: "shop" },
  { segment: "commercial", name: "Warehouse / Godown", slug: "warehouse" },
  { segment: "commercial", name: "Industrial Shed", slug: "industrial-shed" },
  { segment: "commercial", name: "Commercial Plot", slug: "commercial-plot" },
];

export const CONFIGURATIONS = ["1 RK", "1 BHK", "1.5 BHK", "2 BHK", "2.5 BHK", "3 BHK", "4 BHK", "4+ BHK", "Not applicable"];

export const BUDGETS_SALE: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "u30l", label: "Under ₹30 Lakh", max: 30_00_000 },
  { value: "30-50l", label: "₹30 – 50 Lakh", min: 30_00_000, max: 50_00_000 },
  { value: "50-75l", label: "₹50 – 75 Lakh", min: 50_00_000, max: 75_00_000 },
  { value: "75l-1cr", label: "₹75 Lakh – 1 Crore", min: 75_00_000, max: 1_00_00_000 },
  { value: "1-2cr", label: "₹1 – 2 Crore", min: 1_00_00_000, max: 2_00_00_000 },
  { value: "2cr+", label: "Above ₹2 Crore", min: 2_00_00_000 },
];
export const BUDGETS_RENT: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "r-u10k", label: "Rent under ₹10,000", max: 10_000 },
  { value: "r-10-20k", label: "Rent ₹10,000 – 20,000", min: 10_000, max: 20_000 },
  { value: "r-20-40k", label: "Rent ₹20,000 – 40,000", min: 20_000, max: 40_000 },
  { value: "r-40k+", label: "Rent above ₹40,000", min: 40_000 },
];
export const ALL_BUDGETS = [...BUDGETS_SALE, ...BUDGETS_RENT];

export const AMENITIES = [
  "Lift", "Covered parking", "24×7 security", "Power backup", "Gym", "Swimming pool", "Club house",
  "Children's play area", "Garden", "Jogging track", "CCTV", "Intercom", "Rainwater harvesting",
  "Gas pipeline", "Near station", "Near school", "Near hospital", "Sea view",
];

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export const MAHARERA_REGEX = /^P99\d{9}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const MAX_PHOTOS = 15;
export const DEMO_OTP = "123456";
export const DEMO_PASSWORD = "demo1234";

export const SITE = {
  name: "Real Growth",
  tagline: "Real Estate Agent",
  corridor: "Mira Road → Dahanu Road",
  phone: "+91 98200 00000",
  whatsapp: "919820000000",
  email: "hello@realgrowth.in",
  address: "Shop 4, Shanti Shopping Centre, Mira Road East, Thane 401107",
};
