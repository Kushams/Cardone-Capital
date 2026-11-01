import type { Metadata } from "next";
import { cookies } from "next/headers";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { documentsFor, previewFor, signatureRows } from "@/lib/docviews";
import { getEntities } from "@/lib/queries";
import DocumentsView from "@/components/DocumentsView";

export const metadata: Metadata = { title: pageTitle("Documents") };

export default async function Documents() {
  const u = await requireUser("/investor/documents");
  const c = (await cookies()).get("cc_docs_tab")?.value;
  const initial = c === "investment" || c === "signatures" ? c : "all";
  const { all, byFund, fundNames } = await documentsFor(u.clientId);
  const funds = await Promise.all([81, 86, 87, 88].map(async (pid) => ({ portalId: pid, name: fundNames.get(pid)!, preview: await previewFor(pid, byFund.get(pid)!), total: byFund.get(pid)!.length })));
  const years = [...new Set(all.map((d) => d.year).filter((y): y is number => !!y))].sort((a, b) => b - a);
  return <DocumentsView initialTab={initial} all={all} funds={funds} sigs={await signatureRows(u.clientId)} entities={(await getEntities(u.clientId)).map((e) => e.name)} years={years} />;
}
