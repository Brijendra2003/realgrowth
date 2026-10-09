"use client";

import { useEffect } from "react";
import { trackViewAction } from "@/actions/projects";

export function ViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    const key = `rg-viewed-${projectId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void trackViewAction(projectId);
  }, [projectId]);
  return null;
}
