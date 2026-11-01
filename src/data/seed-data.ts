/**
 * SINGLE SEED-DATA FILE (CLONE-PROMPT §15): every offering, amount, date and display value lives here.
 * Descriptions are short placeholder copy summarising the audit gists (Appendix A) — replace with the firm's
 * own text assets. All demo investors are FICTIONAL (see DEMO_* below); nothing here comes from the sample account.
 */
import type { Asset, Offering, Performance } from "./types";
import imageMap from "../../images/image-map.json";

export const STD_DISCLOSURE =
  "This communication is for informational purposes only and is not an offer to sell securities. Investing in real estate involves risk, including loss of principal. See investor.gov and the firm's disclosures page for important information.";

// ---------------- NEW OFFERINGS (4 cards; sidebar badge counts NEW flags = 3) ----------------
export const NEW_OFFERINGS: Offering[] = [
  {
    kind: "new", portalId: 81, slug: "fund-29-opportunities-81", name: "Cardone Equity Fund 29, LLC", sortOrder: 1,
    inProgress: true, heroTag: "10X NAPLES + BITCOIN FUND",
    targetRaise: "$53,000,000", minimumInvestment: "$200,000", investmentPeriod: "10 Years", preferredReturn: "8.00%", distributionSchedule: "Monthly",
    description: "The 10X Naples + Bitcoin Fund: acquisition of Orchid Run, a 282-unit, 2015-vintage, all-concrete multifamily asset in Central Naples, combined with Bitcoin exposure. ",
    documentFiles: [
      "EXECUTED Cardone Equity Fund 29 - Operating Agreement - Second Amended & Restated - FINAL - 07-22-26 (1).pdf",
      "10X-Naples-Investment-Memorandum-w/ Financials.pdf",
      "Cardone Equity Fund 29 - Subscription Booklet - FINAL - 07-22-26.pdf",
      "Cardone Equity Fund 29 - PPM (corresponds to 2nd Amended & Restated OA) - FINAL - 07-22-26.pdf",
      "2026-04-17-10X-NAPLES-IM-V7.pdf",
      "CEF 29 Wire Instructions.pdf",
    ],
  },
  {
    kind: "new", portalId: 86, slug: "fund-30-opportunities-86", name: "Cardone Equity Fund 30, LLC", sortOrder: 2, isNew: true,
    targetRaise: "$150,000,000", minimumInvestment: "$200,000", investmentPeriod: "7-10 Years", distributionSchedule: "Monthly",
    description: "A 608-unit multifamily acquisition on roughly 52 acres of waterfront land on Old Tampa Bay in South Tampa, positioned as a cash-flow asset (targeted ~5% cash flow), with renovated interiors, two resort-style pools, a two-storey fitness centre and direct bay access with a kayak launch. ",
    property: {
      name: "10X Westshore South", address: "6301 S West Shore Blvd, Tampa, FL 33616", hasMap: true,
      facts: [
        { label: "Address", value: "6301 S West Shore Blvd, Tampa, FL 33616" }, { label: "Asset Type", value: "Multi-Family" },
        { label: "Property Class", value: "A" }, { label: "Total Units", value: "608" }, { label: "Square Feet", value: "760" },
        { label: "Rentable SF", value: "462,225" }, { label: "Land Acres", value: "51" }, { label: "Stories", value: "3" },
        { label: "Parking Spaces", value: "1219" }, { label: "Year Built", value: "1989" },
      ],
    },
    documentFiles: [
      "Cardone Equity Fund 30 - PPM - FINAL - 07-08-26.pdf",
      "Cardone Equity Fund 30 (Class A) - Subscription Booklet (July 2026) - FINAL - 07-08-26.pdf",
      "CEF 30 - Wire Instructions.pdf",
    ],
  },
  {
    kind: "new", portalId: 87, slug: "fund-31-opportunities-87", name: "Cardone Equity Fund 31, LLC", sortOrder: 3, isNew: true, heroTag: "BITCOIN",
    targetRaise: "$150,000,000", minimumInvestment: "$200,000", investmentPeriod: "7-10 Years", distributionSchedule: "Monthly",
    description: "A vehicle for accredited investors targeting up to $150M of commitments, primarily multifamily assets in high-growth markets across the risk spectrum, plus opportunistic commercial real estate. ",
    trailingBlock: { heading: "Cardone Equity Fund 31, LLC", facts: [{ label: "Asset Type", value: "Mixed-Use" }, { label: "Year Built", value: "2026" }] },
    documentFiles: [
      "Cardone Equity Fund 31 - PPM - FINAL - August 2026.pdf",
      "Cardone Equity Fund 31 Class A_B_D) - Subscription Booklet (August 2026) - FINAL - August 2026.pdf",
      "CEF 31 - Wire Instructions .pdf",
    ],
  },
  {
    kind: "new", portalId: 88, slug: "fund-32-opportunities-88", name: "Cardone Equity Fund 32, LLC", sortOrder: 4, isNew: true,
    pricePerShare: "$1,000", targetRaise: "$150,000,000", minimumInvestment: "$200,000", investmentPeriod: "7-10 Years", distributionSchedule: "Monthly",
    description: "Acquisition of a 587-unit waterfront multifamily community built in 2020 on about 10 acres on Old Tampa Bay in South Tampa. Class A and cash-flow focused, with two pools, a two-storey fitness centre, yoga/spin studios and a clubhouse, next to 10X Westshore South. ",
    documentFiles: [
      "Cardone Equity Fund 32 - PPM - FINAL - 09-01-26.pdf",
      "Cardone Equity Fund 32 (Class A) - Subscription Booklet (Sept 2026) - FINAL - 09-01-26.pdf",
      "CEF 32 - Wire Instructions.pdf",
      "UPDATED W-9 Fund 32.pdf",
    ],
  },
];

