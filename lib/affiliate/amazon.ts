import type { GearGuide, GearGuideItem } from "../data/types.js";

export interface AmazonProductMatch {
  guideSlug: string;
  productName: string;
  asin: string;
  checkedAt: string;
  evidence: string;
  importOffer?: boolean;
}

export interface AmazonGearConfig {
  enabled: boolean;
  trackingId: string;
  marketplace: "amazon.de";
  matches: AmazonProductMatch[];
}

export function validateAmazonGearConfig(config: AmazonGearConfig, guides?: GearGuide[]) {
  if (typeof config.enabled !== "boolean" || config.marketplace !== "amazon.de" || !/^[a-zA-Z0-9-]+-21$/.test(config.trackingId)) throw new Error("Invalid Amazon.de affiliate configuration");
  if (!Array.isArray(config.matches)) throw new Error("Amazon matches must be an array");
  const known = guides && new Set(guides.flatMap(g => g.items.map(i => `${g.slug}\0${i.name.en}`)));
  const seen = new Set<string>();
  for (const match of config.matches) {
    const key = `${match.guideSlug}\0${match.productName}`;
    if (!match.guideSlug || !match.productName || !/^B[A-Z0-9]{9}$/.test(match.asin) || !/^\d{4}-\d{2}-\d{2}$/.test(match.checkedAt) || !match.evidence?.trim()) throw new Error("Invalid Amazon product match");
    if (seen.has(key) || (known && !known.has(key))) throw new Error(`Duplicate or unknown Amazon product: ${key}`);
    seen.add(key);
    if (match.importOffer !== undefined && typeof match.importOffer !== "boolean") throw new Error("Invalid Amazon import flag");
  }
}

export function buildAmazonProductUrl(config: AmazonGearConfig, guideSlug: string, item: GearGuideItem): string | null {
  if (!config.enabled || config.marketplace !== "amazon.de" || !/^[a-zA-Z0-9-]+-21$/.test(config.trackingId)) return null;
  const match = config.matches.find(m => m.guideSlug === guideSlug && m.productName === item.name.en);
  if (!match || !/^B[A-Z0-9]{9}$/.test(match.asin)) return null;
  const url = new URL(`https://www.amazon.de/dp/${match.asin}`);
  url.searchParams.set("tag", config.trackingId);
  // Preserve the selected child variant instead of an unselected product family.
  url.searchParams.set("th", "1");
  url.searchParams.set("psc", "1");
  return url.toString();
}
