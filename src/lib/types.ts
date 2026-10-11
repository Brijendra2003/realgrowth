import type {
  ConstructionStatus,
  LeadStage,
  ListingCategory,
  ProjectStatus,
  Purpose,
  Segment,
  UserRole,
} from "./constants";

// Row shapes mirror the Supabase tables in supabase/migrations/0001_init.sql.

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  agent_rera_no: string | null;
  password_hash: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type Area = { id: number; zone: string; name: string; is_active: boolean };

export type PropertyType = { id: number; segment: Segment; name: string; slug: string };

export type ProjectMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | "brochure";
  sort_order: number;
  cloudinary_public_id?: string | null;
};

export type Project = {
  id: string;
  code: string;
  lister_id: string;
  title: string;
  slug: string;
  description: string;
  segment: Segment;
  category: ListingCategory;
  construction_status: ConstructionStatus;
  purpose: Purpose;
  property_type_id: number;
  area_id: number;
  address_line: string;
  configuration: string;
  carpet_area_sqft: number;
  price: number;
  maharera_no: string | null;
  possession_date: string | null;
  amenities: string[];
  media: ProjectMedia[];
  status: ProjectStatus;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  project_id: string;
  lister_id: string;
  buyer_id: string | null; // null when the enquiry came from a visitor without an account
  name: string;
  phone: string;
  email: string | null;
  message: string;
  stage: LeadStage;
  lost_reason: string | null;
  site_visit_at: string | null;
  next_followup_at: string | null;
  is_repeat: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  type: "created" | "stage_change" | "note" | "call" | "site_visit" | "followup";
  from_stage: LeadStage | null;
  to_stage: LeadStage | null;
  note: string | null;
  created_at: string;
};

export type ProjectReview = {
  id: string;
  project_id: string;
  reviewer_id: string | null;
  decision: "verified" | "rejected";
  reason: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: number;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null; // uuid, or an area id
  metadata: Record<string, unknown>;
  created_at: string;
};

/** What the client is allowed to see about the signed-in user. */
export type SessionUser = Pick<Profile, "id" | "role" | "full_name" | "phone" | "email" | "company_name" | "agent_rera_no">;

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};