// ---------------- RECENT (FUNDED) OFFERINGS ----------------
let assetSeq = 1000;
type A = Omit<Asset, "id" | "propertyClass" | "assetType"> & { assetType?: string };
const asset = (a: A): Asset => ({ id: assetSeq++, propertyClass: "A", assetType: "Multi-Family", ...a });
const perf = (coc: string, irr: string, multiple: string, pref?: string): Performance => ({ coc, irr, multiple, pref });

// Fund 4 / Fund 5 share the identical five assets
const f4assets = (): Asset[] => [
  asset({ name: "10X Living at Breakfast Point", address: "9700 Panama City Beach Parkway, Panama City Beach, FL 32407", photos: 1, units: 360, squareFeet: 365472, stories: 3, parking: 605, yearBuilt: 2007, acquired: "08/30/19" }),
  asset({ name: "10X Living at Delray", address: "14050 Pacific Point Place, Delray Beach, FL 33484", photos: 4, units: 346, squareFeet: 362000, stories: 3, parking: 779, yearBuilt: 2017, acquired: "09/27/18" }),
  asset({ name: "10X Living at Naples", address: "2602 Fountain View Circle, Naples, FL 34109", photos: 3, units: 456, squareFeet: 468435, stories: 2, parking: 877, yearBuilt: 1990, acquired: "06/28/19" }),
  asset({ name: "10X Living at Sawgrass", address: "2903 NW 130th Avenue, Sunrise, FL 33323", photos: 3, units: 501, squareFeet: 495246, stories: 4, parking: 890, yearBuilt: 2013, acquired: "06/27/19" }),
  asset({ name: "10X Living at Stella", address: "4711 LJ Parkway, Sugarland, TX 77479", photos: 5, units: 351, squareFeet: 324268, stories: 3, parking: 621, yearBuilt: 2018, acquired: "01/25/19" }),
];
const f6assets = (retreatName: string, addisonAddr: string): Asset[] => [
  asset({ name: "10X Living at Addison Place", address: addisonAddr, photos: 4, units: 294, squareFeet: 302829, stories: 4, parking: 550, yearBuilt: 2019, acquired: "02/20/20" }),
  asset({ name: "10X Living at Columbia Town Center", address: "10360 Swift Stream Place, Columbia, MD 21044", photos: 5, units: 531, squareFeet: 551454, stories: 4, parking: 937, yearBuilt: 2001, acquired: "12/19/19" }),
  asset({ name: "10X Living at Panama City Beach", address: "7150 US-98, Panama City Beach, FL 32407", photos: 3, units: 288, squareFeet: 304814, stories: 3, parking: 528, yearBuilt: 2018, acquired: "09/12/19" }),
  asset({ name: retreatName, address: "90 Sandal Lane, Panama City Beach, FL 32413", photos: 1, units: 360, squareFeet: 361920, stories: 3, parking: 643, yearBuilt: 2008, acquired: "01/28/20" }),
];

