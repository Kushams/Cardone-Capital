import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { documentsFor } from "@/lib/docviews";
import { getEntities } from "@/lib/queries";
import FundDocuments from "@/components/FundDocuments";

export const metadata: Metadata = { title: pageTitle("Documents") };

export default async function FundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser(`/investor/documents/investments/${id}`);
  const { byFund, fundNames } = documentsFor(u.clientId);
  const rows = byFund.get(Number(id));
  if (!rows) notFound();
  const years = [...new Set(rows.map((d) => d.year).filter((y): y is number => !!y))].sort((a, b) => b - a);
  return (
    <div className="max-w-[1180px]">
      <p className="text-sm mb-2"><Link href="/investor/documents">Documents</Link> › All</p>
      <h1 className="text-[32px] md:text-[40px] leading-tight font-bold text-[var(--heading)] mb-6">{fundNames.get(Number(id))}</h1>
      <FundDocuments rows={rows} entities={getEntities(u.clientId).map((e) => e.name)} years={years} />
    </div>
  );
}
