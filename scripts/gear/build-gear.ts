import { resolve } from "node:path";

import { validateAstroshopProductMatches } from "../../lib/affiliate/affiliate.js";
import { isGearGuideEditorialReady, validateGearCatalog } from "../../lib/gear/gear.js";
import type { AstroshopProductMatch, GearCategory, GearGuide, GearProductMetadata } from "../../lib/data/types.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const categories = readJson<GearCategory[]>(resolve(root, "data-config/gear/categories.json"));
const guides = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));
const products = readJson<GearProductMetadata[]>(resolve(root, "data-config/gear/products.json"));
const astroshopMatches = readJson<AstroshopProductMatch[]>(resolve(root, "data-config/gear/astroshop-product-matches.json"));
validateGearCatalog(categories, guides, products);
validateAstroshopProductMatches(astroshopMatches, guides);
writeJson(publicPath("gear/categories.json"), categories);
writeJson(publicPath("gear/products.json"), products);
for (const guide of guides) writeJson(publicPath(`gear/guides/${guide.slug}.json`), guide);
writeJson(publicPath("gear/index.json"), {
  version: 1,
  guides: guides.filter(isGearGuideEditorialReady).map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    summary: guide.summary,
    comparedProducts: guide.items.length,
    primarySources: guide.items.filter((item) => item.source).length,
    lastReviewedAt: guide.lastReviewedAt,
  })),
});
console.log(`Built ${categories.length} gear categories, ${guides.length} guides, ${products.length} static product metadata records, and ${astroshopMatches.length} exact Astroshop matches.`);
