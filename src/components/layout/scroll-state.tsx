"use client";

import { useEffect } from "react";

/** Sets `data-scrolled` on <html> once the page leaves the top, so the header can sit transparently over a hero. */
export function ScrollState() {
  useEffect(() => {
    const el = document.documentElement;
    const update = () => el.toggleAttribute("data-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
