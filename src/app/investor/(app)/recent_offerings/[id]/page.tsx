import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { getOffering } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import Photo from "@/components/Photo";
import { mapsUrl, perfRows } from "@/components/OfferingBits";
import type { Asset } from "@/data/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: pageTitle((await getOffering("recent", Number((await params).id)))?.name ?? "Offering") };
}

const fmtN = (n: number) => n.toLocaleString("en-US");
function facts(a: Asset): [string, string][] {
  const f: [string, string | undefined][] = [
    ["Asset Type", a.assetType], ["Property Class", a.propertyClass], ["Units", a.units != null ? fmtN(a.units) : undefined],
    ["Square Feet", a.squareFeet != null ? fmtN(a.squareFeet) : undefined], ["Stories", a.stories?.toString()], ["Parking Spaces", a.parking?.toString()],
    ["Year Built", a.yearBuilt?.toString()], ["Acquired", a.acquired], ["Land Acres", a.landAcres?.toString()],
  ];
  return f.filter(([, v]) => v !== undefined) as [string, string][]; // never backfill fields the source page doesn't show
}

export default async function RecentOffering({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOffering("recent", Number(id));
  if (!o) notFound();
  await requireUser(`/investor/recent_offerings/${id}`);
  const perf = perfRows(o.performance);
  return (
    <div className="max-w-[1000px]">
      <h1 className="text-[28px] md:text-[35px] font-bold text-[var(--heading)] mb-6">{o.name}</h1>
      {/* Template: nothing else exists on these pages — no buttons, terms, documents, or footer. Fund 32 is genuinely H1-only. */}
      {o.description && (
        <section className="mb-6"><h4 className="text-xl font-bold mb-2">Investment Description</h4>
          <div className="card p-5 leading-7">{o.description}</div></section>
      )}
      {perf.length > 0 && (
        <section className="mb-6"><h4 className="text-xl font-bold mb-2">Investment Performance</h4>
          <div className="card p-5"><dl>{perf.map(([l, v]) => <div key={l} className="flex justify-between py-1.5"><dt className="muted">{l}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></div></section>
      )}
      {o.assets && o.assets.length > 0 && (
        <section>
          <h4 className="text-xl font-bold mb-2">Asset Details</h4>
          {o.ownershipNote && <p className="muted mb-3">{o.ownershipNote}</p>}
          <div className="space-y-6">
            {o.assets.map((a) => (
              <article key={a.id} className="card p-5 md:p-6">
                <h5 className="text-xl font-bold">{a.name}</h5>
                <p className="mt-1">{a.address} <a href={mapsUrl(a.address)} target="_blank" rel="noreferrer" className="ml-2 whitespace-nowrap">
                  <svg className="inline -mt-1" width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z" /></svg> Map</a></p>
                <div className="mt-4 grid md:grid-cols-[200px_1fr] gap-6">
                  <div>
                    <Link href={`/investor/recent_offerings/${o.portalId}/assets/${a.id}/photos`} aria-label={`Photo of ${a.name}`}><Photo seed={a.id} className="rounded" src={a.thumb} label={`Photo of ${a.name}`} /></Link>
                    <p className="muted text-sm mt-1">{a.photos} photo{a.photos === 1 ? "" : "s"}</p>
                  </div>
                  <dl className="grid sm:grid-cols-2 gap-x-8">
                    {facts(a).map(([l, v]) => <div key={l} className="flex justify-between gap-4 py-1.5 border-b hair"><dt className="muted">{l}</dt><dd className="font-semibold text-right">{v}</dd></div>)}
                  </dl>
                </div>
                {a.description && <p className="mt-4 leading-7">{a.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
