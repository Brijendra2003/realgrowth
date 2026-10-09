import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["italic"], weight: ["400", "500"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Real Growth — Verified homes from Mira Road to Dahanu Road",
    template: "%s · Real Growth",
  },
  description:
    "Buy, rent or list verified flats, villas, shops and offices between Mira Road and Dahanu Road. Every listing is checked by our team; enquiries go straight to the owner, developer or broker.",
  keywords: ["Mira Road flats", "Vasai property", "Virar new projects", "Palghar real estate", "Bhayandar flats", "MahaRERA projects"],
  openGraph: { type: "website", siteName: "Real Growth", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B5D4B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${interTight.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
