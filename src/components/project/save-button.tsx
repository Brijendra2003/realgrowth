"use client";

import { Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleSaveAction } from "@/actions/projects";

export function SaveButton({ projectId, saved, variant = "icon" }: { projectId: string; saved: boolean; variant?: "icon" | "button" }) {
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  const action = (fd: FormData) => {
    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleSaveAction(fd);
    });
  };

  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="back" value={pathname} />
      {variant === "icon" ? (
        <button
          type="submit"
          aria-label={optimistic ? "Remove from saved" : "Save property"}
          aria-pressed={optimistic}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart className={`h-[18px] w-[18px] ${optimistic ? "fill-clay text-clay" : ""}`} strokeWidth={1.8} />
        </button>
      ) : (
        <button type="submit" aria-pressed={optimistic} className="btn btn-outline w-full">
          <Heart className={`h-4 w-4 ${optimistic ? "fill-clay text-clay" : ""}`} strokeWidth={1.8} />
          {optimistic ? "Saved" : "Save"}
        </button>
      )}
    </form>
  );
}
