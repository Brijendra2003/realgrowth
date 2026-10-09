import Image from "next/image";
import { BadgeCheck, PhoneCall, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LeafSprig, Ornament } from "@/components/ui/decor";

export const instant = false;

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-green text-brand-cream lg:flex lg:flex-col">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-green/60 via-brand-green/80 to-brand-green-900" />
        <LeafSprig className="absolute -right-4 top-10 h-72 rotate-12 text-brand-cream/15" />
        <div className="relative flex flex-1 flex-col p-12">
          <Logo tone="light" />
          <div className="mt-auto max-w-md">
            <h2 className="text-4xl font-semibold leading-tight !text-white">
              Real homes. <span className="accent-serif text-brand-cream">Real people.</span> Real growth.
            </h2>
            <Ornament className="mt-5" />
            <ul className="mt-8 space-y-4 text-sm">
              {[
                { i: ShieldCheck, t: "Every listing checked by our team before it goes live" },
                { i: BadgeCheck, t: "MahaRERA numbers verified for new projects" },
                { i: PhoneCall, t: "Enquiries go straight to the lister — no call centre" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4 text-brand-gold" strokeWidth={1.8} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      <main className="flex flex-col bg-canvas">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
