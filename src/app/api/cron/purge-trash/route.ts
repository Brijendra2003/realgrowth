import { purgeTrashedProjects } from "@/lib/trash";

/** Daily (vercel.json): deletes listings that have been in the trash for 30 days. Vercel sends CRON_SECRET as a bearer token. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Forbidden", { status: 403 });
  const purged = await purgeTrashedProjects();
  return Response.json({ purged }, { headers: { "Cache-Control": "no-store" } });
}
