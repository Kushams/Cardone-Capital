import type { Metadata } from "next";
import { FIRM, pageTitle } from "@/lib/nav";
import PageTitle from "@/components/PageTitle";

export const metadata: Metadata = { title: pageTitle("Contact Us") };

export default function ContactUs() {
  return (
    <div className="max-w-[560px]">
      <PageTitle>Contact Us</PageTitle>
      {/* No form, message field or submit button — by design (matches the original). */}
      <section className="card p-6 space-y-2">
        <p className="font-bold text-lg">Cardone Capital</p>
        <p><a href={`tel:${FIRM.phone.replace(/\s/g, "")}`}>{FIRM.phone}</a></p>
        <p><a href={`tel:${FIRM.phone2.replace(/\s/g, "")}`}>{FIRM.phone2}</a></p>
        <p><a href={`mailto:${FIRM.email}`}>{FIRM.email}</a></p>
        <p><a href={FIRM.site} target="_blank" rel="noreferrer">{FIRM.site}</a></p>
        <hr className="hair border-t my-4" />
        <p className="font-bold">Mailing Address:</p>
        <p>{FIRM.addr1}<br />{FIRM.addr2}</p>
      </section>
    </div>
  );
}
