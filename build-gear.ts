import { resolve } from "node:path";

import { validateGearCatalog } from "../../lib/gear/gear.js";
import type { GearCategory, GearGuide, GearProductMetadata } from "../../lib/data/types.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const categories = readJson<GearCategory[]>(resolve(root, "data-config/gear/categories.json"));
const guides = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));
const products = readJson<GearProductMetadata[]>(resolve(root, "data-config/gear/products.json"));
validateGearCatalog(categories, guides, products);
writeJson(publicPath("gear/categories.json"), categories);
writeJson(publicPath("gear/products.json"), products);
for (const guide of guides) writeJson(publicPath(`gear/guides/${guide.slug}.json`), guide);
console.log(`Built ${categories.length} gear categories, ${guides.length} guides, and ${products.length} static product metadata records.`);
