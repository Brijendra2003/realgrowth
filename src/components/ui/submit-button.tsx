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
  confirm,
  label,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
  /** Asks this question first and only submits on OK. */
  confirm?: string;
  /** Accessible name for an icon-only button. */
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      name={name}
      value={value}
      onClick={(ev) => {
        if (confirm && !window.confirm(confirm)) ev.preventDefault();
      }}
    >
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
