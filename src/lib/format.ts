export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** ₹98 L, ₹1.65 Cr, ₹18,000 */
export function formatPrice(price: number, purpose: "sale" | "rent" = "sale"): string {
  if (purpose === "rent") return `₹${price.toLocaleString("en-IN")}`;
  if (price >= 1_00_00_000) return `₹${trim(price / 1_00_00_000)} Cr`;
  if (price >= 1_00_000) return `₹${trim(price / 1_00_000)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

const trim = (n: number) => (Math.round(n * 100) / 100).toString();

export function formatPricePerSqft(price: number, sqft: number): string | null {
  if (!sqft) return null;
  return `₹${Math.round(price / sqft).toLocaleString("en-IN")}/sq ft`;
}

/** Everything is shown in India time, wherever the server runs. */
const TZ = "Asia/Kolkata";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: TZ });
}

/** "just now", "3 h ago", "2 days ago" — call only at request time. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}••••••${phone.slice(-2)}`;
}

export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  // Shift to IST (UTC+5:30), then read the parts back as if they were UTC.
  return new Date(new Date(iso).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 16);
}
