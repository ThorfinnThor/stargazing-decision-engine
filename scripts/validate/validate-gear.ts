import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { validateAstroshopProductMatches } from "../../lib/affiliate/affiliate.js";
import { validateGearCatalog } from "../../lib/gear/gear.js";
import type { AstroshopProductMatch, GearCategory, GearGuide, GearProductMetadata } from "../../lib/data/types.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const categories = readJson<GearCategory[]>(resolve(root, "data-config/gear/categories.json"));
const guides = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));
const products = readJson<GearProductMetadata[]>(resolve(root, "data-config/gear/products.json"));
const astroshopMatches = readJson<AstroshopProductMatch[]>(resolve(root, "data-config/gear/astroshop-product-matches.json"));
validateGearCatalog(categories, guides, products);
validateAstroshopProductMatches(astroshopMatches, guides);
const ajv = createSchemaValidator();
const errors: string[] = [];
const categoryValidate = ajv.getSchema("https://stargazing.local/schema/gear-category.json");
const productValidate = ajv.getSchema("https://stargazing.local/schema/gear-product.json");
const guideValidate = ajv.getSchema("https://stargazing.local/schema/gear-guide.json");
if (!categoryValidate?.(categories)) errors.push("gear categories schema failed");
if (!productValidate?.(products)) errors.push("gear products schema failed");
const guideDirectory = resolve(publicDataDir, "gear/guides");
if (!existsSync(guideDirectory)) errors.push("published gear guide directory is missing");
else for (const file of readdirSync(guideDirectory).filter((item) => item.endsWith(".json"))) {
  if (!guideValidate?.(readJson<GearGuide>(resolve(guideDirectory, file)))) errors.push(`gear guide schema failed: ${file}`);
}
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log(`Validated ${categories.length} gear categories, ${guides.length} guides, ${products.length} product metadata records, and ${astroshopMatches.length} exact Astroshop matches.`);
