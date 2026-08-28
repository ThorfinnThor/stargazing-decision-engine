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

test("gear validation rejects unsupported hands-on claims", () => {
  const invalid = structuredClone(guides);
  invalid[0].items[0].recommendationBasis = "hands_on_test" as never;
  assert.throws(() => validateGearCatalog(categories, invalid, products), /specification-only/i);
});
