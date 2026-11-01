import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { getClient, getCommitments, getOffering, getPendingSignatures } from "@/lib/queries";
import { findTemplateByDisplay, templateHref } from "@/lib/docs";
import { fmtUSD } from "@/lib/catalog";
import Card from "@/components/Card";
import Photo from "@/components/Photo";
import Disclosure from "@/components/Disclosure";
import BackToTop from "@/components/BackToTop";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const o = getOffering("new", Number((await params).id));
  return { title: pageTitle(o?.name ?? "Offering") };
}

const Alert = () => <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Incomplete" role="img"><circle cx="12" cy="12" r="11" fill="#d9534f" /><rect x="11" y="5.500" width="2" height="9" fill="#fff" /><circle cx="12" cy="18" r="1.300" fill="#fff" /></svg>;
const Check = () => <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Complete" role="img"><circle cx="12" cy="12" r="11" fill="#3c8627" /><path d="M6.500 12.500l3.500 3.500 7.500-8" stroke="#fff" strokeWidth="2.400" fill="none" /></svg>;

export default async function OfferingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOffering("new", Number(id));
  if (!o) notFound();
  const u = await requireUser(`/investor/opportunities/${id}`);
  const client = getClient(u.clientId);
  const mine = getCommitments(u.clientId).find((c) => c.offeringPortalId === o.portalId);
  const inProgress = !!o.inProgress && !!mine;
  const sig = getPendingSignatures(u.clientId).find((s) => s.offeringPortalId === o.portalId);
  const docs = (o.documentFiles ?? []).map((n) => ({ n, t: findTemplateByDisplay(n) }));
  const terms: [string, string | undefined][] = [
    ["Price Per Share", o.pricePerShare], ["Target Raise", o.targetRaise], ["Minimum Investment", o.minimumInvestment],
    ["Investment Period", o.investmentPeriod], ["Preferred Return", o.preferredReturn?.replace(".00%", "%")], ["Distribution Schedule", o.distributionSchedule],
  ];
  const investHref = `/investor/opportunities/${o.portalId}/invest`;

  return (
    <div className="max-w-[1180px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] md:text-[40px] leading-tight font-bold text-[#343a40]">{o.name}</h1>
          <p className="muted mt-1">Prepared for {client?.full_name ?? u.email}</p>
        </div>
        {inProgress ? <Link href={investHref} className="btn btn-secondary shrink-0">Invest Again</Link>
          : <Link href={investHref} className="btn btn-green shrink-0 px-8">INVEST</Link>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="space-y-6 min-w-0 lg:col-start-1">
          <div className="card overflow-hidden relative">
            <Photo seed={o.portalId} tag={o.heroTag} label={`${o.name} hero`} />
            <button aria-label="Go to Slide 1" className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/90 border border-black/30" />
          </div>

          {inProgress && mine ? (
            <>
              <Card>
                <h2 className="text-2xl font-bold">Your Commitment</h2>
                <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><dt className="label">Investing Entity</dt><dd>{mine.entityName}</dd></div>
                  <div><dt className="label">Holding Title</dt><dd>{mine.holdingTitle ?? "--"}</dd></div>
                  <div><dt className="label">Desired Commitment</dt><dd><Link href={`${investHref}?prospectId=${mine.id}`}>{fmtUSD(mine.desired)}</Link></dd></div>
                  <div><dt className="label">Contributed</dt><dd>{mine.contributed ? fmtUSD(mine.contributed) : "--"}</dd></div>
                </dl>
              </Card>
              <Card>
                <h2 className="text-2xl font-bold">Steps To Invest</h2>
                <table className="w-full mt-3">
                  <thead><tr className="border-b hair"><th className="py-2">Step</th><th className="py-2">Status</th><th className="py-2">Actions</th></tr></thead>
                  <tbody>
                    <tr className="border-b hair"><td className="py-3">Investing Entity Details</td><td><Check /></td>
                      <td><Link href={`/investor/settings/profile/entities/${mine.entityId}`} className="btn btn-secondary !py-1">Edit</Link></td></tr>
                    <tr className="border-b hair"><td className="py-3">Sign Documents</td><td><Alert /></td>
                      <td>{sig ? <Link href={`/investor/documents/signatures/${sig.pageId}`} className="btn btn-primary !py-1 px-6">Sign</Link> : <span className="muted">Signed</span>}</td></tr>
                    <tr><td className="py-3">Send Funds</td><td><Alert /></td>
                      <td><a href="#send-funds" title="Stub — payments are not connected" data-stub="payment">I sent my capital</a></td></tr>
                  </tbody>
                </table>
                <p className="text-xs muted mt-2">STUB: Edit / “I sent my capital” are placeholders; no payment or funds-transfer integration exists in this build.</p>
              </Card>
            </>
          ) : (
            <Card>
              <h2 className="text-2xl font-bold">Offering Highlights</h2>
              <a href={templateHref(docs.find((d) => /ppm/i.test(d.n))?.t?.id ?? 0)} className="btn btn-secondary mt-4">View Offering Memorandum</a>
            </Card>
          )}

          <Card>
            <h2 className="text-2xl font-bold">Documents</h2>
            <ul className="mt-3 space-y-1.5">
              {docs.map((d) => <li key={d.n}>{d.t ? <a href={templateHref(d.t.id)} target="_blank" rel="noreferrer" className="break-words">{d.n}</a> : <span className="break-words">{d.n}</span>}</li>)}
            </ul>
          </Card>
        </div>

        {/* right rail on desktop; sits after Documents on mobile (DOM order) */}
        <aside className="lg:col-start-2 lg:row-start-1">
          <Card>
            <h2 className="text-2xl font-bold">Offering Terms</h2>
            <dl className="mt-3">
              {terms.filter(([, v]) => v).map(([l, v]) => <div key={l} className="flex justify-between gap-4 py-2 border-b hair last:border-0"><dt className="muted">{l}</dt><dd className="font-semibold text-right">{v}</dd></div>)}
            </dl>
          </Card>
        </aside>

        <div className="space-y-6 min-w-0 lg:col-start-1">
          <Card>
            <h2 className="text-2xl font-bold">Offering Description</h2>
            <p className="mt-3 leading-7">{o.description}</p>
            <Disclosure />
          </Card>

          {o.property && (
            <Card>
              <h2 className="text-2xl font-bold">{o.property.name}</h2>
              <dl className="mt-3 grid sm:grid-cols-2 gap-x-8">
                {o.property.facts.map((f) => <div key={f.label} className="flex justify-between gap-4 py-2 border-b hair"><dt className="muted">{f.label}</dt><dd className="font-semibold text-right">{f.value}</dd></div>)}
              </dl>
              {o.property.hasMap && o.property.address && (
                <iframe title={`Map of ${o.property.address}`} loading="lazy" className="w-full h-[360px] mt-5 rounded border hair"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.property.address)}&output=embed`} referrerPolicy="no-referrer-when-downgrade" />
              )}
              <BackToTop />
            </Card>
          )}

          {o.trailingBlock && (
            <Card>
              <h2 className="text-2xl font-bold">{o.trailingBlock.heading}</h2>
              <dl className="mt-3">{o.trailingBlock.facts.map((f) => <div key={f.label} className="flex justify-between py-2 border-b hair last:border-0"><dt className="muted">{f.label}</dt><dd className="font-semibold">{f.value}</dd></div>)}</dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
