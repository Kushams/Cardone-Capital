import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { getOfferings } from "@/lib/queries";
import PageTitle from "@/components/PageTitle";
import { NewCard } from "@/components/OfferingBits";

export const metadata: Metadata = { title: pageTitle("New Offerings") };

export default async function NewOfferings() {
  const offerings = await getOfferings("new");
  return (
    <div className="max-w-[1180px]">
      <PageTitle>New Offerings</PageTitle>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{offerings.map((o) => <NewCard key={o.portalId} o={o} />)}</div>
    </div>
  );
}
