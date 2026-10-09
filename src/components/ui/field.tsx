import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const style =
    tone === "success"
      ? "border-brand-green/20 bg-brand-green-50 text-brand-green"
      : tone === "info"
        ? "border-brand-gold/30 bg-brand-gold-50 text-[#7a5600]"
        : "border-danger/20 bg-[#fdecea] text-danger";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${style}`}>
      {children}
    </div>
  );
}
