import Link from "next/link";
import type { Offering, Performance } from "@/data/types";
import Photo from "./Photo";

export const mapsUrl = (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

export function perfRows(p?: Performance): [string, string][] {
  if (!p) return [];
  const r: [string, string][] = [];
  if (p.irr) r.push(["Target Investor IRR", p.irr]);
  if (p.coc) r.push(["Target Cash on Cash", p.coc]);
  if (p.multiple) r.push(["Target Equity Multiple", p.multiple]);
  if (p.pref) r.push(["Preferred Return", p.pref]);
  return r;
}

export function RecentCard({ o }: { o: Offering }) {
  const href = `/investor/recent_offerings/${o.portalId}`;
  const rows = perfRows(o.performance);
  return (
    <article className="card overflow-hidden flex flex-col">
      <Link href={href}><Photo seed={o.portalId} tag={o.heroTag} src={o.cardImage} label={o.name} /></Link>
      <div className="p-5 flex flex-col flex-1 text-center">
        <h3 className="text-xl font-bold"><Link href={href} className="!text-[var(--text)]">{o.name}</Link></h3>
        <p className="muted mt-1">Funded on {o.fundedOn}</p>
        {rows.length > 0 && (
          <dl className="mt-3 text-left text-[13px]">
            {rows.map(([l, v]) => <div key={l} className="flex justify-between py-0.5"><dt className="muted">{l}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
        )}
        <div className="mt-auto pt-4"><Link href={href} className="btn btn-secondary">Learn More</Link></div>
      </div>
    </article>
  );
}

export function NewCard({ o }: { o: Offering }) {
  const rows: [string, string | undefined][] = [
    ["Preferred Return", o.preferredReturn], ["Price Per Share", o.pricePerShare], ["Target Raise", o.targetRaise], ["Minimum Investment", o.minimumInvestment],
  ];
  const href = `/investor/opportunities/${o.portalId}`;
  return (
    <article className="card overflow-hidden flex flex-col">
      <Link href={href}><Photo seed={o.portalId} tag={o.heroTag} src={o.cardImage} label={o.name} /></Link>
      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-xl font-bold text-center">{o.name}</h2>
        {o.isNew && <div className="text-center mt-2"><span className="inline-block bg-badge text-[#212529] text-xs font-bold px-3 py-1 rounded-full tracking-wide" data-testid="new-pill">NEW</span></div>}
        <dl className="mt-4 text-[13px]">
          {rows.filter(([, v]) => v).map(([l, v]) => <div key={l} className="flex justify-between py-1"><dt className="muted">{l}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
        <div className="mt-auto pt-5 text-center"><Link href={href} className="btn btn-secondary px-8">View Offering</Link></div>
      </div>
    </article>
  );
}
