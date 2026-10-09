import { z } from "zod";
import {
  CATEGORIES,
  CONFIGURATIONS,
  CONSTRUCTION_STATUSES,
  LEAD_STAGES,
  MAHARERA_REGEX,
  PHONE_REGEX,
  PUBLIC_ROLES,
  PURPOSES,
  SEGMENTS,
} from "./constants";

// Plain-language messages: these are shown directly under the fields.

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))
  .refine((v) => PHONE_REGEX.test(v), "Enter a 10-digit mobile number");

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || z.email().safeParse(v).success, "This email doesn't look right")
  .nullable();

export const signupSchema = z.object({
  role: z.enum(PUBLIC_ROLES, { message: "Choose what describes you best" }),
  full_name: z.string().trim().min(2, "Please enter your name").max(80),
  phone,
  email: optionalEmail,
  password: z.string().min(8, "Use at least 8 characters"),
  company_name: z.string().trim().max(100).optional().transform((v) => v || null),
  agent_rera_no: z.string().trim().max(30).optional().transform((v) => v || null),
  consent: z.literal("on", { message: "Please accept to continue" }),
});

export const loginPasswordSchema = z.object({
  phone,
  password: z.string().min(1, "Enter your password"),
});

export const loginOtpSchema = z.object({
  phone,
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const projectSchema = z
  .object({
    title: z.string().trim().min(5, "Give your property a clear name (at least 5 letters)").max(90),
    segment: z.enum(SEGMENTS, { message: "Choose residential or commercial" }),
    category: z.enum(CATEGORIES, { message: "Choose a category" }),
    construction_status: z.enum(CONSTRUCTION_STATUSES, { message: "Choose the property status" }),
    purpose: z.enum(PURPOSES, { message: "Choose sell or rent" }),
    property_type_id: z.coerce.number({ message: "Choose a property type" }).int().positive("Choose a property type"),
    area_id: z.coerce.number({ message: "Choose an area" }).int().positive("Choose an area"),
    address_line: z.string().trim().min(5, "Add a landmark or street").max(160),
    configuration: z.enum(CONFIGURATIONS as [string, ...string[]], { message: "Choose a size" }),
    carpet_area_sqft: z.coerce.number({ message: "Enter the carpet area" }).positive("Enter the carpet area").max(500_000),
    price: z.coerce.number({ message: "Enter the price" }).positive("Enter the price").max(1_000_00_00_000),
    maharera_no: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .transform((v) => v || null),
    possession_date: z
      .string()
      .optional()
      .transform((v) => v || null),
    description: z.string().trim().min(30, "Describe the property in a few lines (at least 30 letters)").max(3000),
    amenities: z.array(z.string()).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.construction_status === "under_construction") {
      if (!v.maharera_no) {
        ctx.addIssue({ code: "custom", path: ["maharera_no"], message: "MahaRERA number is required for under-construction projects" });
      } else if (!MAHARERA_REGEX.test(v.maharera_no)) {
        ctx.addIssue({ code: "custom", path: ["maharera_no"], message: "It should look like P99000012345 (P99 followed by 9 digits)" });
      }
    } else if (v.maharera_no && !MAHARERA_REGEX.test(v.maharera_no)) {
      ctx.addIssue({ code: "custom", path: ["maharera_no"], message: "It should look like P99000012345 (P99 followed by 9 digits)" });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;

export const enquirySchema = z.object({
  project_id: z.string().min(1),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone,
  message: z.string().trim().max(1000).optional().transform((v) => v || ""),
  consent: z.literal("on", { message: "Please allow us to share your details with the lister" }),
});

export const leadStageSchema = z.object({
  lead_id: z.string().min(1),
  stage: z.enum(LEAD_STAGES),
  note: z.string().trim().max(1000).optional().transform((v) => v || null),
  lost_reason: z.string().trim().max(200).optional().transform((v) => v || null),
  site_visit_at: z.string().optional().transform((v) => v || null),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(80),
  email: optionalEmail,
  company_name: z.string().trim().max(100).optional().transform((v) => v || null),
  agent_rera_no: z.string().trim().max(30).optional().transform((v) => v || null),
});

export const staffSchema = z.object({
  full_name: z.string().trim().min(2, "Enter a name").max(80),
  phone,
  email: optionalEmail,
  role: z.enum(["ops", "admin", "super_admin"]),
  password: z.string().min(8, "Use at least 8 characters"),
});

/** Zod issues → { field: message } (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && k !== "password") out[k] = v;
  return out;
}
