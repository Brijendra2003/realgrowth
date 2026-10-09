import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/layout/page-hero";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms" accent="of use." />
      <Prose>
        <p><em>Template — have this reviewed by your legal advisor before launch.</em></p>
        <h2>Listings</h2>
        <ul>
          <li>You may list only property you own, are authorised to sell or rent, or are developing.</li>
          <li>Under-construction projects must carry a valid MahaRERA registration number.</li>
          <li>Listings are published only after review by our team. We may reject or remove any listing.</li>
          <li>Changing the price, location, MahaRERA number or ownership of a live listing sends it back for review.</li>
        </ul>
        <h2>Enquiries</h2>
        <p>Enquiries are passed directly to the lister. Real Growth is not a party to any transaction between buyers and listers.</p>
        <h2>Fair use</h2>
        <p>Do not post misleading information, spam enquiries, or use the service to collect other people&apos;s data. We may block accounts that do.</p>
        <h2>Service area</h2>
        <p>Real Growth currently serves only the Mira Road to Dahanu Road corridor.</p>
      </Prose>
    </>
  );
}
