import Image from "next/image";
import Link from "next/link";

/**
 * Circular emblem — a house held between two hands, as in the supplied logo.
 * `disc` is the emblem on its own green disc (for light backgrounds);
 * `line` is the white and gold line art only (for green backgrounds).
 */
export function LogoMark({
  className = "h-11 w-auto",
  variant = "line",
  sizes = "96px",
}: {
  className?: string;
  variant?: "disc" | "line";
  sizes?: string;
}) {
  return (
    <Image
      src={variant === "disc" ? "/brand/emblem.png" : "/brand/emblem-line.png"}
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      sizes={sizes}
      className={className}
    />
  );
}

export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const light = tone === "light";
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Real Growth — home">
      <span className="grid h-12 w-12 shrink-0 place-items-center transition-transform duration-500 group-hover:-rotate-6">
        <LogoMark className="h-12 w-auto" variant={light ? "line" : "disc"} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[1.05rem] font-semibold tracking-[0.24em] ${light ? "text-brand-cream" : "text-brand-green"}`}>
            REAL GROWTH
          </span>
          <span className={`mt-1 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.3em] ${light ? "text-white/70" : "text-muted"}`}>
            <span className="h-px w-3 bg-brand-gold" />
            REAL ESTATE AGENT
          </span>
        </span>
      )}
    </Link>
  );
}
