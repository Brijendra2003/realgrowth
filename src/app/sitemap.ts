import type { MetadataRoute } from "next";
import { getLiveProjectSlugs } from "@/lib/queries";

const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/projects", "/about", "/contact", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const projects = (await getLiveProjectSlugs()).map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const }));
  return [...statics, ...projects];
}
