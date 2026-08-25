import assert from "node:assert/strict";
import test from "node:test";

import type { Destination, ObservationSite } from "../lib/data/types.js";
import { buildHomepageSkyCandidates } from "../lib/astronomy/homepage-candidates.js";
import { createSkyLocation, resolvePrimaryObservationSite } from "../lib/astronomy/primary-site.js";
import { buildDestinationSkyHref } from "../lib/astronomy/navigation.js";
import { resolveDestinationPreview } from "../lib/astronomy/previews.js";
import { roundedCurrentMinuteIso, selectDarknessTier, selectHomepageSky, selectRandomItem, shouldKeepLiveSelection } from "../lib/astronomy/selection.js";
import type { HomepageSkyCandidate, NightPreview } from "../lib/astronomy/types.js";

const destination = (overrides: Partial<Destination> = {}): Destination => ({ id: "d1", slug: "sample", name: "Sample", countryCode: "DE", countryName: "Germany", continent: "Europe", regionSlugs: [], timezone: "Europe/Berlin", active: true, priority: 10, tags: [], observationSiteIds: ["s2", "s1"], stayAreaIds: [], affiliateQuery: "", ...overrides });
const site = (overrides: Partial<ObservationSite> = {}): ObservationSite => ({ id: "s1", slug: "site", destinationId: "d1", name: "Site", lat: 52.72, lon: 12.28, elevationM: 45, siteType: "park", publicAccess: "yes", accessScore: 80, active: true, priority: 10, certificationIds: [], ...overrides });
const preview = (overrides: Partial<NightPreview> = {}): NightPreview => ({ id: "sample-night-2027", destinationId: "d1", destinationSlug: "sample", siteId: "s1", instantIso: "2027-01-01T00:00:00.000Z", sunAltitudeDeg: -20, minimumVisibleStarCount: 1000, generatedAt: "2026-08-25T00:00:00.000Z", generatorVersion: "test", ...overrides });

test("primary site respects declared order and homepage access eligibility", () => {
  const sites = [site(), site({ id: "s2", slug: "closed", name: "Closed", priority: 20, publicAccess: "no" })];
  assert.equal(resolvePrimaryObservationSite(destination(), sites)?.id, "s2");
  assert.equal(resolvePrimaryObservationSite(destination(), sites, { requireHomepageEligibility: true }), null);
  assert.equal(createSkyLocation(destination(), sites[0])?.timeZone, "Europe/Berlin");
});

test("primary site skips unusable declared sites and has a deterministic fallback", () => {
  const active = site({ id: "active", priority: 5 });
  const candidates = [
    site({ id: "inactive", active: false, priority: 100 }),
    site({ id: "invalid", lat: 100, priority: 90 }),
    active,
    site({ id: "fallback-b", priority: 30 }),
    site({ id: "fallback-a", priority: 30 }),
  ];
  assert.equal(resolvePrimaryObservationSite(destination({ observationSiteIds: ["inactive", "invalid", "active"] }), candidates)?.id, "active");
  assert.equal(resolvePrimaryObservationSite(destination({ observationSiteIds: ["missing"] }), candidates)?.id, "fallback-a");
  assert.equal(resolvePrimaryObservationSite(destination({ observationSiteIds: ["active"] }), candidates, { requireHomepageEligibility: true })?.id, "active");
  assert.equal(createSkyLocation(destination({ timezone: "Invalid/Timezone" }), active), null);
});

test("homepage candidate builder is deterministic, localized, unique, and serializable", () => {
  const candidates = buildHomepageSkyCandidates({ destinations: [destination()], sites: [site()], locale: "de", previews: [preview()] });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].destinationHref, "/de/stargazing-destinations/sample/");
  assert.doesNotThrow(() => JSON.stringify(candidates));
});

test("candidate builder fails closed and keeps only matching previews", () => {
  const valid = destination({ priority: 5 });
  const second = destination({ id: "d2", slug: "second", name: "Second", priority: 20, observationSiteIds: ["s2"] });
  const records = [
    valid,
    { ...valid },
    destination({ id: "inactive", slug: "inactive", active: false }),
    destination({ id: "bad-zone", slug: "bad-zone", timezone: "Invalid/Timezone", observationSiteIds: ["bad-zone-site"] }),
    destination({ id: "no-site", slug: "no-site", observationSiteIds: [] }),
    second,
  ];
  const sites = [site(), site({ id: "s2", destinationId: "d2", name: "Second Site" }), site({ id: "bad-zone-site", destinationId: "bad-zone" })];
  const previews = [
    preview(),
    preview({ id: "foreign", destinationId: "d2", destinationSlug: "second", siteId: "s2" }),
    preview({ id: "wrong-site", siteId: "other" }),
  ];
  const candidates = buildHomepageSkyCandidates({ destinations: records, sites, locale: "en", previews });
  assert.deepEqual(candidates.map((item) => item.location.destinationId), ["d2", "d1"]);
  assert.deepEqual(candidates.find((item) => item.location.destinationId === "d1")?.previewIds, ["sample-night-2027"]);
  assert.equal(new Set(candidates.map((item) => item.location.destinationId)).size, candidates.length);
});

