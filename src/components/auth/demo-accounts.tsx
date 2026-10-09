import { FlaskConical } from "lucide-react";
import { DEMO_PASSWORD } from "@/lib/constants";

const PUBLIC = [
  ["Developer", "9820011111"],
  ["Owner", "9820044444"],
  ["Broker", "9820033333"],
  ["Buyer (repeat enquirer)", "9820055555"],
];
const STAFF = [
  ["Super admin", "9000000001"],
  ["Admin", "9000000002"],
  ["Ops", "9000000003"],
];

/** Development helper — hidden in production unless SHOW_DEMO_ACCOUNTS=1. */
export function DemoAccounts({ staff = false }: { staff?: boolean }) {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DEMO_ACCOUNTS !== "1") return null;
  const rows = staff ? STAFF : PUBLIC;
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-brand-gold/50 bg-brand-gold-50/50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-[#7a5600]">
        <FlaskConical className="h-4 w-4" strokeWidth={1.8} /> Demo accounts
      </p>
      <p className="mt-1 text-xs text-muted">
        Password for all: <code className="rounded bg-paper px-1.5 py-0.5 font-semibold text-ink">{DEMO_PASSWORD}</code> · OTP code: <code className="rounded bg-paper px-1.5 py-0.5 font-semibold text-ink">123456</code>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {rows.map(([r, p]) => (
          <div key={p} className="contents">
            <dt className="text-ink-soft">{r}</dt>
            <dd className="font-mono font-semibold">{p}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
