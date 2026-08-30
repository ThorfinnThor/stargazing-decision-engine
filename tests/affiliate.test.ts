import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildAffiliateActivityUrl, buildAffiliateUrl, validateAffiliateActivityOffers, validateAffiliateConfig } from "../lib/affiliate/affiliate.js";
import type { AffiliateActivityOfferConfig, AffiliateConfig, Destination, LocationTour } from "../lib/data/types.js";

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

test("disabled affiliate partners cannot produce a CTA URL", () => {
  validateAffiliateConfig(config);
  assert.equal(buildAffiliateUrl(config, "stay-search", destination), null);
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

test("GetYourGuide automatic widget requires an allow-listed HTTPS script", () => {
  const partners: AffiliateConfig = {
    version: 1,
    partners: [{
      id: "getyourguide-activities", name: "GetYourGuide", type: "activity", enabled: true, affiliateId: "BKWM9K1", destinationSearchEnabled: false,
      widget: { type: "auto", enabled: true, campaign: "Stargazing", scriptUrl: "https://widget.getyourguide.com/dist/pa.umd.production.min.js", destinationIds: ["la-palma"] },
      urlTemplate: null, allowedHosts: ["www.getyourguide.com", "widget.getyourguide.com"], requiredQueryParameters: ["partner_id"], disclosure: { en: "Disclosure", de: "Hinweis" },
    }],
  };
  assert.doesNotThrow(() => validateAffiliateConfig(partners));
  assert.throws(() => validateAffiliateConfig({
    ...partners,
    partners: [{ ...partners.partners[0], widget: { ...partners.partners[0].widget!, scriptUrl: "https://tracking.example/widget.js" } }],
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

test("reviewed GetYourGuide catalog contains only the approved direct stargazing offers", () => {
  const actual = JSON.parse(readFileSync("data-config/sources/affiliate-activity-offers.json", "utf8")) as AffiliateActivityOfferConfig;
  const getYourGuideOffers = actual.offers.filter((offer) => offer.partnerId === "getyourguide-activities" && offer.enabled);
  const expectedDestinations = [
    "alqueva",
    "aoraki-mackenzie",
    "atacama",
    "canyonlands",
    "death-valley",
    "elqui-valley",
    "hanle",
    "jasper",
    "la-palma",
    "mauna-kea",
    "tenerife",
    "uluru",
  ];

  assert.deepEqual(getYourGuideOffers.map((offer) => offer.destinationId).sort(), expectedDestinations);
  for (const offer of getYourGuideOffers) {
    const url = new URL(offer.urlTemplate.replace("{affiliateId}", "BKWM9K1"));
    assert.equal(url.hostname, "www.getyourguide.com");
    assert.equal(url.searchParams.get("partner_id"), "BKWM9K1");
    assert.equal(url.searchParams.get("utm_medium"), "online_publisher");
    assert.equal(url.searchParams.get("cmp"), "Stargazing");
    assert.match(url.pathname, /-t\d+\/$/);
  }
});
