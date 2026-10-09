"use client";

import { useRef, type ReactNode } from "react";

/** GET filter form that re-submits whenever a select changes. */
export function AutoSubmitGet({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={action}
      method="get"
      className={className}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") ref.current?.requestSubmit();
      }}
    >
      {children}
      <noscript>
        <button className="btn btn-outline">Apply</button>
      </noscript>
    </form>
  );
}
