import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { getCommitments, getEntities, getOffering } from "@/lib/queries";
import InvestForm from "@/components/InvestForm";

export const metadata: Metadata = { title: pageTitle("Invest") };

export default async function Invest({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ prospectId?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const o = getOffering("new", Number(id));
  if (!o) notFound();
  const u = await requireUser(`/investor/opportunities/${id}/invest`);
  const prefill = getCommitments(u.clientId).find((c) => String(c.id) === sp.prospectId && c.offeringPortalId === o.portalId)?.desired;
  return (
    <div>
      <p className="text-sm mb-2"><Link href={`/investor/opportunities/${o.portalId}`}>{o.name}</Link> › Invest</p>
      <h1 className="text-[30px] md:text-[38px] font-bold text-[#343a40] mb-6">Invest in {o.name}</h1>
      <InvestForm offeringId={o.portalId} offeringName={o.name} minimum={o.minimumInvestment ?? "$200,000"} prefill={prefill}
        entities={getEntities(u.clientId).map((e) => ({ id: e.id, name: e.name }))} cancelHref={`/investor/opportunities/${o.portalId}`} />
    </div>
  );
}
