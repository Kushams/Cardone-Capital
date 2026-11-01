import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Card from "@/components/Card";
import { agreeAction, signAction } from "./actions";
import { packetName } from "@/lib/personalise";

export const metadata: Metadata = { title: pageTitle("Please Review and Sign") };

// Section structure of the firm's electronic-consent document, in the order specified in CLONE-PROMPT §10.
// The firm's actual legal wording was NOT supplied in the kit and must not be invented: bodies are placeholders to be replaced with the firm's own text asset.
const CONSENT_SECTIONS = [
  "Introduction (defines the firm as “we”, “us” and “our”)", "Consumer transactions — right to paper copies", "Consent to electronic records and signatures (consumer and business transactions)",
  "Information that will be provided electronically", "Right to paper copies", "Updating your contact information", "System requirements", "How to withdraw consent",
  "Additional consumer-transaction rights: 1. Obtaining Paper Copies · 2. Withdrawing Consent",
];

export default async function SignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ signed?: string; error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const u = await requireUser(`/investor/documents/signatures/${id}`);
  const r = db().prepare(`SELECT sr.status, sr.signature_page_id pageId, di.id inst, e.name entity, t.display_name dn, t.doc_type dt, o.name offering
    FROM signature_requests sr JOIN document_instances di ON di.id = sr.document_instance_id JOIN investing_entities e ON e.id = sr.investing_entity_id
    JOIN document_templates t ON t.id = di.template_id JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id
    WHERE sr.signature_page_id = ? AND di.client_id = ?`).get(Number(id), u.clientId) as any;
  if (!r) notFound(); // another client's page id is indistinguishable from a missing one
  const docName = packetName(r.dn, r.dt, Number(/Fund (\d+)/.exec(r.offering)?.[1]) || null);
  const pageId = Number(id);

  return (
    <div className="max-w-[900px]">
      <h1 className="text-[32px] md:text-[40px] font-bold text-[var(--heading)] mb-6">Please Review and Sign</h1>

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
          <div role="note" className="mt-4 p-3 rounded border-l-4 text-sm" style={{ borderLeftColor: "#fcc43e", background: "rgba(252,196,62,.12)" }}>
            <b>STUB — signature capture is not connected.</b> The original portal’s signature canvas/fields were not observed; this step records a typed name only, and the stored copy is clearly marked as a demo signature.
          </div>
          <form action={signAction.bind(null, pageId)} className="mt-5 space-y-4">
            <p className="text-sm">By signing your name below, you declare that all details listed on the Summary page are true and complete.</p>
            <label className="block"><span className="label">Type your full name to sign</span><input name="signature" required minLength={2} autoComplete="off" className="input max-w-[420px]" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" name="confirm" required /> I confirm the details are true and complete.</label>
            {sp.error && <p role="alert" className="text-danger text-sm">Please type your name and confirm to sign.</p>}
            <button className="btn btn-primary px-8">Sign</button>
          </form>
        </Card>
      ) : (
        <Card>
          <h2 className="text-2xl font-bold">Electronic Communications Consent</h2>
          <div tabIndex={0} aria-label="Electronic Communications Consent document" className="mt-4 h-[340px] overflow-y-auto border hair rounded p-4 text-[15px] leading-7 bg-[var(--card)]" data-testid="consent-frame">
            <p className="text-sm font-bold mb-3" style={{ color: "#b45309" }}>PLACEHOLDER — the firm’s own electronic-records-and-signatures consent text was not included in the kit. Insert it here (do not invent legal wording). Section structure below follows the original, in order.</p>
            {CONSENT_SECTIONS.map((s, i) => (<section key={s} className="mb-4"><h3 className="font-bold">{s}</h3><p className="muted">[Firm text for section {i + 1} goes here.]</p></section>))}
            <section className="mb-4"><h3 className="font-bold">Acceptance and Consent</h3>
              <ol className="list-decimal pl-6 muted">{[1, 2, 3, 4, 5].map((n) => <li key={n}>[Firm acknowledgement {n} goes here{n === 5 ? " — incl. that electronic signatures/records replace written documents" : ""}.]</li>)}</ol></section>
            <p className="text-xs muted border-t hair pt-2">This site is protected by reCAPTCHA. (Placeholder — reCAPTCHA is not connected.)</p>
          </div>
          <p className="mt-4">Investing Entity: {r.entity}</p>
          <form action={agreeAction.bind(null, pageId)} className="mt-4"><button className="btn btn-primary px-8">Agree</button></form>
        </Card>
      )}
    </div>
  );
}
