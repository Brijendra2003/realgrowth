import { createHash } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { isLister } from "@/lib/constants";

/**
 * Signed upload parameters for direct browser → Cloudinary uploads (Architecture §12).
 * The API secret never leaves the server. Returns 501 until Cloudinary env vars are set;
 * until then the listing form stores photos locally via /api/media.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user || !isLister(user.role)) return Response.json({ error: "Sign in as a lister to upload photos." }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) return Response.json({ error: "Cloudinary is not configured." }, { status: 501 });

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: `realgrowth/${user.id}`, timestamp, allowed_formats: "jpg,png,webp,pdf" };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  return Response.json({ cloudName, apiKey, signature, ...params });
}
