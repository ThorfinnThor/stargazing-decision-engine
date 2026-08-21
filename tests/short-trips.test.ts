import assert from "node:assert/strict";
import test from "node:test";

import { buildShortTripFiles, shortTripDistance, validateShortTripScoringConfig, type ShortTripScoringConfig } from "../lib/trips/short-trips.js";
import type { Destination, MonthlySiteScore, ObservationSite, OriginCity, StayArea } from "../lib/data/types.js";

const scoringConfig: ShortTripScoringConfig = {
  version: 1,
  weights: { stargazingTrip: 0.75, distance: 0.25 },
  distanceBands: [
    { id: "near", maxKm: 100, utility: 100 },
    { id: "regional", maxKm: 250, utility: 85 },
    { id: "weekend", maxKm: 500, utility: 60 },
    { id: "long-weekend", maxKm: 800, utility: 30 },
    { id: "far", maxKm: null, utility: 0 },
  ],
  excludedPublicAccess: "no",
};

const origin: OriginCity = { id: "origin", slug: "origin", name: "Origin", countryCode: "DE", lat: 0, lon: 0, active: true, maxShortTripKm: 1_000 };
const destination: Destination = {
  id: "destination", slug: "destination", name: "Destination", countryCode: "DE", countryName: "Germany", continent: "Europe", regionSlugs: [], timezone: "Europe/Berlin", active: true, priority: 1, tags: [], observationSiteIds: ["public-site", "closed-site"], stayAreaIds: ["stay"], affiliateQuery: "Destination",
};
const publicSite: ObservationSite = { id: "public-site", slug: "public-site", destinationId: "destination", name: "Public site", lat: 0, lon: 0.5, elevationM: null, siteType: "plain", publicAccess: "yes", accessScore: 80, active: true, priority: 1, certificationIds: [] };
const closedSite: ObservationSite = { ...publicSite, id: "closed-site", slug: "closed-site", name: "Closed site", lat: 0, lon: 0.01, publicAccess: "no", priority: 100 };
const stayArea: StayArea = { id: "stay", destinationId: "destination", name: "Stay area", lat: 0, lon: 0.5, affiliateQuery: "Destination stay", observationSiteIds: ["public-site"] };
const scores: MonthlySiteScore[] = Array.from({ length: 12 }, (_, index) => ({
  siteId: "public-site", month: (index + 1) as MonthlySiteScore["month"], skyQuality: 70, tripComfort: 70, stargazingTrip: index === 6 ? 90 : 60, clearSkyScore: 70, darknessScore: 70, dewScore: 70, elevationScore: 70, temperatureComfortScore: 70, windComfortScore: 70, rainComfortScore: 70, accessScore: 80, confidenceScore: 35, confidenceLevel: "low", reasons: [], caveats: [],
}));

test("short-trip distance bands are deterministic at boundaries", () => {
  validateShortTripScoringConfig(scoringConfig);
  assert.deepEqual(shortTripDistance(100, scoringConfig), { band: "near", utility: 100 });
  assert.deepEqual(shortTripDistance(100.01, scoringConfig), { band: "regional", utility: 85 });
  assert.deepEqual(shortTripDistance(801, scoringConfig), { band: "far", utility: 0 });
});

test("short-trip ranking excludes private sites and reproduces weighted score", () => {
  const [file] = buildShortTripFiles({ origins: [origin], destinations: [destination], sites: [publicSite, closedSite], stayAreas: [stayArea], scores, scoringConfig, generatedAt: "2026-08-20T00:00:00.000Z" });
  assert.ok(file);
  assert.equal(file.entries.length, 1);
  const [entry] = file.entries;
  assert.equal(entry.bestSiteId, "public-site");
  assert.equal(entry.bestMonths[0].month, 7);
  assert.ok(Math.abs(entry.shortTripScore - (0.75 * entry.stargazingTripScore + 0.25 * entry.distanceUtility)) < 0.01);
  assert.equal(entry.stayArea?.id, "stay");
  assert.equal(entry.campingAvailable, null);
});
