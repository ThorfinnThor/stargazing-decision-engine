import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateAmazonGearConfig, type AmazonGearConfig } from "./amazon";

import type { AffiliateActivityOfferConfig, AffiliateConfig, AstroshopProductMatch } from "../data/types.js";

export function loadAffiliateConfig(): AffiliateConfig {
  return JSON.parse(readFileSync(resolve(process.cwd(), "data-config/sources/affiliate-partners.json"), "utf8")) as AffiliateConfig;
}

export function loadAffiliateActivityOffers(): AffiliateActivityOfferConfig {
  return JSON.parse(readFileSync(resolve(process.cwd(), "data-config/sources/affiliate-activity-offers.json"), "utf8")) as AffiliateActivityOfferConfig;
}

export function loadAstroshopProductMatches(): AstroshopProductMatch[] {
  return JSON.parse(readFileSync(resolve(process.cwd(), "data-config/gear/astroshop-product-matches.json"), "utf8")) as AstroshopProductMatch[];
}

export function loadAmazonGearConfig(): AmazonGearConfig {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/gear/amazon-product-matches.json"), "utf8")) as AmazonGearConfig;
  validateAmazonGearConfig(config);
  return config;
}
