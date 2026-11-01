import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOffering } from "@/lib/queries";
import { pageTitle } from "@/lib/nav";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = { title: pageTitle("Photos") };

export default async function Photos({ params }: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await params;
  const o = await getOffering("recent", Number(id));
  const a = o?.assets?.find((x) => x.id === Number(assetId));
  if (!o || !a) notFound();
  return <Gallery closeHref={`/investor/recent_offerings/${o.portalId}`} count={a.photos} seed={a.id} name={a.name} cover={a.thumb} />;
}