const R = (portalId: number, n: number | string, fundedOn: string, sortOrder: number, rest: Partial<Offering> = {}): Offering => ({
  kind: "recent", portalId, slug: `recent-${portalId}`,
  name: typeof n === "number" ? `Cardone Equity Fund ${n}, LLC` : n, fundedOn, sortOrder, ...rest,
});

// Display order EXACTLY as the portal feed (17 before 18, 6 before 8, 4 before 5). Route ids from Appendix A.
export const RECENT_OFFERINGS: Offering[] = [
  R(88, 32, "09/04/26", 1), // genuinely H1-only recent page
  R(76, "10X Space Coast Fund, LLC", "12/19/24", 2, {
    heroTag: "BITCOIN FUND",
    description: "A vehicle combining real estate with Bitcoin: acquisition of 10X Space Coast Town Center, a 300-unit Class A multifamily asset in Melbourne, Florida, bought without debt for immediate positive cash flow, with monthly real-estate income funding ongoing Bitcoin purchases.",
    assets: [asset({ name: "10X Space Coast Town Center", address: "2114 Nebula Way, West Melbourne, FL 32904", photos: 3, units: 300, stories: 4, parking: 500, yearBuilt: 2022, acquired: "12/19/24",
      description: "A vehicle combining real estate with Bitcoin: acquisition of 10X Space Coast Town Center, a 300-unit Class A multifamily asset in Melbourne, Florida, bought without debt for immediate positive cash flow, with monthly real-estate income funding ongoing Bitcoin purchases." })],
  }),
  R(75, 25, "09/16/24", 3, { assets: [asset({ name: "The Edge at Flagler Village", address: "475 N FEDERAL HWY, FORT LAUDERDALE, FL 33301", photos: 3, units: 331, stories: 7, parking: 528, yearBuilt: 2014, acquired: "09/16/24" })] }),
  R(74, 24, "06/19/24", 4, {
    description: "An accredited-investor vehicle targeting up to $150M in high-growth markets, mainly multifamily plus opportunistic commercial/office. A projected co-investment with Fund 23 is noted.",
    assets: [asset({ name: "10X at Jacaranda", address: "9233 NW 7th Cir, Plantation, FL 33324", photos: 4, units: 468, stories: 3, parking: 823, yearBuilt: 1989, acquired: "06/18/24" })],
  }),
  R(73, 23, "03/22/24", 5, { assets: [
    asset({ name: "10X at Flagler Village", address: "501 NE 5th St, Fort Lauderdale, FL 33301", photos: 4, assetType: "Mixed-Use", units: 382, stories: 7, parking: 599, yearBuilt: 2014, acquired: "05/15/24" }),
    asset({ name: "10X at The Forum", address: "3100 CHAMPION RING ROAD, FORT MYERS, FL 33905", photos: 6, units: 252, stories: 3, parking: 504, yearBuilt: 2017, acquired: "03/22/24" }),
  ] }),
  R(53, 22, "08/24/23", 6, { performance: perf("6.00%", "15.00%", "2.50x"), assets: [
    asset({ name: "10X Tarpon Springs", address: "1185 S Pinellas Ave, Tarpon Springs, FL 34689", photos: 3, units: 236, stories: 4, parking: 283, yearBuilt: 2020, acquired: "12/28/23" }),
    asset({ name: "The Edison", address: "5015 Mina Cir, Fort Myers, FL 33905", photos: 5, units: 327, stories: 4, parking: 611, yearBuilt: 2020, acquired: "08/24/23" }),
  ] }),
  R(49, 21, "11/22/22", 7, {
    description: "November 2022 purchase of the Cardone Corporate Center offices, $58.7M raised, co-invested with Cardone REIT I.",
    performance: perf("6.00%", "12.00%", "2.25x"),
    assets: [asset({ name: "Cardone Corporate Center", address: "16427 & 16435 North Scottsdale Road, Scottsdale, AZ 85254", photos: 5, assetType: "Office", squareFeet: 294762, stories: 4, parking: 778, yearBuilt: 2004, acquired: "11/22/22",
      description: "Two-building Class A trophy office in the Scottsdale Airpark." })],
  }),
  R(46, 20, "04/15/22", 8, { description: "December 2021 purchase of 10X Living at Miami River, $38.8M raised, co-invested with Cardone REIT I.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Miami River", address: "1001 NW 7th St,, Miami, FL 33136", photos: 6, units: 346, squareFeet: 281896, stories: 8, parking: 447, yearBuilt: 2021, acquired: "03/24/22" })] }),
  R(45, 17, "03/01/22", 9, { description: "December 2021 purchase of 10X Living at Riverwalk, $27.3M raised, co-invested with Cardone REIT I.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Riverwalk", address: "4 West Las Olas Boulevard, Fort Lauderdale, FL 33301", photos: 5, units: 260, squareFeet: 234842, stories: 26, parking: 385, yearBuilt: 2021, acquired: "12/10/21" })] }),
  R(48, 18, "03/01/22", 10, { description: "December 2021 purchase of 10X Living at Sunrise, $21.3M raised, co-invested with Cardone REIT I.", performance: perf("6.00%", "23.00%", "4.50x"),
    assets: [asset({ name: "10X Living at Sunrise", address: "1640 NW 128th Drive, Sunrise, FL 33323", photos: 4, units: 389, squareFeet: 373164, stories: 3, parking: 696, yearBuilt: 1996, acquired: "12/10/21" })] }),
  R(44, 16, "12/30/21", 11, { description: "December 2021 purchase of 10X Living at Las Olas Walk, $48.7M raised, co-invested with Cardone REIT I.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Las Olas Walk", address: "106 S Federal Hwy, Fort Lauderdale, FL 33301", photos: 8, units: 456, squareFeet: 342567, stories: 7, parking: 614, yearBuilt: 2020, acquired: "12/10/21" })] }),
  R(43, 15, "11/18/21", 12, { description: "September 2021 purchase of two Houston communities, $69.4M equity invested.", performance: perf("6.00%", "15.00%", "2.50x"), assets: [
    asset({ name: "10X Living at 15th Street Flats", address: "1414 North Shepard Drive, Houston, TX 77008", photos: 6, units: 337, squareFeet: 263866, stories: 8, parking: 502, yearBuilt: 2021, acquired: "09/20/21" }),
    asset({ name: "10X Living at Heights Waterworks", address: "515 W 20th Street, Houston, TX 77008", photos: 6, units: 309, squareFeet: 246703, stories: 8, parking: 408, yearBuilt: 2020, acquired: "09/20/21" }),
  ] }),
  R(42, 14, "06/18/21", 13, { description: "May 2021 purchase of 10X Living at Mizner Park, $29.5M invested.", performance: { irr: "17.50%", multiple: "4.00x" },
    assets: [asset({ name: "10X Living at Mizner Park", address: "33 E Camino Real, Boca Raton, FL 33432", photos: 6, units: 235, squareFeet: 342135, stories: 9, parking: 411, yearBuilt: 2002, acquired: "05/26/21" })] }),
  R(41, 12, "05/28/21", 14, { description: "May 2021 purchase of the 10X Centre office building, $33.4M raised.", performance: perf("7.00%", "16.00%", "3.00x"),
    assets: [asset({ name: "10X Centre", address: "18851 NE 29th Avenue, Aventura, FL 33180", photos: 4, assetType: "Commercial", squareFeet: 219244, stories: 11, parking: 988, yearBuilt: 2003, acquired: "05/28/21" })] }),
  R(40, 11, "04/16/21", 15, { description: "April 2021 purchase of 10X Living at Fort Lauderdale, $38.4M raised.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Fort Lauderdale", address: "1919 SE 10th Avenue, Fort Lauderdale, FL 33316", photos: 6, units: 310, squareFeet: 420000, stories: 8, parking: 629, yearBuilt: 2018, acquired: "04/16/21" })] }),
  R(39, 10, "12/29/20", 16, { description: "December 2020 purchase of 10X Living at Boca Raton, $64.5M raised.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Boca Raton", address: "5500 Military Trail, Boca Raton, FL 33487", photos: 10, units: 398, squareFeet: 400148, stories: 6, parking: 719, yearBuilt: 2018, acquired: "12/03/20" })] }),
  R(38, 9, "10/01/20", 17, { description: "September 2020 purchase of 10X Living at Port Royale, $47.6M raised.", performance: perf("6.00%", "15.00%", "2.50x"),
    assets: [asset({ name: "10X Living at Port Royale", address: "3101 Port Royale Boulevard, Fort Lauderdale, FL 33308", photos: 7, units: 553, squareFeet: 399204, stories: 4, parking: 871, yearBuilt: 1998, acquired: "09/10/20" })] }),
  R(36, 6, "06/25/20", 18, { description: "Open to accredited and non-accredited investors. February 2019 - January 2020: four communities bought with Fund VIII, $29.5M raised.", performance: perf("6.00%", "16.00%", "3.00x"),
    assets: f6assets("10X Living at Retreat at PCB", "8633 Addison Pl Cir, Naples, FL 34119") }),
  R(37, 8, "06/25/20", 19, { description: "Accredited investors. The same February 2019 - January 2020 four communities, bought with Fund VI, $79.3M raised.", performance: perf("6.00%", "16.00%", "3.00x", "6.00%"),
    assets: f6assets("10X Living at Retreat PCB", "8633 Addison Pl Ciry, Naples, FL 34119") }),
  R(34, 4, "10/11/19", 20, { description: "August 2018 - June 2019: five communities bought with Fund V, $106M raised.", performance: perf("6.00%", "15.00%", "2.50x", "6.00%"), assets: f4assets() }),
  R(35, 5, "09/23/19", 21, { description: "Open to both accredited and non-accredited investors. The same August 2018 - June 2019 five communities, bought with Fund IV, $50M raised.", performance: perf("6.00%", "15.00%", "2.50x"), assets: f4assets() }),
  R(33, 3, "05/31/18", 22, { description: "January 2018 Woodway Square and February 2018 Murano purchases, $45M raised.", performance: perf("6.00%", "16.00%", "3.00x", "6.00%"), assets: [
    asset({ name: "10X Living at Murano", address: "9932 Grande Lakes Boulevard, Orlando, FL 32837", photos: 3, units: 240, squareFeet: 415194, stories: 4, parking: 434, yearBuilt: 2016, acquired: "02/20/18" }),
    asset({ name: "10X Living at Woodway Square", address: "1200 Winrock Boulevard, Houston, TX 77057", photos: 3, units: 507, squareFeet: 488048, stories: 3, parking: 860, yearBuilt: 1992, acquired: "01/30/18" }),
  ] }),
  R(32, 2, "02/13/17", 23, { description: "October 2016 purchase of the Reserve at Ormond Beach (about 35 acres), $8.3M raised.", performance: perf("6.00%", "20.00%", "4.50x", "6.00%"),
    assets: [asset({ name: "10X Living at Ormond Beach", address: "600 Crown Commerce Court, Ormond Beach, FL 32174", photos: 3, units: 272, squareFeet: 331498, stories: 3, parking: 585, yearBuilt: 2003, acquired: "10/27/16" })] }),
  R(31, 1, "12/08/16", 24, { description: "September 2016 purchase of the Reserve at Port St. Lucie (about 20 acres), $4.8M raised.", performance: perf("6.00%", "20.00%", "4.50x", "6.00%"),
    ownershipNote: "99.0000% owned by Cardone Equity Fund 1, LLC",
    assets: [asset({ name: "10X Living at Port St. Lucie", address: "1500 SE Tiffany Club Place, Port St. Lucie, FL 34952", photos: 1, units: 188, squareFeet: 181148, stories: 3, parking: 392, yearBuilt: 1997, acquired: "09/30/16" })] }),
];

