import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { Destination, ObservationSite } from "../lib/data/types.js";
import { buildGearAliasRedirects, buildLegacyAffiliateRedirects, parseRedirects, serializeRedirects, validateRedirectRules } from "../lib/seo/redirects.js";
import { circularNeighbours, destinationAnchors, localeCounterpartPath, selectDestinationsForGearGuide, selectGearGuidesForDestination, selectRelatedDestinations } from "../lib/seo/internal-links.js";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

function destination(id: string, overrides: Partial<Destination> = {}): Destination {
  return {
    id, slug: id, name: id, countryCode: "US", countryName: "United States", continent: "north-america", regionSlugs: [], timezone: "UTC",
    active: true, priority: 1, tags: [], observationSiteIds: [`${id}-site`], stayAreaIds: [], affiliateQuery: id, ...overrides,
  };
}

function site(destinationId: string, lat: number, lon: number): ObservationSite {
  return { id: `${destinationId}-site`, slug: `${destinationId}-site`, destinationId, name: destinationId, lat, lon, elevationM: null, siteType: "park", publicAccess: "yes", accessScore: null, active: true, priority: 1, certificationIds: [] };
}

test("gear category slugs that differ from their guide slug redirect permanently in every locale", () => {
  const rules = buildGearAliasRedirects(["en", "de"], {
    categories: [{ id: "smartphone-adapters", slug: "smartphone-adapters" }, { id: "binoculars", slug: "binoculars" }],
    guides: [{ slug: "smartphone-telescope-adapters", category: "smartphone-adapters" }, { slug: "binoculars", category: "binoculars" }],
  });
  assert.deepEqual(rules.map((rule) => `${rule.from} ${rule.to} ${rule.status}`), [
    "/en/gear/smartphone-adapters/ /en/gear/smartphone-telescope-adapters/ 301",
    "/en/gear/smartphone-adapters /en/gear/smartphone-telescope-adapters/ 301",
    "/de/gear/smartphone-adapters/ /de/gear/smartphone-telescope-adapters/ 301",
    "/de/gear/smartphone-adapters /de/gear/smartphone-telescope-adapters/ 301",
  ]);
});

test("removed affiliate redirects point to their destination and never shadow live /go/ routes", () => {
  const rules = buildLegacyAffiliateRedirects([
    { from: "/go/viator-activities/offer/old/", destinationSlug: "atacama" },
    { from: "/go/booking-stay-search/atacama/", destinationSlug: "atacama" },
  ], { activeRedirectPaths: new Set(["/go/booking-stay-search/atacama/"]), destinationSlugs: new Set(["atacama"]), locale: "en" });
  assert.deepEqual(rules.map((rule) => [rule.from, rule.to]), [["/go/viator-activities/offer/old/", "/en/stargazing-destinations/atacama/"]]);
  assert.throws(() => buildLegacyAffiliateRedirects([{ from: "/go/x/", destinationSlug: "nowhere" }], { activeRedirectPaths: new Set(), destinationSlugs: new Set(), locale: "en" }));
});

test("redirect files round-trip and validation catches missing targets, shadowed pages and chains", () => {
  const text = serializeRedirects([
    { from: "/", to: "/en/", status: 301, reason: "" },
    { from: "/en/gear/old/", to: "/en/gear/new/", status: 301, reason: "" },
  ]);
  assert.equal(text, "/ /en/ 301\n/en/gear/old/ /en/gear/new/ 301\n");
  const rules = parseRedirects(`# comment\n${text}/en/live/ /en/missing/ 302\n/a/ /en/gear/old/ 301\n`);
  const exported = new Set(["/", "/en/", "/en/gear/new/", "/en/live/"]);
  const problems = validateRedirectRules(rules, (path) => exported.has(path));
  assert.deepEqual(problems.map((item) => `${item.from}:${item.problem}`).sort(), [
    "/a/:redirect-chain",
    "/a/:target-missing",
    "/en/live/:not-permanent",
    "/en/live/:source-shadows-exported-page",
    "/en/live/:target-missing",
  ]);
  assert.throws(() => serializeRedirects([{ from: "/x/", to: "/y/", status: 301, reason: "" }, { from: "/x/", to: "/z/", status: 301, reason: "" }]));
});

