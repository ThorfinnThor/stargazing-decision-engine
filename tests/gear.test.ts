import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { validateGearCatalog } from "../lib/gear/gear.js";
import type { GearCategory, GearGuide, GearProductMetadata } from "../lib/data/types.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const categories = read<GearCategory[]>("data-config/gear/categories.json");
const guides = read<GearGuide[]>("data-config/gear/guides.json");
const products = read<GearProductMetadata[]>("data-config/gear/products.json");

test("gear catalog validates as specification analysis with dormant affiliate hooks", () => {
  assert.doesNotThrow(() => validateGearCatalog(categories, guides, products));
  assert.equal(categories.length, 10);
  assert.equal(guides.length, 10);
  assert.ok(guides.every((guide) => guide.buyingCriteria.length >= 3));
  assert.ok(guides.every((guide) => guide.items.length >= 2));
  assert.ok(guides.every((guide) => guide.faq.length >= 2));
  assert.ok(guides.every((guide) => guide.lastReviewedAt === "2026-08-28"));
  assert.ok(guides.every((guide) => guide.items.every((item) => item.recommendationBasis === "specification_analysis" && item.affiliatePartnerId === null)));
  assert.ok(products.every((product) => product.affiliatePartnerId === null));
});

test("the beginner telescope comparison is source-backed", () => {
  const guide = guides.find((candidate) => candidate.slug === "beginner-telescopes");
  assert.ok(guide);
  assert.equal(guide.items.length, 3);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => source?.checkedAt === "2026-08-28"));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Sky-Watcher", "Bresser", "Celestron"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("the 8x42 binocular comparison is source-backed and fully localized", () => {
  const guide = guides.find((candidate) => candidate.slug === "binoculars");
  assert.ok(guide);
  assert.equal(guide.items.length, 3);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => source?.checkedAt === "2026-08-28"));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Nikon", "Vortex Optics", "Celestron"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("the red-light headlamp comparison is source-backed and fully localized", () => {
  const guide = guides.find((candidate) => candidate.slug === "red-flashlights");
  assert.ok(guide);
  assert.equal(guide.items.length, 3);

  const sources = guide.items.map((item) => item.source);
  assert.ok(sources.every((source) => source !== undefined));
  assert.ok(sources.every((source) => source?.url.startsWith("https://")));
  assert.ok(sources.every((source) => source?.checkedAt === "2026-08-28"));
  assert.deepEqual(
    sources.map((source) => source?.publisher),
    ["Petzl", "Black Diamond", "NITECORE"],
  );
  assert.ok(guide.items.every((item) => item.localizedCoreSpecs?.en && item.localizedCoreSpecs.de));
  assert.ok(guide.items.every((item) => item.affiliatePartnerId === null));
});

test("gear validation rejects unsupported hands-on claims", () => {
  const invalid = structuredClone(guides);
  invalid[0].items[0].recommendationBasis = "hands_on_test" as never;
  assert.throws(() => validateGearCatalog(categories, invalid, products), /specification-only/i);
});
