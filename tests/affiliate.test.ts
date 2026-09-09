import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildAffiliateActivityUrl, buildAffiliatePartnerUrl, buildAffiliateUrl, buildAstroshopProductUrl, getGetYourGuideActivityId, validateAffiliateActivityOffers, validateAffiliateConfig, validateAstroshopProductMatches } from "../lib/affiliate/affiliate.js";
import type { AffiliateActivityOfferConfig, AffiliateConfig, AstroshopProductMatch, Destination, GearGuide, LocationTour, PublishedAffiliateActivityOffer, PublishedAffiliateDestinationSearch, StayArea } from "../lib/data/types.js";

const destination: Destination = {
  id: "destination", slug: "destination", name: "Destination", countryCode: "DE", countryName: "Germany", continent: "Europe", regionSlugs: [], timezone: "Europe/Berlin", active: true, priority: 1, tags: [], observationSiteIds: [], stayAreaIds: [], affiliateQuery: "Monsaraz & Alqueva",
};

const config: AffiliateConfig = {
  version: 1,
  partners: [{ id: "stay-search", name: "Stay Search", type: "hotel", enabled: false, affiliateId: "", destinationSearchEnabled: true, urlTemplate: "https://booking.com/search?ss={query}&aid={affiliateId}", allowedHosts: ["booking.com"], requiredQueryParameters: ["aid"], disclosure: { en: "Disclosure", de: "Hinweis" } }],
};

const locationTour: LocationTour = {
  version: 1,
  id: "destination-tour",
  slug: "destination-tour",
  destinationId: destination.id,
  recommendedSiteId: "site",
  title: { en: "Destination night", de: "Nacht am Ziel" },
  seoDescription: { en: "Description", de: "Beschreibung" },
  standfirst: { en: "Standfirst", de: "Vorspann" },
  facts: [],
  blocks: [],
  sourceIds: [],
  lastReviewedAt: "2026-08-30",
};

const source = (path: string) => readFileSync(path, "utf8");

test("disabled affiliate partners cannot produce a CTA URL", () => {
  validateAffiliateConfig(config);
  assert.equal(buildAffiliateUrl(config, "stay-search", destination), null);
});

test("gear partner URL preserves Astroshop tracking and host allowlist", () => {
  const gearConfig: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "astroshop-gear", name: "Astroshop", type: "gear", enabled: true, affiliateId: "StargazingIndex", destinationSearchEnabled: false,
      urlTemplate: "https://www.astroshop.de/?affiliate_id={affiliateId}", allowedHosts: ["www.astroshop.de"], requiredQueryParameters: ["affiliate_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  validateAffiliateConfig(gearConfig);
  const url = buildAffiliatePartnerUrl(gearConfig, "astroshop-gear");
  assert.equal(url, "https://www.astroshop.de/?affiliate_id=StargazingIndex");
});

test("every gear item receives a tracked Astroshop product or product-search URL", () => {
  const gearConfig = JSON.parse(source("data-config/sources/affiliate-partners.json")) as AffiliateConfig;
  const guides = JSON.parse(source("data-config/gear/guides.json")) as GearGuide[];
  const matches = JSON.parse(source("data-config/gear/astroshop-product-matches.json")) as AstroshopProductMatch[];
  validateAstroshopProductMatches(matches, guides);
  const matchedKeys = new Set(matches.map((match) => `${match.guideSlug}\u0000${match.productName}`));
  let direct = 0;
  let search = 0;
  for (const guide of guides) for (const item of guide.items) {
    const match = matches.find((candidate) => candidate.guideSlug === guide.slug && candidate.productName === item.name.en);
    const result = buildAstroshopProductUrl(gearConfig, item, match);
    assert.ok(result, `${guide.slug}/${item.name.en} must produce an Astroshop link`);
    const parsed = new URL(result.url);
    assert.equal(parsed.hostname, "www.astroshop.de");
    assert.equal(parsed.searchParams.get("affiliate_id"), "StargazingIndex");
    if (result.direct) {
      direct += 1;
      assert.match(parsed.pathname, /\/p,\d+$/);
      assert.ok(matchedKeys.has(`${guide.slug}\u0000${item.name.en}`));
    } else {
      search += 1;
      assert.equal(parsed.searchParams.get("q"), item.partnerSearchQuery);
    }
  }
  assert.equal(direct, 36);
  assert.equal(search, 16);
});

test("enabled affiliate URLs are encoded and host allow-listed", () => {
  const enabled: AffiliateConfig = { ...config, partners: [{ ...config.partners[0], enabled: true, affiliateId: "abc123" }] };
  const url = buildAffiliateUrl(enabled, "stay-search", destination);
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, "booking.com");
  assert.equal(parsed.searchParams.get("ss"), "Monsaraz & Alqueva");
  assert.equal(parsed.searchParams.get("aid"), "abc123");
});

