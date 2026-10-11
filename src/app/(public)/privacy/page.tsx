import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/layout/page-hero";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy" accent="policy.">
        How we collect, use and protect your personal data under India&apos;s Digital Personal Data Protection Act, 2023.
      </PageHero>
      <Prose>
        <p><em>Template — have this reviewed by your legal advisor before launch.</em></p>
        <h2>What we collect</h2>
        <ul>
          <li>Account details for listers: name, mobile number, optional email, and your role (owner, developer or broker).</li>
          <li>Listing details and photos you upload.</li>
          <li>Enquiries you send: your name, mobile number and message. You don&apos;t need an account to enquire.</li>
          <li>Basic usage data such as pages viewed, to keep the service secure and improve it.</li>
        </ul>
        <h2>How we use it</h2>
        <p>
          To run your account, verify listings, and pass your enquiry to the lister you chose. When you send an enquiry, your name and phone
          number are shared <strong>only</strong> with that lister and our team.
        </p>
        <h2>Consent</h2>
        <p>We ask for your consent when you sign up and each time you send an enquiry. You can withdraw consent by deleting your account, or, if you enquired without one, by writing to {SITE.email}.</p>
        <h2>Your rights</h2>
        <ul>
          <li>See and correct your data from your Profile page.</li>
          <li>Delete your account at any time from your Profile page. Your listings are withdrawn and your enquiries anonymised.</li>
          <li>Raise a grievance with our Grievance Officer at {SITE.email}.</li>
        </ul>
        <h2>Security</h2>
        <p>Data is stored with access controls so that each person sees only what they are allowed to. Passwords are never stored in plain text.</p>
      </Prose>
    </>
  );
}
