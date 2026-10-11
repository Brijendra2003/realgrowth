"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader } from "@/components/ui/loader";

export function SubmitButton({
  children,
  pendingText = "Please wait…",
  className = "btn btn-primary",
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? (
        <>
          <Loader />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