export const ALL_OFFERINGS = [...NEW_OFFERINGS, ...RECENT_OFFERINGS];

// ---------------- DEMO DATA — clearly fictional investors only ----------------
export const DEMO = {
  password: "Demo-Passw0rd!Change", // dev/demo only
  clients: [
    { email: "alex.demo@example.test", full_name: "Alex Demo", phone: "+1 555 010 0101", address: "100 Example Way, Testville, FL 33000",
      entity: { name: "Harbor View Holdings, LLC", entity_type: "Limited Liability Company", holding_title: "Company Ownership", k1_name: "Harbor View Holdings, LLC",
        tax_id: "98-7654321", tax_address: { address: "100 Example Way", address2: "", city: "Testville", state: "FL", zip: "33000", country: "United States" } },
      commitment: 400000 },
    { email: "sam.sample@example.test", full_name: "Sam Sample", phone: "+1 555 010 0202", address: "200 Placeholder Rd, Fakeburg, TX 75000",
      entity: { name: "Lakeside Capital Partners, LLC", entity_type: "Limited Liability Company", holding_title: "Company Ownership", k1_name: "Lakeside Capital Partners, LLC",
        tax_id: "97-1234567", tax_address: { address: "200 Placeholder Rd", address2: "Suite 5", city: "Fakeburg", state: "TX", zip: "75000", country: "United States" } },
      commitment: 250000 },
  ],
  invitedNotOnboarded: "invitee.demo@example.test",
};

