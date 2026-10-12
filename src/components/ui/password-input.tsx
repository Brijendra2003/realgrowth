"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Password input with a show/hide toggle. */
export function PasswordInput({ className = "input", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} !pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-[0.85rem] text-muted transition-colors hover:text-brand-green"
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