test("random selection uses the injected unit interval without mutating input", () => {
  const values = Object.freeze(["a", "b", "c", "d"]);
  assert.equal(selectRandomItem(values, 0), "a");
  assert.equal(selectRandomItem(values, 0.25), "b");
  assert.equal(selectRandomItem(values, 0.5), "c");
  assert.equal(selectRandomItem(values, 0.999999), "d");
  assert.equal(selectRandomItem([], 0.5), null);
  assert.throws(() => selectRandomItem(values, 1));
  assert.deepEqual(values, ["a", "b", "c", "d"]);
});

test("homepage selection prefers dark live candidates and falls back to validated preview", () => {
  const darkLocation = createSkyLocation(destination(), site())!;
  const darkCandidate: HomepageSkyCandidate = { id: "d1:s1", destinationHref: "/en/stargazing-destinations/sample/", location: darkLocation, previewIds: [preview().id] };
  const live = selectHomepageSky({ candidates: [darkCandidate], previews: [preview()], instantIso: "2027-01-01T00:00:00.000Z", locationRandomUnit: 0, previewRandomUnit: 0 });
  assert.equal(live?.mode, "live-night");
  const day = selectHomepageSky({ candidates: [darkCandidate], previews: [preview()], instantIso: "2027-06-21T12:00:00.000Z", locationRandomUnit: 0, previewRandomUnit: 0 });
  assert.equal(day?.mode, "night-preview");
  const failedLiveEvaluation = selectHomepageSky({ candidates: [darkCandidate], previews: [preview()], instantIso: "not-an-instant", locationRandomUnit: 0, previewRandomUnit: 0 });
  assert.equal(failedLiveEvaluation?.mode, "night-preview");
});

test("darkness tiers prefer astronomical night and include documented boundaries", () => {
  const evaluated = [
    { id: "day", sunAltitudeDeg: 8 },
    { id: "tier-2", sunAltitudeDeg: -17.999 },
    { id: "tier-1-boundary", sunAltitudeDeg: -18 },
    { id: "tier-1", sunAltitudeDeg: -24 },
  ];
  assert.deepEqual(selectDarknessTier(evaluated).map((item) => item.id), ["tier-1-boundary", "tier-1"]);
  assert.deepEqual(selectDarknessTier(evaluated.slice(0, 2)).map((item) => item.id), ["tier-2"]);
  assert.deepEqual(selectDarknessTier([{ id: "boundary", sunAltitudeDeg: -12 }]).map((item) => item.id), ["boundary"]);
  assert.deepEqual(selectDarknessTier([{ id: "too-bright", sunAltitudeDeg: -11.999 }]), []);
});

test("current time helper is stable within a minute and advances on the boundary", () => {
  assert.equal(roundedCurrentMinuteIso(Date.parse("2027-01-01T00:00:59.999Z")), "2027-01-01T00:00:00.000Z");
  assert.equal(roundedCurrentMinuteIso(Date.parse("2027-01-01T00:01:00.000Z")), "2027-01-01T00:01:00.000Z");
});

test("live selection hysteresis keeps through minus ten degrees and then reselects", () => {
  assert.equal(shouldKeepLiveSelection(-10.001), true);
  assert.equal(shouldKeepLiveSelection(-10), true);
  assert.equal(shouldKeepLiveSelection(-9.999), false);
  assert.equal(shouldKeepLiveSelection(Number.NaN), false);
});

test("navigation and preview resolver preserve destination and reject cross-destination IDs", () => {
  assert.equal(buildDestinationSkyHref({ baseHref: "/de/stargazing-destinations/sample/", mode: "live-night" }), "/de/stargazing-destinations/sample/#night-sky");
  assert.equal(buildDestinationSkyHref({ baseHref: "/de/stargazing-destinations/sample/", mode: "night-preview", previewId: "a b" }), "/de/stargazing-destinations/sample/?skyPreview=a%20b#night-sky");
  const location = createSkyLocation(destination(), site())!;
  assert.equal(resolveDestinationPreview({ previewId: preview().id, previews: [preview()], location })?.id, preview().id);
  assert.equal(resolveDestinationPreview({ previewId: preview().id, previews: [preview({ destinationId: "other" })], location }), null);
});