test("Booking.com destination searches preserve the CJ click ID, per-destination SID, and encoded target", () => {
  const partners = JSON.parse(source("data-config/sources/affiliate-partners.json")) as AffiliateConfig;
  const laPalma = { ...destination, id: "la-palma", slug: "la-palma", affiliateQuery: "La Palma, Canary Islands, Spain" };
  validateAffiliateConfig(partners);
  const url = buildAffiliateUrl(partners, "booking-stay-search", laPalma);
  assert.ok(url);
  const click = new URL(url);
  assert.equal(click.protocol, "https:");
  assert.equal(click.hostname, "www.jdoqocy.com");
  assert.equal(click.pathname, "/click-101879720-15734849");
  assert.equal(click.searchParams.get("sid"), "stargazingindex-la-palma");
  assert.match(url, /La%2520Palma%252C%2520Canary%2520Islands%252C%2520Spain/);
  const target = new URL(click.searchParams.get("url") ?? "");
  assert.equal(target.hostname, "www.booking.com");
  assert.equal(target.pathname, "/searchresults.html");
  assert.equal(target.searchParams.get("ss"), "La Palma, Canary Islands, Spain");
});

test("nested affiliate destination targets must use an allow-listed HTTPS host", () => {
  const invalid: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "stay-search", name: "Stay Search", type: "hotel", enabled: true, affiliateId: "click-id", destinationSearchEnabled: true,
      urlTemplate: "https://tracking.example/click-{affiliateId}?sid={destinationSlug}&url={destinationUrl}",
      destinationUrlTemplate: "https://evil.example/search?ss={query}",
      allowedHosts: ["tracking.example", "booking.com"], requiredQueryParameters: ["sid", "url"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  assert.throws(() => validateAffiliateConfig(invalid), /destination URL host is not allow-listed/i);
});

test("all published Booking.com searches use the primary recorded stay area and a unique destination SID", () => {
  const destinations = JSON.parse(source("data-config/sources/destinations.json")) as Destination[];
  const stayAreas = JSON.parse(source("data-config/sources/stay-areas.json")) as StayArea[];
  const stayAreaById = new Map(stayAreas.map((stayArea) => [stayArea.id, stayArea]));
  const published = JSON.parse(source("public/data/stargazing/affiliate/destination-searches.json")) as PublishedAffiliateDestinationSearch[];
  const bookingSearches = published.filter((search) => search.partnerId === "booking-stay-search");
  const activeDestinations = destinations.filter((item) => item.active);

  assert.equal(bookingSearches.length, activeDestinations.length);
  assert.equal(new Set(bookingSearches.map((search) => search.destinationId)).size, activeDestinations.length);
  for (const destinationItem of activeDestinations) {
    const primaryStayArea = destinationItem.stayAreaIds.map((id) => stayAreaById.get(id)).find(Boolean);
    assert.ok(primaryStayArea, `${destinationItem.id} needs a primary stay area`);
    const html = source(`public/go/booking-stay-search/${destinationItem.slug}/index.html`);
    const match = html.match(/location\.replace\("([^"]+)"\)/);
    assert.ok(match, `${destinationItem.id} needs a static Booking.com redirect`);
    const click = new URL(match[1]);
    assert.equal(click.hostname, "www.jdoqocy.com");
    assert.equal(click.pathname, "/click-101879720-15734849");
    assert.equal(click.searchParams.get("sid"), `stargazingindex-${destinationItem.slug}`);
    const booking = new URL(click.searchParams.get("url") ?? "");
    assert.equal(booking.hostname, "www.booking.com");
    assert.equal(booking.pathname, "/searchresults.html");
    assert.equal(booking.searchParams.get("ss"), primaryStayArea.affiliateQuery);
  }
});

test("destination search variants produce distinct stargazing and general Viator searches", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "viator-activities", name: "Viator", type: "activity", enabled: true, affiliateId: "P123", destinationSearchEnabled: true,
      destinationSearchVariants: [{ id: "stargazing", queryTemplate: "stargazing {query}" }, { id: "activities", queryTemplate: "{query}" }],
      urlTemplate: "https://www.viator.com/searchResults/all?text={query}&pid={affiliateId}&mcid=42383&medium=link",
      allowedHosts: ["www.viator.com"], requiredQueryParameters: ["pid", "mcid", "medium"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  validateAffiliateConfig(partners);
  const stargazing = buildAffiliateUrl(partners, "viator-activities", destination, "stargazing");
  const activities = buildAffiliateUrl(partners, "viator-activities", destination, "activities");
  assert.equal(new URL(stargazing ?? "").searchParams.get("text"), "stargazing Monsaraz & Alqueva");
  assert.equal(new URL(activities ?? "").searchParams.get("text"), "Monsaraz & Alqueva");
  assert.equal(buildAffiliateUrl(partners, "viator-activities", destination), null);
});

test("destination search variants reject unsupported placeholders", () => {
  const invalid: AffiliateConfig = {
    ...config,
    partners: [{ ...config.partners[0], destinationSearchVariants: [{ id: "broken", queryTemplate: "{query} {month}" }] }],
  };
  assert.throws(() => validateAffiliateConfig(invalid), /unsupported placeholder/i);
});

test("GetYourGuide destination widget requires allow-listed HTTPS sources", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "getyourguide-activities", name: "GetYourGuide", type: "activity", enabled: true, affiliateId: "BKWM9K1", destinationSearchEnabled: false,
      widget: { type: "activities", enabled: true, campaign: "Stargazing", scriptUrl: "https://widget.getyourguide.com/dist/pa.umd.production.min.js", frameUrl: "https://widget.getyourguide.com/default/activities.frame", itemCount: 3, destinationScope: "selected", destinationIds: ["la-palma"] },
      urlTemplate: null, allowedHosts: ["www.getyourguide.com", "widget.getyourguide.com"], requiredQueryParameters: ["partner_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  assert.doesNotThrow(() => validateAffiliateConfig(partners));
  assert.throws(() => validateAffiliateConfig({
    ...partners,
    partners: [{ ...partners.partners[0], widget: { ...partners.partners[0].widget!, scriptUrl: "https://tracking.example/widget.js" } }],
  }), /not allow-listed/i);
  assert.throws(() => validateAffiliateConfig({
    ...partners,
    partners: [{ ...partners.partners[0], widget: { ...partners.partners[0].widget!, frameUrl: "https://tracking.example/widget.frame" } }],
  }), /not allow-listed/i);
});

test("affiliate validation rejects an unallow-listed template host", () => {
  assert.throws(() => validateAffiliateConfig({ ...config, partners: [{ ...config.partners[0], urlTemplate: "https://evil.example/?q={query}&aid={affiliateId}", allowedHosts: ["booking.com"] }] }), /allow-listed/i);
});

test("curated Viator activity links retain all required tracking parameters", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "viator-activities", name: "Viator", type: "activity", enabled: true, affiliateId: "P123", destinationSearchEnabled: false, urlTemplate: null,
      allowedHosts: ["www.viator.com"], requiredQueryParameters: ["pid", "mcid", "medium"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  const offers: AffiliateActivityOfferConfig = {
    version: 1,
    offers: [{
      id: "destination-stargazing", partnerId: "viator-activities", destinationId: destination.id, locationTourSlugs: [locationTour.slug], enabled: true,
      title: { en: "Stargazing", de: "Sternbeobachtung" }, description: { en: "Guided night", de: "Geführte Nacht" },
      urlTemplate: "https://www.viator.com/tours/example?pid={affiliateId}&mcid=42383&medium=link", lastReviewedAt: "2026-08-30",
    }],
  };
  validateAffiliateConfig(partners);
  validateAffiliateActivityOffers(offers, partners, [destination], [locationTour]);
  const url = buildAffiliateActivityUrl(partners, offers.offers[0]);
  assert.ok(url);
  assert.equal(new URL(url).searchParams.get("pid"), "P123");
});

test("curated GetYourGuide links retain partner and campaign tracking", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "getyourguide-activities", name: "GetYourGuide", type: "activity", enabled: true, affiliateId: "BKWM9K1", destinationSearchEnabled: false, urlTemplate: null,
      allowedHosts: ["www.getyourguide.com"], requiredQueryParameters: ["partner_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  const offers: AffiliateActivityOfferConfig = {
    version: 1,
    offers: [{
      id: "la-palma-stargazing", partnerId: "getyourguide-activities", destinationId: destination.id, locationTourSlugs: [locationTour.slug], enabled: true,
      title: { en: "Stargazing", de: "Sternbeobachtung" }, description: { en: "Guided night", de: "Geführte Nacht" },
      urlTemplate: "https://www.getyourguide.com/example?partner_id={affiliateId}&utm_medium=online_publisher&cmp=Stargazing", lastReviewedAt: "2026-08-30",
    }],
  };
  validateAffiliateConfig(partners);
  validateAffiliateActivityOffers(offers, partners, [destination], [locationTour]);
  const url = buildAffiliateActivityUrl(partners, offers.offers[0]);
  assert.ok(url);
  assert.equal(new URL(url).searchParams.get("partner_id"), "BKWM9K1");
  assert.equal(new URL(url).searchParams.get("cmp"), "Stargazing");
});

