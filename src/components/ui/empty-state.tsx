import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LeafSprig } from "./decor";

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-paper px-6 py-14 text-center">
      <LeafSprig className="absolute -left-2 bottom-0 h-28 text-brand-green/30" />
      <LeafSprig className="absolute -right-2 top-0 h-24 rotate-180 text-brand-gold/40" />
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-green-50 text-brand-green">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {body && <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
