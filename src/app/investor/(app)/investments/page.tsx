import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { getCommitments, getEntities, getPendingSignatures } from "@/lib/queries";
import { getOfferings } from "@/lib/queries";
import { fmtUSD } from "@/lib/catalog";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import Collapsible from "@/components/Collapsible";
import SortableTable, { type Row } from "@/components/SortableTable";
import { RecentCard } from "@/components/OfferingBits";

export const metadata: Metadata = { title: pageTitle("Dashboard") };
const REFER = "mailto:?subject=Cardone%20Capital&body=" + encodeURIComponent("Take a look at Cardone Capital: https://cardonecapital.com/\n\nQuestions? Contact the team at +1 305 407 0276 or invest@cardonecapital.com.");

export default async function Dashboard() {
  const u = await requireUser("/investor/investments");
  const sigs = await getPendingSignatures(u.clientId);
  const entities = await getEntities(u.clientId);
  const needsBank = entities.some((e) => !e.distribution_method);
  const commitments = await getCommitments(u.clientId);
  const recents = await getOfferings("recent");

  const rows: Row[] = commitments.map((c) => ({
    id: c.id,
    cells: {
      offering: <Link href={`/investor/opportunities/${c.offeringPortalId}`}>{c.offeringName}</Link>,
      as: `${c.entityName} — ${c.holdingTitle ?? "—"}`,
      desired: <Link href={`/investor/opportunities/${c.offeringPortalId}/invest?prospectId=${c.id}`}>{fmtUSD(c.desired)}</Link>,
      contributed: c.contributed ? fmtUSD(c.contributed) : "--",
    },
    sort: { offering: c.offeringName, as: `${c.entityName}`, desired: c.desired, contributed: c.contributed ?? 0 },
  }));

  return (
    <div className="max-w-[1180px]">
      <PageTitle right={<div className="flex flex-wrap gap-x-6 gap-y-1 pt-3 text-[14px]">
        <a href="https://cardonecapital.com/" target="_blank" rel="noreferrer" className="whitespace-nowrap">Cardone Capital Website</a>
        <a href={REFER} className="whitespace-nowrap">Refer a Friend</a></div>}>Dashboard</PageTitle>

      <div className="space-y-6">
        <Card>
          <h2 className="flex items-center gap-2 text-[19px] md:text-[23px] font-bold">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden fill="#fcc43e"><path d="M12 2a6 6 0 0 0-6 6v3.600L4 15v2h16v-2l-2-3.400V8a6 6 0 0 0-6-6zm-2.500 17a2.500 2.500 0 0 0 5 0z" /></svg>
            Action Items
          </h2>
          {sigs.length > 0 && (
            <div className="mt-4">
              <h3 className="text-brand text-xl font-bold">Documents to Sign</h3>
              <p className="mt-1">Please review and sign {sigs.length} document{sigs.length === 1 ? "" : "s"}.</p>
              <Link href="/investor/documents/signatures" className="btn btn-secondary mt-3">Sign Documents</Link>
            </div>
          )}
          {sigs.length > 0 && needsBank && <hr className="my-5 hair border-t" />}
          {needsBank && (
            <div className={sigs.length ? "" : "mt-4"}>
              <h3 className="text-brand text-xl font-bold">Payment Information</h3>
              <p className="mt-1">Please set up a distribution bank account for your Investing Entities.</p>
              <Link href="/investor/settings/profile" className="btn btn-secondary mt-3">View Investing Entities</Link>
            </div>
          )}
          {!sigs.length && !needsBank && <p className="mt-2 muted">You have no action items.</p>}
        </Card>

        <Card>
          <h2 className="text-[19px] md:text-[23px] font-bold text-active">Welcome to your Investor Portal</h2>
          <p className="mt-3">We are pleased to provide secure access to your investments, including:</p>
          <ul className="list-disc pl-8 mt-2 space-y-0.5">
            {["Position Details", "Asset Information", "Tax Forms", "Reports & Documents", "Distributions", "Contributions"].map((x) => <li key={x}>{x}</li>)}
          </ul>
          <p className="mt-3">We will let you know when new items have been shared with you. Please contact us if you have any questions.</p>
        </Card>

        {commitments.length > 0 && (
          <Collapsible title="New Offerings">
            <div className="hidden md:block">
              <SortableTable testId="dash-new-offerings" columns={[
                { key: "offering", header: "New Offering", sortable: true }, { key: "as", header: "Investing As", sortable: true },
                { key: "desired", header: "Desired Commitment", sortable: true }, { key: "contributed", header: "Contributed", sortable: true }]} rows={rows} />
            </div>
            <div className="md:hidden divide-y hair">
              {commitments.map((c) => (
                <div key={c.id} className="py-3 space-y-1">
                  <Link href={`/investor/opportunities/${c.offeringPortalId}`} className="font-bold text-lg">{c.offeringName}</Link>
                  <div>{c.entityName}</div>
                  <div><span className="muted">Holding Title</span> &nbsp; {c.holdingTitle ?? "—"}</div>
                  <div><span className="muted">Desired Commitment</span> &nbsp; <Link href={`/investor/opportunities/${c.offeringPortalId}/invest?prospectId=${c.id}`}>{fmtUSD(c.desired)}</Link></div>
                  <div><span className="muted">Contributed</span> &nbsp; {c.contributed ? fmtUSD(c.contributed) : "--"}</div>
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        <section>
          <h2 className="text-[23px] font-bold mb-4">Recent Offerings</h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" data-testid="recent-grid">
            {recents.map((o) => <RecentCard key={o.portalId} o={o} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
