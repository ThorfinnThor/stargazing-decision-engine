import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

const root = process.cwd();
const schemaDir = resolve(root, "schemas");

export const schemaFiles = [
  "destination.schema.json",
  "site.schema.json",
  "monthly-climate.schema.json",
  "darkness.schema.json",
  "site-score.schema.json",
  "site-score-snapshot.schema.json",
  "destination-monthly.schema.json",
  "calendar.schema.json",
  "manifest.schema.json",
  "ranking.schema.json",
  "comparison.schema.json",
  "short-trip.schema.json",
  "seo-registry.schema.json",
  "affiliate-partners.schema.json",
  "affiliate-activity-offers.schema.json",
  "meteor-shower.schema.json",
  "search-index.schema.json",
  "gear-guide.schema.json",
  "gear-category.schema.json",
  "gear-product.schema.json",
  "destination-editorial-guide.schema.json",
  "image-manifest.schema.json",
  "era5-climate-snapshot.schema.json",
  "black-marble-snapshot.schema.json",
  "dem-snapshot.schema.json",
  "darkness-calibration.schema.json",
] as const;

export function readSchema(fileName: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(schemaDir, fileName), "utf8")) as Record<string, unknown>;
}

export function createSchemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  for (const fileName of schemaFiles) {
    ajv.addSchema(readSchema(fileName));
  }
  return ajv;
}

export function readPublishedManifest() {
  return JSON.parse(
    readFileSync(resolve(root, "public/data/stargazing/manifest.json"), "utf8"),
  ) as unknown;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/manifest.json");
  if (!validate || !validate(readPublishedManifest())) {
    console.error(validate?.errors ?? "Manifest schema was not registered");
    process.exitCode = 1;
  } else {
    console.log(`Validated ${schemaFiles.length} JSON schemas and the published manifest.`);
  }
}