test("committed _redirects contains the reported smartphone adapter fix and every legacy affiliate path", () => {
  const rules = parseRedirects(read("public/_redirects"));
  const bySource = new Map(rules.map((rule) => [rule.from, rule]));
  for (const locale of ["en", "de"]) {
    assert.equal(bySource.get(`/${locale}/gear/smartphone-adapters/`)?.to, `/${locale}/gear/smartphone-telescope-adapters/`);
  }
  const legacy = JSON.parse(read("data-config/seo/legacy-affiliate-redirects.json")) as { paths: Array<{ from: string }> };
  const active = new Set((JSON.parse(read("public/go/manifest.json")) as { entries: Array<{ path: string }> }).entries.map((entry) => entry.path));
  for (const entry of legacy.paths) assert.equal(bySource.has(entry.from), !active.has(entry.from), entry.from);
  assert.ok(rules.every((rule) => rule.status === 301));
  assert.ok(rules.length < 2000, "Cloudflare static redirect limit");
});

test("robots disallows the affiliate redirect prefix for every crawler group", () => {
  const robots = read("app/robots.ts");
  assert.match(robots, /const affiliateRedirectPrefix = "\/go\/"/);
  assert.match(robots, /disallow: affiliateRedirectPrefix/);
});

test("score scale is not emitted as a crawlable /100 string", () => {
  const summary = read("components/destination-decision-summary.tsx");
  assert.doesNotMatch(summary, />\/100</);
  assert.match(read("app/globals.css"), /\.destination-score-scale::before \{ content: "\/"; \}/);
});

test("related destinations prefer nearby places and spread links instead of repeating top priorities", () => {
  const destinations = [
    destination("a"),
    destination("near", { priority: 99 }),
    destination("far", { priority: 1 }),
    destination("abroad", { countryCode: "CA", countryName: "Canada" }),
  ];
  const sites = [site("a", 40, -100), site("near", 40.5, -100), site("far", 40, -80), site("abroad", 41, -100)];
  const anchors = destinationAnchors(destinations, sites);
  assert.deepEqual(selectRelatedDestinations(destinations[0], destinations, anchors, 3).map((item) => item.id), ["near", "abroad", "far"]);
});

test("gear selection follows destination tags with a stable fallback, and reverses for gear pages", () => {
  const guides = ["dew-control", "portable-power", "red-flashlights", "binoculars", "observing-chairs", "star-trackers"];
  assert.deepEqual(selectGearGuidesForDestination({ tags: ["coast", "island", "remote"] }, guides).map((item) => item.slug), ["dew-control", "portable-power", "red-flashlights"]);
  assert.deepEqual(selectGearGuidesForDestination({ tags: [] }, guides).map((item) => item.slug), ["red-flashlights", "binoculars", "observing-chairs"]);
  const coastal = destination("coastal", { tags: ["coast", "maritime"] });
  const inland = destination("inland", { tags: ["desert"] });
  assert.deepEqual(selectDestinationsForGearGuide("dew-control", [inland, coastal], guides).map((item) => item.id), ["coastal"]);
});

test("circular neighbours give every item the same number of sibling links", () => {
  assert.deepEqual(circularNeighbours(["a", "b", "c", "d"], 3, 2), ["a", "b"]);
  assert.deepEqual(circularNeighbours(["a", "b"], 0, 5), ["b"]);
});

test("locale switcher targets the translated page and falls back for English-only sections", () => {
  assert.equal(localeCounterpartPath("/en/stargazing-destinations/atacama/", "de"), "/de/stargazing-destinations/atacama/");
  assert.equal(localeCounterpartPath("/de/gear/binoculars/", "en"), "/en/gear/binoculars/");
  assert.equal(localeCounterpartPath("/en/blog/some-post/", "de"), "/de/");
  assert.equal(localeCounterpartPath("/", "de"), "/de/");
  assert.equal(localeCounterpartPath("/en/", "en"), "/en/");
});