test("GetYourGuide activity IDs are read only from direct product URLs", () => {
  assert.equal(getGetYourGuideActivityId("https://www.getyourguide.com/la-palma-l417/example-t683919/?partner_id=BKWM9K1"), "683919");
  assert.equal(getGetYourGuideActivityId("https://www.getyourguide.com/s?partner_id=BKWM9K1&lc=417"), null);
  assert.equal(getGetYourGuideActivityId("https://example.com/example-t683919/"), null);
  assert.equal(getGetYourGuideActivityId("not-a-url"), null);
});

test("curated activity links reject missing provider tracking parameters", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "getyourguide-activities", name: "GetYourGuide", type: "activity", enabled: false, affiliateId: "", destinationSearchEnabled: false, urlTemplate: null,
      allowedHosts: ["www.getyourguide.com"], requiredQueryParameters: ["partner_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  const offers: AffiliateActivityOfferConfig = {
    version: 1,
    offers: [{
      id: "destination-stargazing", partnerId: "getyourguide-activities", destinationId: destination.id, locationTourSlugs: [locationTour.slug], enabled: false,
      title: { en: "Stargazing", de: "Sternbeobachtung" }, description: { en: "Guided night", de: "Geführte Nacht" },
      urlTemplate: "https://www.getyourguide.com/example?campaign={affiliateId}", lastReviewedAt: "2026-08-30",
    }],
  };
  assert.throws(() => validateAffiliateActivityOffers(offers, partners, [destination], [locationTour]), /partner_id/i);
});

