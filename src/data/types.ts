export interface Fact { label: string; value: string }
export interface Asset {
  id: number; name: string; address: string; photos: number;
  assetType: string; propertyClass: "A"; units?: number; squareFeet?: number; stories?: number;
  parking?: number; yearBuilt?: number; acquired?: string; landAcres?: number;
  description?: string; // optional distinct description under the fact grid
}
export interface Performance { irr?: string; coc?: string; multiple?: string; pref?: string }
export interface Offering {
  kind: "new" | "recent"; portalId: number; slug: string; name: string; sortOrder: number;
  isNew?: boolean; inProgress?: boolean; heroTag?: string;
  pricePerShare?: string; targetRaise?: string; minimumInvestment?: string; investmentPeriod?: string;
  preferredReturn?: string; distributionSchedule?: string;
  fundedOn?: string; performance?: Performance;
  description?: string; ownershipNote?: string; assets?: Asset[];
  property?: { name: string; address?: string; facts: Fact[]; hasMap: boolean }; // new-offering property block
  trailingBlock?: { heading: string; facts: Fact[] }; // Fund 31
  documentFiles?: string[]; // names for the offering-page Documents card (from manifest appearsIn)
}
