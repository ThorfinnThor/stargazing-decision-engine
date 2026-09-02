import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { validateAffiliateActivityOffers, validateAffiliateConfig } from "../../lib/affiliate/affiliate.js";
import type { AffiliateActivityOfferConfig, AffiliateConfig, PublishedAffiliateActivityOffer, PublishedAffiliateDestinationSearch } from "../../lib/data/types.js";
import { listLocationTours, loadDestinations } from "../../lib/data/load.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const config = readJson<AffiliateConfig>(resolve(root, "data-config/sources/affiliate-partners.json"));
const offers = readJson<AffiliateActivityOfferConfig>(resolve(root, "data-config/sources/affiliate-activity-offers.json"));
validateAffiliateConfig(config);
validateAffiliateActivityOffers(offers, config, loadDestinations(), listLocationTours());
const schemaValidator = createSchemaValidator();
const validatePartners = schemaValidator.getSchema("https://stargazing.local/schema/affiliate-partners.json");
const validateOffers = schemaValidator.getSchema("https://stargazing.local/schema/affiliate-activity-offers.json");
const redirectManifestPath = resolve(root, "public/go/manifest.json");
if (!existsSync(redirectManifestPath)) throw new Error("Affiliate redirect manifest is missing; run data:affiliate");
const redirects = readJson<{ version: 2; entries: Array<{ kind: string; partner: string; path: string; targetHost: string }> }>(redirectManifestPath);
const publishedOffers = readJson<PublishedAffiliateActivityOffer[]>(resolve(root, "public/data/stargazing/affiliate/activity-offers.json"));
const publishedSearches = readJson<PublishedAffiliateDestinationSearch[]>(resolve(root, "public/data/stargazing/affiliate/destination-searches.json"));
const activeDestinations = loadDestinations().filter((destination) => destination.active);
const activeDestinationIds = new Set(activeDestinations.map((destination) => destination.id));
for (const partner of config.partners.filter((item) => item.widget?.enabled)) {
  for (const destinationId of partner.widget?.destinationScope === "selected" ? partner.widget.destinationIds ?? [] : []) {
    if (!activeDestinationIds.has(destinationId)) throw new Error(`${partner.id}: widget destination does not exist or is inactive: ${destinationId}`);
  }
}
const enabledSearchPartners = config.partners.filter((partner) => partner.enabled && partner.destinationSearchEnabled);
const enabledSearchVariants = enabledSearchPartners.reduce((sum, partner) => sum + (partner.destinationSearchVariants?.length || 1), 0);
const enabledOffers = offers.offers.filter((offer) => offer.enabled).length;
const expectedSearches = enabledSearchVariants * activeDestinations.length;
const expectedRedirects = expectedSearches + enabledOffers;
if (redirects.version !== 2) throw new Error("Affiliate redirect manifest version is invalid");
if (redirects.entries.length !== expectedRedirects) throw new Error(`Expected ${expectedRedirects} affiliate redirect(s), found ${redirects.entries.length}`);
if (new Set(redirects.entries.map((entry) => entry.path)).size !== redirects.entries.length) throw new Error("Affiliate redirect paths must be unique");
if (publishedOffers.length !== enabledOffers) throw new Error("Published affiliate offer count does not match enabled source offers");
if (new Set(publishedOffers.map((offer) => offer.id)).size !== publishedOffers.length) throw new Error("Published affiliate offer IDs must be unique");
if (publishedSearches.length !== expectedSearches) throw new Error("Published destination-search count does not match enabled variants");
if (new Set(publishedSearches.map((search) => `${search.partnerId}/${search.destinationId}/${search.variantId}`)).size !== publishedSearches.length) throw new Error("Published destination searches must be unique");
const expectedSearchKeys = new Set(enabledSearchPartners.flatMap((partner) => activeDestinations.flatMap((destination) => (
  (partner.destinationSearchVariants?.length ? partner.destinationSearchVariants.map((variant) => variant.id) : ["default"])
    .map((variantId) => `${partner.id}/${destination.id}/${variantId}`)
))));
for (const search of publishedSearches) {
  const key = `${search.partnerId}/${search.destinationId}/${search.variantId}`;
  if (!expectedSearchKeys.delete(key)) throw new Error(`Unexpected published destination search: ${key}`);
  if (!redirects.entries.some((entry) => entry.kind === "destination-search" && entry.path === search.redirectPath)) throw new Error(`Published destination search is missing its redirect: ${key}`);
}
if (expectedSearchKeys.size > 0) throw new Error(`Missing published destination search: ${[...expectedSearchKeys][0]}`);
if (!validatePartners?.(config)) {
  console.error(validatePartners?.errors ?? "Affiliate partner schema missing");
  process.exitCode = 1;
} else if (!validateOffers?.(offers)) {
  console.error(validateOffers?.errors ?? "Affiliate activity offer schema missing");
  process.exitCode = 1;
} else {
  console.log(`Validated ${config.partners.length} affiliate partner configuration(s), ${offers.offers.length} curated activity offer(s), and ${redirects.entries.length} static redirect(s).`);
}
