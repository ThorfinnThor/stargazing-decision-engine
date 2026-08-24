import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, FinderDestination } from "../../lib/data/types.js";
import { createSchemaValidator, readPublishedManifest } from "./validate-schemas.js";
import { publicDataDir } from "../pipeline/io.js";

const ajv = createSchemaValidator();
const errors: string[] = [];
const validateManifest = ajv.getSchema("https://stargazing.local/schema/manifest.json");
if (!validateManifest || !validateManifest(readPublishedManifest())) errors.push("manifest.json does not satisfy its schema");

const destinationSchema = ajv.getSchema("https://stargazing.local/schema/destination.json");
const siteSchema = ajv.getSchema("https://stargazing.local/schema/site.json");
const destinationMonthlySchema = ajv.getSchema("https://stargazing.local/schema/destination-monthly.json");
const finderSchema = ajv.getSchema("https://stargazing.local/schema/search-index.json");
const validateFiles = (directory: string, schema: typeof destinationSchema, label: string) => {
  if (!schema) return;
  for (const entry of readdirSync(directory)) {
    const filePath = resolve(directory, entry);
    if (!statSync(filePath).isFile() || !entry.endsWith(".json") || entry === "index.json") continue;
    const valid = schema(JSON.parse(readFileSync(filePath, "utf8")));
    if (!valid) errors.push(`${label} ${entry} is invalid`);
  }
};

validateFiles(resolve(publicDataDir, "destinations"), destinationSchema, "Destination");
validateFiles(resolve(publicDataDir, "monthly/destinations"), destinationMonthlySchema, "Destination monthly summary");
for (const country of readdirSync(resolve(publicDataDir, "sites"))) {
  const directory = resolve(publicDataDir, "sites", country);
  if (statSync(directory).isDirectory()) validateFiles(directory, siteSchema, "Site");
}

const finderIndex = JSON.parse(readFileSync(resolve(publicDataDir, "search/destination-index.json"), "utf8")) as FinderDestination[];
const destinationIndex = JSON.parse(readFileSync(resolve(publicDataDir, "destinations/index.json"), "utf8")) as Destination[];
if (!finderSchema?.(finderIndex)) errors.push("Finder search index is invalid");
const finderIds = finderIndex.map((destination) => destination.id);
const destinationIds = destinationIndex.map((destination) => destination.id);
if (new Set(finderIds).size !== finderIds.length) errors.push("Finder search index contains duplicate destination IDs");
if (finderIds.length !== destinationIds.length || destinationIds.some((id) => !finderIds.includes(id))) {
  errors.push("Finder search index must contain every published destination exactly once");
}
for (const destination of finderIndex) {
  if (destination.monthly.length !== 12 || new Set(destination.monthly.map((month) => month.month)).size !== 12) errors.push(`${destination.id}: finder index requires 12 unique months`);
}

for (const validator of [
  "validate-seed-config.ts",
  "validate-short-trips.ts",
  "validate-seo.ts",
  "validate-affiliate.ts",
  "validate-gear.ts",
  "validate-images.ts",
]) {
  try {
    execFileSync(process.execPath, ["--import", "tsx", resolve(process.cwd(), "scripts/validate", validator)], { stdio: "pipe" });
  } catch {
    errors.push(`${validator}: composed public-data validation failed`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("Validated published static JSON and manifest.");
}