/** Strings that must NEVER appear in any master template or generated demo document (Section 17 §6 denylist). */
export const SAMPLE_INVESTOR_DENYLIST = ["puza", "tara", "kevin", "ryan tara", "kevin puza", "puza, llc"];

/** Documents → Investment tab previews (3 rows per fund, in the portal's displayed order) — preserved as observed. */
export const DOC_PREVIEW: Record<number, string[]> = {
  81: ["Cardone Equity Fund 29 - PPM (corresponds to 2nd Amended & Restated OA) - FINAL - 07-22-26.pdf", "2026-04-17-10X-NAPLES-IM-V7.pdf", "CEF 29 Wire Instructions.pdf"],
  86: ["Cardone Equity Fund 30 (Class A) - Subscription Booklet (July 2026) - FINAL - 07-08-26.pdf", "Cardone Equity Fund 30 - Operating Agreement - FINAL - 07-08-26.pdf", "CEF 30 - Wire Instructions.pdf"],
  87: ["Cardone Equity Fund 31 - PPM - FINAL - August 2026.pdf", "Cardone Equity Fund 31 Class A_B_D) - Subscription Booklet (August 2026) - FINAL - August 2026.pdf", "Cardone Equity Fund 31 - Operating Agreement - FINAL - August 2026.pdf"],
  88: ["Cardone Equity Fund 32 (Class A) - Subscription Booklet (Sept 2026) - FINAL - 09-01-26.pdf", "Cardone Equity Fund 32 - Operating Agreement - FINAL - 09-01-26.pdf", "Cardone Equity Fund 32 - PPM - FINAL - 09-01-26.pdf"],
};
/** The unnamed first column shows a blue dot on 7 of 19 rows (all Fund 32 rows, Fund 31 Wire Instructions + Operating Agreement). Unlabelled, as in the original. */
export const dotRule = (offeringPortalId: number | null, docType: string) =>
  offeringPortalId === 88 || (offeringPortalId === 87 && (docType === "WIRE_INSTRUCTIONS" || docType === "OPERATING_AGREEMENT"));


// ---------------- REAL IMAGES — assigned from images/image-map.json (source of truth for which file fills which slot) ----------------
export const IMG_BASE = "/images/";
(function applyImageMap() {
  const byName = (list: Offering[], n: string) => list.find((o) => o.name === n);
  for (const e of (imageMap as { images: any[] }).images) {
    if (!e.offering || String(e.status ?? "").startsWith("pending")) continue; // pending hero files are picked up automatically once they exist (see heroFor)
    const src = IMG_BASE + e.file;
    if (e.file.startsWith("dashboard-recent-offerings/")) { const o = byName(RECENT_OFFERINGS, e.offering); if (o) o.cardImage = src; }
    else if (e.file.startsWith("new-offerings/")) { const o = byName(NEW_OFFERINGS, e.offering); if (o) o.cardImage = src; }
    else if (e.file.startsWith("recent-offerings/")) {
      const o = byName(RECENT_OFFERINGS, e.offering); const a = o?.assets?.find((x) => x.name === e.property);
      if (a) a.thumb = src;
    }
  }
  for (const o of NEW_OFFERINGS) o.heroSlug = `fund-${o.name.match(/Fund (\d+)/)![1]}`;
})();
