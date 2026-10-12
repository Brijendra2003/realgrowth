import "server-only";
import { createHash } from "node:crypto";

/**
 * Listing photos and videos go straight from the browser to Cloudinary with a signature
 * from /api/cloudinary/sign; the API secret never leaves the server.
 * Reads CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
 * or all three from CLOUDINARY_URL (cloudinary://key:secret@cloud).
 */

type Config = { cloudName: string; apiKey: string; apiSecret: string };

export function cloudinaryConfig(): Config | null {
  const fromUrl = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(process.env.CLOUDINARY_URL?.trim() ?? "");
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? fromUrl?.[3];
  const apiKey = process.env.CLOUDINARY_API_KEY ?? fromUrl?.[1];
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? fromUrl?.[2];
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

function sign(params: Record<string, string | number>, secret: string) {
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

/** Each lister uploads into their own folder, which is what lets us trust a submitted photo. */
export const uploadFolder = (userId: string) => `realgrowth/${userId}`;

export type UploadKind = "image" | "video";

/** Signed parameters for one direct upload. Photos are capped at 2400px on the long side; videos are stored as sent. */
export function signedUploadParams(userId: string, kind: UploadKind = "image") {
  const cfg = cloudinaryConfig();
  if (!cfg) return null;
  const params: Record<string, string | number> =
    kind === "video"
      ? { allowed_formats: "mp4,mov,webm", folder: uploadFolder(userId), timestamp: Math.floor(Date.now() / 1000) }
      : {
          allowed_formats: "jpg,png,webp",
          folder: uploadFolder(userId),
          timestamp: Math.floor(Date.now() / 1000),
          transformation: "c_limit,h_2400,w_2400",
        };
  return { cloudName: cfg.cloudName, apiKey: cfg.apiKey, signature: sign(params, cfg.apiSecret), params, kind };
}

/** True when a photo or video the browser reports really is in this lister's folder on our Cloudinary account. */
export function isOwnUpload(userId: string, publicId: string, url: string, kind: UploadKind = "image"): boolean {
  const cfg = cloudinaryConfig();
  if (!cfg) return false;
  return (
    /^[\w/-]+$/.test(publicId) &&
    publicId.startsWith(`${uploadFolder(userId)}/`) &&
    url.startsWith(`https://res.cloudinary.com/${cfg.cloudName}/${kind}/upload/`) &&
    url.includes(`/${publicId}.`)
  );
}

/** Best-effort delete of photos and videos that are no longer used. */
export async function destroyMedia(items: { cloudinary_public_id: string | null; kind?: string | null }[]) {
  const cfg = cloudinaryConfig();
  if (!cfg) return;
  await Promise.all(
    items.map(async ({ cloudinary_public_id: public_id, kind }) => {
      if (!public_id) return;
      const timestamp = Math.floor(Date.now() / 1000);
      const body = new URLSearchParams({ public_id, timestamp: String(timestamp), api_key: cfg.apiKey, signature: sign({ public_id, timestamp }, cfg.apiSecret) });
      try {
        await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/${kind === "video" ? "video" : "image"}/destroy`, { method: "POST", body, cache: "no-store" });
      } catch (err) {
        console.error(`[cloudinary] could not delete ${public_id}`, err);
      }
    }),
  );
}
