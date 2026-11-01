import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { documentsFor, previewFor, signatureRows } from "@/lib/docviews";
import { getEntities } from "@/lib/queries";
import DocumentsView from "@/components/DocumentsView";

export const metadata: Metadata = { title: pageTitle("Documents") };

export default async function Signatures() {
  const u = await requireUser("/investor/documents/signatures");
  const { all, byFund, fundNames } = documentsFor(u.clientId);
  const funds = [81, 86, 87, 88].map((pid) => ({ portalId: pid, name: fundNames.get(pid)!, preview: previewFor(pid, byFund.get(pid)!), total: byFund.get(pid)!.length }));
  const years = [...new Set(all.map((d) => d.year).filter((y): y is number => !!y))].sort((a, b) => b - a);
  return <DocumentsView initialTab="signatures" all={all} funds={funds} sigs={signatureRows(u.clientId)} entities={getEntities(u.clientId).map((e) => e.name)} years={years} />;
}
