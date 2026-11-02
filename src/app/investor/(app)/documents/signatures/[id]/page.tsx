import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { must, supabase } from "@/lib/supabase";
import Card from "@/components/Card";
import SignForm from "@/components/SignForm";
import { agreeAction, signAction } from "./actions";
import { packetName } from "@/lib/personalise";

export const metadata: Metadata = { title: pageTitle("Please Review and Sign") };

// Section structure of the firm's electronic-consent document, in the order specified in CLONE-PROMPT §10.
// DRAFT WORDING (user-approved approach, 2026-11-02): the bodies below are a standard draft so the
// flow is legally coherent end to end; the firm's own approved text replaces them at handover.
const CONSENT_SECTIONS: { title: string; body: string }[] = [
  { title: "Introduction (defines the firm as “we”, “us” and “our”)", body: "This consent explains how we — the firm operating this investor portal — provide records to you electronically and how electronic signatures are used. By selecting Agree, you consent to receive records electronically and to sign documents electronically through this portal, as described below." },
  { title: "Consumer transactions — right to paper copies", body: "For consumer transactions, you have the right to receive records in paper form. You may ask us for a paper copy of any record at any time using the details on the Contact Us page. Asking for a paper copy does not by itself withdraw this consent." },
  { title: "Consent to electronic records and signatures (consumer and business transactions)", body: "Your electronic signature on a document in this portal has the same legal effect as a handwritten signature on paper, and records signed or delivered electronically are the legal equivalent of paper records." },
  { title: "Information that will be provided electronically", body: "Subscription documents, agreements, notices, disclosures, tax forms and other records relating to your investments may be provided through this portal or by email instead of by post." },
  { title: "Right to paper copies", body: "You may obtain a paper copy of any electronic record by contacting us. Where the law allows, a reasonable fee may apply to paper copies." },
  { title: "Updating your contact information", body: "You must keep your email address and contact details current in My Profile so that we can reach you and deliver records. Tell us promptly if your email address changes." },
  { title: "System requirements", body: "To receive and sign records electronically you need a device with a current web browser, an email account, and software that can open PDF files. You can view and download your executed documents from the Documents section at any time." },
  { title: "How to withdraw consent", body: "You may withdraw this consent at any time by written notice to the firm (see Contact Us). Withdrawal takes effect when we confirm receipt. It does not undo signatures or deliveries already completed, and some services may require electronic consent to continue." },
  { title: "Additional consumer-transaction rights: 1. Obtaining Paper Copies · 2. Withdrawing Consent", body: "1. Obtaining Paper Copies — you may request paper copies as described above. 2. Withdrawing Consent — you may withdraw as described above; there is no fee for withdrawing consent itself." },
];
const CONSENT_ACCEPTANCE = [
  "I have read and understood this consent.",
  "I agree to receive records electronically and to sign documents with an electronic signature.",
  "I can open and read PDF documents and the pages of this portal on my device.",
  "My electronic signature will be legally binding in place of a handwritten signature.",
  "I understand that electronic signatures and records replace written documents where this consent applies.",
];

export default async function SignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ signed?: string; error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const u = await requireUser(`/investor/documents/signatures/${id}`);
  const q = must(await supabase().from("signature_requests").select(`
      status, signature_page_id,
      investing_entities!inner ( name ),
      document_instances!inner ( id, client_id, document_templates!inner ( display_name, doc_type ), commitments!inner ( offerings!inner ( name ) ) )`)
    .eq("signature_page_id", Number(id)).eq("document_instances.client_id", u.clientId).maybeSingle()) as any;
  if (!q) notFound(); // another client's page id is indistinguishable from a missing one
  const r = { status: q.status, pageId: q.signature_page_id, inst: q.document_instances.id, entity: q.investing_entities.name,
    dn: q.document_instances.document_templates.display_name, dt: q.document_instances.document_templates.doc_type, offering: q.document_instances.commitments.offerings.name };
  const docName = packetName(r.dn, r.dt, Number(/Fund (\d+)/.exec(r.offering)?.[1]) || null);
  const pageId = Number(id);

  return (
    <div className="max-w-[900px]">
      <h1 className="text-[28px] md:text-[35px] font-bold text-[var(--heading)] mb-6">Please Review and Sign</h1>

      {r.status === "SIGNED" ? (
        <Card>
          <h2 className="text-2xl font-bold">{sp.signed ? "Thank you — your signature was recorded" : "This document has been signed"}</h2>
          <p className="mt-3">{docName}</p>
          <p className="muted text-sm mt-1">Investing Entity: {r.entity}</p>
          <p className="mt-4 flex gap-5"><a href={`/investor/files/instances/${r.inst}`} target="_blank" rel="noreferrer">View executed copy</a><Link href="/investor/documents/signatures">Back to pending signatures</Link></p>
        </Card>
      ) : r.status === "AGREED" ? (
        <Card>
          <h2 className="text-2xl font-bold">Sign Document</h2>
          <p className="mt-3"><a href={`/investor/files/instances/${r.inst}`} target="_blank" rel="noreferrer">{docName}</a></p>
          <p className="muted text-sm mt-1">Investing Entity: {r.entity}</p>
          <SignForm action={signAction.bind(null, pageId)} error={sp.error} />
        </Card>
      ) : (
        <Card>
          <h2 className="text-2xl font-bold">Electronic Communications Consent</h2>
          <div tabIndex={0} aria-label="Electronic Communications Consent document" className="mt-4 h-[340px] overflow-y-auto border hair rounded p-4 text-[13px] leading-7 bg-[var(--card)]" data-testid="consent-frame">
            <p className="text-sm font-bold mb-3" style={{ color: "#b45309" }}>DRAFT WORDING — the text below is a standard draft; the firm’s final approved consent wording will replace it. The section structure follows the firm’s consent document, in order.</p>
            {CONSENT_SECTIONS.map((s) => (<section key={s.title} className="mb-4"><h3 className="font-bold">{s.title}</h3><p className="muted">{s.body}</p></section>))}
            <section className="mb-4"><h3 className="font-bold">Acceptance and Consent</h3>
              <ol className="list-decimal pl-6 muted">{CONSENT_ACCEPTANCE.map((a) => <li key={a}>{a}</li>)}</ol></section>
          </div>
          <p className="mt-4">Investing Entity: {r.entity}</p>
          <form action={agreeAction.bind(null, pageId)} className="mt-4"><button className="btn btn-primary px-8">Agree</button></form>
        </Card>
      )}
    </div>
  );
}
