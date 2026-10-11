import { getSessionUser } from "@/lib/auth";
import { signedUploadParams } from "@/lib/cloudinary";
import { isLister } from "@/lib/constants";
import { limited } from "@/lib/rate-limit";

/**
 * Signed upload parameters for direct browser → Cloudinary uploads (Architecture §12).
 * The API secret never leaves the server.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user || !isLister(user.role)) return Response.json({ error: "Sign in as a lister to upload photos." }, { status: 401 });
  if (await limited(`upload:${user.id}`, 150, 60 * 60 * 1000)) {
    return Response.json({ error: "You've uploaded a lot of photos in a short time. Please try again later." }, { status: 429 });
  }
  const signed = signedUploadParams(user.id);
  if (!signed) return Response.json({ error: "Photo uploads are not set up yet. Please contact support." }, { status: 503 });
  return Response.json(signed);
}
