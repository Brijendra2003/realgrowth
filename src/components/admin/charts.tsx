/**
 * Small, dependency-free charts for the admin console.
 * Single-series each (one axis, no legend — the title names the series),
 * brand green on the paper surface, hover tooltip on every bar.
 */

export function DailyBars({ title, total, data }: { title: string; total: number; data: { date: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return (
    <figure className="card p-5">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">
          <strong className="font-display text-lg text-ink">{total}</strong> in 14 days
        </span>
      </figcaption>
      <div className="relative mt-5 h-36">
        {[0.5, 1].map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-line-soft" style={{ bottom: `${t * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-paper pl-1 text-[0.6rem] text-muted">{Math.round(max * t)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px] pr-6">
          {data.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] bg-brand-green transition group-hover:bg-brand-green-700"
                style={{ height: d.value ? `${(d.value / max) * 100}%` : "2px", opacity: d.value ? 1 : 0.25 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[0.7rem] text-white opacity-0 shadow transition group-hover:opacity-100">
                {fmt(d.date)}: <strong>{d.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between pr-6 text-[0.65rem] text-muted">
        <span>{fmt(data[0]!.date)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><th>{fmt(d.date)}</th><td>{d.value}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function HBarList({ title, rows }: { title: string; rows: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="group" title={`${r.label}: ${r.value}`}>
            <div className="flex justify-between text-xs">
              <span className="truncate text-ink-soft">{r.label}</span>
              <span className="font-semibold text-ink">
                {r.value}
                {r.sub && <span className="ml-1 font-normal text-muted">{r.sub}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-brand-green transition group-hover:bg-brand-green-700" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
