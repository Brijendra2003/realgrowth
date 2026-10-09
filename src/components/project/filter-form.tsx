"use client";

import { useRef, type ReactNode } from "react";

/** GET form that applies filters as soon as a dropdown or radio changes. */
export function AutoSubmitForm({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action="/projects"
      method="get"
      className={className}
      onChange={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "SELECT" || (t as HTMLInputElement).type === "radio") ref.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
