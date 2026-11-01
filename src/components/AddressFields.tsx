import { COUNTRIES, US_STATES } from "@/lib/constants";
export default function AddressFields({ prefix, v = {} as Record<string, string> }: { prefix: string; v?: Record<string, string> }) {
  const n = (k: string) => `${prefix}_${k}`;
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <label className="sm:col-span-2"><span className="label">Address</span><input name={n("address")} defaultValue={v.address ?? ""} className="input" autoComplete="off" /></label>
      <label className="sm:col-span-2"><span className="label">Address 2</span><input name={n("address2")} defaultValue={v.address2 ?? ""} className="input" /></label>
      <label><span className="label">City</span><input name={n("city")} defaultValue={v.city ?? ""} className="input" /></label>
      <label><span className="label">State</span><select name={n("state")} defaultValue={v.state ?? ""} className="input"><option value="">Select…</option>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label><span className="label">Zip</span><input name={n("zip")} defaultValue={v.zip ?? ""} className="input" /></label>
      <label><span className="label">Country</span><select name={n("country")} defaultValue={v.country ?? "United States"} className="input">{COUNTRIES.map((s) => <option key={s}>{s}</option>)}</select></label>
    </div>
  );
}
