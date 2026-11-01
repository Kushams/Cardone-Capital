import type { Offering } from "@/data/types";

export type DocType = "PPM" | "OPERATING_AGREEMENT" | "SUBSCRIPTION_BOOKLET" | "W9" | "WIRE_INSTRUCTIONS" | "MEMORANDUM";

/** Classification per CLONE-PROMPT §17.2 */
export function classify(fileName: string): { docType: DocType; personalised: boolean } {
  const n = fileName.toLowerCase();
  if (n.includes("subscription booklet")) return { docType: "SUBSCRIPTION_BOOKLET", personalised: true };
  if (n.includes("w-9")) return { docType: "W9", personalised: true };
  if (n.includes("wire instructions")) return { docType: "WIRE_INSTRUCTIONS", personalised: false };
  if (n.includes("operating agreement")) return { docType: "OPERATING_AGREEMENT", personalised: false };
  if (n.includes("ppm")) return { docType: "PPM", personalised: false };
  return { docType: "MEMORANDUM", personalised: false };
}

/** "09/08/26" -> "2026-09-08" */
export function isoFromMDY(s: string): string {
  const [m, d, y] = s.split("/");
  return `20${y}-${m}-${d}`;
}
/** "2026-09-08" -> "09/08/26" */
export function mdyFromISO(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}
export const fmtUSD = (n: number | null | undefined) => (n == null ? "--" : "$" + n.toLocaleString("en-US"));

export const offeringInternalId = (o: Pick<Offering, "kind" | "portalId">) => (o.kind === "new" ? o.portalId : 1000 + o.portalId);

/** Display file name; the manifest holds a "/" -> "-" safe on-disk name for the Naples financials memo. */
export const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "10X-Naples-Investment-Memorandum-w-Financials.pdf": "10X-Naples-Investment-Memorandum-w/ Financials.pdf",
  "EXECUTED Cardone Equity Fund 29 - Operating Agreement - Second Amended & Restated - FINAL - 07-22-26 (1).pdf":
    "EXECUTED Cardone Equity Fund 29 - Operating Agreement - Second Amended & Restated - FINAL - 07-22-26",
};
