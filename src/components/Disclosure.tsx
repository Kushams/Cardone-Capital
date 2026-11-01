import { STD_DISCLOSURE } from "@/data/seed-data";
export default function Disclosure() {
  return (
    <p className="text-xs muted mt-4 leading-5">
      {STD_DISCLOSURE.split(" See investor.gov")[0]} See <a href="https://www.investor.gov/" target="_blank" rel="noreferrer">investor.gov</a> and the
      firm&apos;s <a href="https://cardonecapital.com/disclosures/" target="_blank" rel="noreferrer">disclosures page</a> for important information.
    </p>
  );
}
