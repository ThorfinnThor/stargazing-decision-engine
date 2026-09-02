import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildAffiliateActivityUrl, buildAffiliateUrl, getAffiliatePartner, validateAffiliateActivityOffers, validateAffiliateConfig } from "../../lib/affiliate/affiliate.js";
import { loadAffiliateActivityOffers, loadAffiliateConfig } from "../../lib/affiliate/config.js";
import { listLocationTours, loadDestinations } from "../../lib/data/load.js";
import { buildStaticAffiliateRedirectHtml } from "../../lib/affiliate/static-redirect.js";
import type { PublishedAffiliateActivityOffer, PublishedAffiliateDestinationSearch } from "../../lib/data/types.js";
import { publicPath, writeJson } from "../pipeline/io.js";
import { writeFileSync } from "node:fs";

const legacyDirectory = publicPath("go");
rmSync(legacyDirectory, { recursive: true, force: true });
const directory = resolve(process.cwd(), "public/go");
rmSync(directory, { recursive: true, force: true });
mkdirSync(directory, { recursive: true });
const config = loadAffiliateConfig();
const offers = loadAffiliateActivityOffers();
const destinations = loadDestinations();
const tours = listLocationTours();
validateAffiliateConfig(config);
validateAffiliateActivityOffers(offers, config, destinations, tours);

type RedirectEntry =
  | { kind: "destination-search"; partner: string; destination: string; variant: string; path: string; targetHost: string }
  | { kind: "activity-offer"; partner: string; offer: string; destination: string; path: string; targetHost: string };

const entries: RedirectEntry[] = [];
const publishedDestinationSearches: PublishedAffiliateDestinationSearch[] = [];
for (const partner of config.partners.filter((item) => item.enabled && item.destinationSearchEnabled)) {
  for (const destination of destinations.filter((item) => item.active)) {
    const variants = partner.destinationSearchVariants?.length ? partner.destinationSearchVariants : [{ id: "default", queryTemplate: "{query}" }];
    for (const variant of variants) {
      const variantId = partner.destinationSearchVariants?.length ? variant.id : undefined;
      const url = buildAffiliateUrl(config, partner.id, destination, variantId);
      if (!url) throw new Error(`Unable to build enabled affiliate URL for ${partner.id}/${destination.slug}/${variant.id}`);
      const redirectPath = variantId
        ? `/go/${partner.id}/${destination.slug}/${variant.id}/`
        : `/go/${partner.id}/${destination.slug}/`;
      const filePath = variantId
        ? resolve(directory, partner.id, destination.slug, variant.id, "index.html")
        : resolve(directory, partner.id, destination.slug, "index.html");
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, buildStaticAffiliateRedirectHtml(url), "utf8");
      entries.push({ kind: "destination-search", partner: partner.id, destination: destination.slug, variant: variant.id, path: redirectPath, targetHost: new URL(url).hostname });
      publishedDestinationSearches.push({
        partnerId: partner.id,
        partnerName: partner.name,
        destinationId: destination.id,
        destinationSlug: destination.slug,
        variantId: variant.id,
        redirectPath,
      });
    }
  }
}

const publishedOffers: PublishedAffiliateActivityOffer[] = [];
for (const offer of offers.offers.filter((item) => item.enabled)) {
  const partner = getAffiliatePartner(config, offer.partnerId);
  const url = buildAffiliateActivityUrl(config, offer);
  if (!partner || !url) throw new Error(`Unable to build enabled affiliate activity URL for ${offer.id}`);
  const redirectPath = `/go/${partner.id}/offer/${offer.id}/`;
  const filePath = resolve(directory, partner.id, "offer", offer.id, "index.html");
  mkdirSync(resolve(directory, partner.id, "offer", offer.id), { recursive: true });
  writeFileSync(filePath, buildStaticAffiliateRedirectHtml(url), "utf8");
  entries.push({ kind: "activity-offer", partner: partner.id, offer: offer.id, destination: offer.destinationId, path: redirectPath, targetHost: new URL(url).hostname });
  publishedOffers.push({
    id: offer.id,
    partnerId: partner.id,
    partnerName: partner.name,
    destinationId: offer.destinationId,
    locationTourSlugs: offer.locationTourSlugs,
    kind: offer.kind ?? "stargazing",
    title: offer.title,
    description: offer.description,
    redirectPath,
    lastReviewedAt: offer.lastReviewedAt,
  });
}

writeJson(publicPath("affiliate/activity-offers.json"), publishedOffers);
writeJson(publicPath("affiliate/destination-searches.json"), publishedDestinationSearches);
writeJson(resolve(directory, "manifest.json"), { version: 2, entries });
console.log(`Built ${entries.length} static affiliate redirect(s).`);