test("curated activity offers must map to a tour from the same destination", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "getyourguide-activities", name: "GetYourGuide", type: "activity", enabled: false, affiliateId: "", destinationSearchEnabled: false, urlTemplate: null,
      allowedHosts: ["www.getyourguide.com"], requiredQueryParameters: ["partner_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  const offers: AffiliateActivityOfferConfig = {
    version: 1,
    offers: [{
      id: "destination-stargazing", partnerId: "getyourguide-activities", destinationId: destination.id, locationTourSlugs: [locationTour.slug], enabled: false,
      title: { en: "Stargazing", de: "Sternbeobachtung" }, description: { en: "Guided night", de: "Geführte Nacht" },
      urlTemplate: "https://www.getyourguide.com/example?partner_id={affiliateId}", lastReviewedAt: "2026-08-30",
    }],
  };
  assert.throws(() => validateAffiliateActivityOffers(offers, partners, [destination], [{ ...locationTour, destinationId: "elsewhere" }]), /does not match/i);
});

test("reviewed GetYourGuide catalog contains only direct tracked product pages", () => {
  const actual = JSON.parse(readFileSync("data-config/sources/affiliate-activity-offers.json", "utf8")) as AffiliateActivityOfferConfig;
  const getYourGuideOffers = actual.offers.filter((offer) => offer.partnerId === "getyourguide-activities" && offer.enabled);
  for (const offer of getYourGuideOffers) {
    const url = new URL(offer.urlTemplate.replace("{affiliateId}", "BKWM9K1"));
    assert.equal(url.hostname, "www.getyourguide.com");
    assert.equal(url.searchParams.get("partner_id"), "BKWM9K1");
    assert.equal(url.searchParams.get("utm_medium"), "online_publisher");
    assert.ok(url.searchParams.get("cmp"));
    assert.match(url.pathname, /-t\d+\/$/);
  }
});

