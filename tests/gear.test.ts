import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { gearGuideEditorialIssues, isGearGuideEditorialReady, validateGearCatalog } from "../lib/gear/gear.js";
import type { GearCategory, GearGuide, GearProductMetadata } from "../lib/data/types.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const categories = read<GearCategory[]>("data-config/gear/categories.json");
const guides = read<GearGuide[]>("data-config/gear/guides.json");
const products = read<GearProductMetadata[]>("data-config/gear/products.json");

test("expanded catalog retains 52 distinct sourced products and synchronized public guides", () => {
  const added = read<{added: {guideSlug: string; productName: string; articleId: string; sourceUrl: string}[]}>("docs/gear-catalog-expansion-2026-09-09.json").added;
  assert.equal(added.length, 13);
  assert.equal(guides.flatMap(g => g.items).length, 52);
  assert.equal(new Set(guides.flatMap(g => g.items.map(i => i.name.en))).size, 52);
  const matches = read<{guideSlug: string; productName: string; path: string}[]>("data-config/gear/astroshop-product-matches.json");
  for (const entry of added) {
    const guide = guides.find(g => g.slug === entry.guideSlug);
    const item = guide?.items.find(i => i.name.en === entry.productName);
    assert.ok(item);
    assert.equal(item.source?.url, entry.sourceUrl);
    assert.equal(item.source?.checkedAt, "2026-09-09");
    assert.equal(guide?.lastReviewedAt, "2026-09-09");
    assert.ok(matches.find(m => m.guideSlug === entry.guideSlug && m.productName === entry.productName)?.path.endsWith("/p," + entry.articleId));
  }
  for (const guide of guides) {
    const published = read<GearGuide>("public/data/stargazing/gear/guides/" + guide.slug + ".json");
    assert.deepEqual(published, guide);
  }
});

test("gear catalog validates as specification analysis with dormant affiliate hooks", () => {
  assert.doesNotThrow(() => validateGearCatalog(categories, guides, products));
  assert.equal(categories.length, 13);
  assert.equal(guides.length, 13);
  assert.ok(guides.every((guide) => guide.buyingCriteria.length >= 3));
  assert.ok(guides.every((guide) => guide.items.length >= 2));
  assert.ok(guides.every((guide) => guide.faq.length >= 2));
  assert.ok(guides.every((guide) => /^(2026-08-(28|31)|2026-09-09)$/.test(guide.lastReviewedAt)));
  assert.ok(guides.every((guide) => guide.items.every((item) => item.recommendationBasis === "specification_analysis" && item.affiliatePartnerId === null)));
  assert.ok(products.every((product) => product.affiliatePartnerId === null));
});

test("the beginner telescope comparison is source-backed", () => {
  const guide = guides.find((candidate) => candidate.slug === "beginner-telescopes");
  assert.ok(guide);
  assert.equal(guide.items.length, 6);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => ["2026-08-28", "2026-09-09"].includes(source?.checkedAt ?? "")));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Sky-Watcher", "Bresser", "Celestron", "Astroshop / NIMAX", "Astroshop / NIMAX", "Astroshop / NIMAX"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("the 8x42 binocular comparison is source-backed and fully localized", () => {
  const guide = guides.find((candidate) => candidate.slug === "binoculars");
  assert.ok(guide);
  assert.equal(guide.items.length, 5);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => ["2026-08-28", "2026-09-09"].includes(source?.checkedAt ?? "")));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Nikon", "Vortex Optics", "Celestron", "Astroshop / NIMAX", "Astroshop / NIMAX"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("the red-light comparison includes headlamps and a dedicated torch", () => {
  const guide = guides.find((candidate) => candidate.slug === "red-flashlights");
  assert.ok(guide);
  assert.equal(guide.items.length, 4);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => ["2026-08-28", "2026-09-09"].includes(source?.checkedAt ?? "")));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Petzl", "Black Diamond", "NITECORE", "Astroshop / NIMAX"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("the tripod comparison is source-backed and fully localized", () => {
  const guide = guides.find((candidate) => candidate.slug === "tripods");
  assert.ok(guide);
  assert.equal(guide.items.length, 3);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => source?.checkedAt === "2026-08-28"));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Vortex Optics", "Celestron", "Manfrotto"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("gear validation rejects unsupported hands-on claims", () => {
  const invalid = structuredClone(guides);
  invalid[0].items[0].recommendationBasis = "hands_on_test" as never;
  assert.throws(() => validateGearCatalog(categories, invalid, products), /specification-only/i);
});

test("only fully sourced, comparison-depth gear guides are editorially ready", () => {
  const ready = guides.filter(isGearGuideEditorialReady);
  assert.deepEqual(ready.map((guide) => guide.slug), [
    "beginner-telescopes",
    "binoculars",
    "red-flashlights",
    "observing-chairs",
    "tripods",
    "star-trackers",
    "dew-control",
    "portable-power",
    "eyepieces",
    "astronomy-filters",
    "smartphone-telescope-adapters",
    "imx585-astronomy-cameras",
    "mounted-astronomy-binoculars",
  ]);
  assert.ok(ready.every((guide) => gearGuideEditorialIssues(guide).length === 0));
  assert.ok(guides.filter((guide) => !isGearGuideEditorialReady(guide)).every((guide) => gearGuideEditorialIssues(guide).includes("product-without-primary-source")));
});

test("source-backed comparisons cannot mix documented and undocumented products", () => {
  const invalid = structuredClone(guides);
  const guide = invalid.find((candidate) => candidate.slug === "star-trackers");
  assert.ok(guide);
  delete guide.items[0].source;
  assert.throws(() => validateGearCatalog(categories, invalid, products), /may not mix sourced and unsourced/i);
});
