"use client";
import Link from "next/link";
import { useState } from "react";
import AddressFields from "./AddressFields";
import { ENTITY_TYPES } from "@/lib/constants";

/** Invest / Submit Interest entry screen (CLONE-PROMPT §16). Submit is a STUB: nothing is saved or sent. */
export default function InvestForm({ offeringId, offeringName, minimum, prefill, entities, cancelHref }:
  { offeringId: number; offeringName: string; minimum: string; prefill?: number; entities: { id: number; name: string }[]; cancelHref: string }) {
  const [as, setAs] = useState(entities[0] ? String(entities[0].id) : "new");
  const [done, setDone] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); window.scrollTo({ top: 0 }); }} className="max-w-[820px]">
      {done && <div role="status" className="card p-4 mb-5 border-l-4" style={{ borderLeftColor: "#fcc43e" }}>
        <b>STUB — nothing was submitted.</b> The subscription flow is not connected in this build; no entity, commitment, payment or document was created.</div>}
      <section className="card p-6 space-y-5">
        <label className="block"><span className="label !text-[var(--text)] font-bold">Desired Commitment</span>
          <input name="commitment" inputMode="numeric" defaultValue={prefill ? `$${prefill.toLocaleString("en-US")}` : ""} className="input max-w-[280px]" />
          <span className="text-sm muted">{minimum} minimum</span></label>
        <h2 className="text-xl font-bold pt-2">How would you like to invest?</h2>
        <label className="block"><span className="label">Investing As</span>
          <select name="investingAs" value={as} onChange={(e) => setAs(e.target.value)} className="input max-w-[420px]">
            {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            <option value="new">Add a New Investing Entity</option>
          </select></label>
        {as === "new" && (
          <fieldset className="space-y-4 border hair rounded p-4">
            <legend className="px-2 font-bold">Add a New Investing Entity</legend>
            <label className="block"><span className="label">Entity Name</span><input name="newName" className="input" /></label>
            <label className="block"><span className="label">Tax ID</span><input name="taxId" className="input max-w-[280px]" autoComplete="off" inputMode="numeric" placeholder="" /></label>
            <div className="flex flex-wrap gap-6 items-end">
              <label><span className="label">Entity Type</span><select name="entityType" className="input">{ENTITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="flex items-center gap-2 pb-2"><input type="checkbox" name="disregarded" /> Disregarded Entity</label>
            </div>
            <label className="block"><span className="label">Holding Title</span><input name="holdingTitle" className="input" /></label>
            <div><span className="label">Tax Address</span><AddressFields prefix="tax" /></div>
          </fieldset>
        )}
        <label className="block"><span className="label">Additional Questions/Feedback</span><textarea name="notes" rows={3} className="input" /></label>
        <div><h3 className="font-bold mb-2">Entity Owner&apos;s Personal Information</h3>
          <label className="block"><span className="label">Phone</span><input name="phone" type="tel" className="input max-w-[320px]" /></label></div>
        <div className="flex items-center gap-5 pt-2">
          <button type="submit" className="btn btn-primary px-8">Submit</button>
          <Link href={cancelHref}>Cancel</Link>
        </div>
      </section>
    </form>
  );
}
