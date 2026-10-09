import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { LeafSprig } from "@/components/ui/decor";

export default function NotFound() {
  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-4 text-center">
      <LeafSprig className="absolute bottom-0 left-4 h-64 text-brand-green/30" />
      <LeafSprig className="absolute right-4 top-0 h-56 rotate-180 text-brand-gold/40" />
      <div>
        <LogoMark className="mx-auto h-24 w-auto text-brand-green" />
        <p className="eyebrow mt-6 justify-center">Error 404</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          This address <span className="accent-serif text-brand-green">isn&apos;t listed.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">The page may have moved, or the property is no longer available.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/projects" className="btn btn-outline">Browse properties</Link>
        </div>
      </div>
    </main>
  );
}
