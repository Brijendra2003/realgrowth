import type { MetadataRoute } from "next";
import { readDb } from "@/lib/db";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await readDb();
  const statics = ["", "/projects", "/about", "/contact", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const projects = db.projects
    .filter((p) => p.status === "verified")
    .map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const }));
  return [...statics, ...projects];
}
