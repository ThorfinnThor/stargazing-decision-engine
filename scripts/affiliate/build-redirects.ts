import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { buildAffiliateActivityUrl, buildAffiliateUrl, getAffiliatePartner, validateAffiliateActivityOffers, validateAffiliateConfig } from "../../lib/affiliate/affiliate.js";
import { loadAffiliateActivityOffers, loadAffiliateConfig } from "../../lib/affiliate/config.js";
import { listLocationTours, loadDestinations } from "../../lib/data/load.js";
import { buildStaticAffiliateRedirectHtml } from "../../lib/affiliate/static-redirect.js";
import type { PublishedAffiliateActivityOffer } from "../../lib/data/types.js";
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
  | { kind: "destination-search"; partner: string; destination: string; path: string; targetHost: string }
  | { kind: "activity-offer"; partner: string; offer: string; destination: string; path: string; targetHost: string };

const entries: RedirectEntry[] = [];
for (const partner of config.partners.filter((item) => item.enabled && item.destinationSearchEnabled)) {
  for (const destination of destinations.filter((item) => item.active)) {
    const url = buildAffiliateUrl(config, partner.id, destination);
    if (!url) throw new Error(`Unable to build enabled affiliate URL for ${partner.id}/${destination.slug}`);
    const relative = `/${partner.id}/${destination.slug}/index.html`;
    const filePath = resolve(directory, partner.id, destination.slug, "index.html");
    mkdirSync(resolve(directory, partner.id, destination.slug), { recursive: true });
    writeFileSync(filePath, buildStaticAffiliateRedirectHtml(url), "utf8");
    entries.push({ kind: "destination-search", partner: partner.id, destination: destination.slug, path: `/go/${partner.id}/${destination.slug}/`, targetHost: new URL(url).hostname });
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
    title: offer.title,
    description: offer.description,
    redirectPath,
    lastReviewedAt: offer.lastReviewedAt,
  });
}

writeJson(publicPath("affiliate/activity-offers.json"), publishedOffers);
writeJson(resolve(directory, "manifest.json"), { version: 2, entries });
console.log(`Built ${entries.length} static affiliate redirect(s).`);