test("published GetYourGuide offers expose direct analyzer-compatible links and retain fallback redirects", () => {
  const sourceConfig = JSON.parse(source("data-config/sources/affiliate-activity-offers.json")) as AffiliateActivityOfferConfig;
  const published = JSON.parse(source("public/data/stargazing/affiliate/activity-offers.json")) as Array<PublishedAffiliateActivityOffer>;
  const enabled = new Map(sourceConfig.offers.filter((offer) => offer.enabled).map((offer) => [offer.id, offer]));
  assert.equal(published.length, enabled.size);
  for (const offer of published) {
    const sourceOffer = enabled.get(offer.id);
    assert.ok(sourceOffer, `${offer.id} must have an enabled source offer`);
    const expectedUrl = sourceOffer.urlTemplate.replace("{affiliateId}", "BKWM9K1");
    assert.equal(offer.affiliateUrl, expectedUrl);
    assert.match(offer.affiliateUrl, /^https:\/\/www\.getyourguide\.com\//);
    assert.equal(new URL(offer.affiliateUrl).searchParams.get("partner_id"), "BKWM9K1");
    assert.equal(offer.redirectPath, `/go/getyourguide-activities/offer/${offer.id}/`);
  }
  const activityOffers = source("components/affiliate-activity-offers.tsx");
  assert.match(activityOffers, /href=\{offer\.affiliateUrl\}/);
  assert.doesNotMatch(activityOffers, /href=\{offer\.redirectPath\}/);
});

test("Viator offers stay disabled until their affiliate links resolve to product detail pages", () => {
  const actual = JSON.parse(readFileSync("data-config/sources/affiliate-activity-offers.json", "utf8")) as AffiliateActivityOfferConfig;
  const viatorOffers = actual.offers.filter((offer) => offer.partnerId === "viator-activities" && offer.enabled);
  assert.equal(viatorOffers.length, 0);
});

test("regional activity sections contain no more than two direct GetYourGuide products per destination", () => {
  const actual = JSON.parse(readFileSync("data-config/sources/affiliate-activity-offers.json", "utf8")) as AffiliateActivityOfferConfig;
  const regionalOffers = actual.offers.filter((offer) => offer.enabled && offer.kind === "regional");
  const destinationCounts = new Map<string, number>();
  for (const offer of regionalOffers) {
    assert.equal(offer.partnerId, "getyourguide-activities");
    destinationCounts.set(offer.destinationId, (destinationCounts.get(offer.destinationId) ?? 0) + 1);
  }
  assert.equal(regionalOffers.length, 90);
  assert.equal(destinationCounts.size, 50);
  for (const count of destinationCounts.values()) assert.ok(count <= 2);
});

test("the first ten destinations use the reviewed offer inventory without automatic fallbacks", () => {
  const actual = JSON.parse(readFileSync("data-config/sources/affiliate-activity-offers.json", "utf8")) as AffiliateActivityOfferConfig;
  const firstTen = ["la-palma", "tenerife", "westhavelland", "alqueva", "galloway", "atacama", "big-bend", "aoraki-mackenzie", "namibrand", "jasper"];
  const expectedCounts: Record<string, { stargazing: number; regional: number }> = {
    "la-palma": { stargazing: 2, regional: 2 },
    "tenerife": { stargazing: 3, regional: 2 },
    "westhavelland": { stargazing: 0, regional: 0 },
    "alqueva": { stargazing: 2, regional: 2 },
    "galloway": { stargazing: 0, regional: 2 },
    "atacama": { stargazing: 1, regional: 2 },
    "big-bend": { stargazing: 0, regional: 1 },
    "aoraki-mackenzie": { stargazing: 1, regional: 2 },
    "namibrand": { stargazing: 0, regional: 2 },
    "jasper": { stargazing: 1, regional: 2 },
  };
  for (const destinationId of firstTen) {
    const offers = actual.offers.filter((offer) => offer.enabled && offer.destinationId === destinationId);
    assert.equal(offers.filter((offer) => (offer.kind ?? "stargazing") === "stargazing").length, expectedCounts[destinationId].stargazing);
    assert.equal(offers.filter((offer) => offer.kind === "regional").length, expectedCounts[destinationId].regional);
  }
  assert.equal(actual.offers.some((offer) => offer.id === "viator-la-palma-stargazing-279280p2" && offer.enabled), false);
  assert.equal(actual.offers.some((offer) => offer.id === "viator-la-palma-roque-private-5593930p4" && offer.enabled), false);
});

test("57-destination audit additions retain verified product identity and tour mapping", () => {
  const offers = JSON.parse(source("public/data/stargazing/affiliate/activity-offers.json")) as PublishedAffiliateActivityOffer[];
  const expected = [["brecon-beacons","1079824"],["bryce-canyon","1118327"],["capitol-reef","492007"],["arches","597462"],["kaikoura","1269017"],["oudtshoorn","433401"],["wadi-rum","1100097"]];
  for (const [destinationId, productId] of expected) {
    const offer = offers.find((item) => item.destinationId === destinationId && item.id.endsWith(productId));
    assert.ok(offer);
    assert.equal(offer.kind, "stargazing");
    assert.ok(offer.locationTourSlugs.length > 0);
    const url = new URL(offer.affiliateUrl);
    assert.ok(url.pathname.endsWith(`-t${productId}/`));
    assert.equal(url.searchParams.get("referral_redirect"), "1");
    assert.equal(url.searchParams.get("partner_id"), "BKWM9K1");
  }
  assert.equal(offers.some((offer) => offer.affiliateUrl.includes("-t1167432/")), false);
});

test("affiliate disclosures appear only with rendered affiliate integrations", () => {
  for (const path of [
    "app/[locale]/short-trips/[origin]/page.tsx",
    "app/[locale]/meteor-showers/[year]/[slug]/page.tsx",
    "app/[locale]/gear/page.tsx",
    "app/[locale]/gear/[slug]/page.tsx",
  ]) {
    assert.doesNotMatch(source(path), /AffiliateDisclosure/);
  }

  for (const path of [
    "components/affiliate-activity-offers.tsx",
    "components/getyourguide-integration.tsx",
  ]) {
    assert.doesNotMatch(source(path), /AffiliateDisclosure/);
  }

  const destinationModules = source("components/affiliate-destination-modules.tsx");
  assert.equal((destinationModules.match(/<AffiliateDisclosure id=\{disclosureId\} locale=\{locale\}/g) ?? []).length, 1);
  assert.match(destinationModules, /hasAffiliateContent \? <AffiliateDisclosure id=\{disclosureId\} locale=\{locale\} \/> : null/);
  assert.match(destinationModules, /disclosureId=\{hasOffers \? disclosureId : undefined\}/);
  assert.match(destinationModules, /<AffiliateStaySearch destinationId=\{destinationId\}/);
  assert.ok(destinationModules.indexOf("<AffiliateDisclosure") < destinationModules.indexOf("<AffiliateActivityOffers"));
});
