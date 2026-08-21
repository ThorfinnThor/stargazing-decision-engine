import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { createSchemaValidator, readPublishedManifest } from "./validate-schemas.js";
import { publicDataDir } from "../pipeline/io.js";
import { execFileSync } from "node:child_process";

const ajv = createSchemaValidator();
const errors: string[] = [];
const validateManifest = ajv.getSchema("https://stargazing.local/schema/manifest.json");
if (!validateManifest || !validateManifest(readPublishedManifest())) errors.push("manifest.json does not satisfy its schema");

const destinationSchema = ajv.getSchema("https://stargazing.local/schema/destination.json");
const siteSchema = ajv.getSchema("https://stargazing.local/schema/site.json");
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
for (const country of readdirSync(resolve(publicDataDir, "sites"))) {
  const directory = resolve(publicDataDir, "sites", country);
  if (statSync(directory).isDirectory()) validateFiles(directory, siteSchema, "Site");
}

try {
  execFileSync("pnpm", ["data:seed:validate"], { stdio: "pipe" });
  execFileSync("pnpm", ["data:shorttrips:validate"], { stdio: "pipe" });
  execFileSync("pnpm", ["data:seo:validate"], { stdio: "pipe" });
  execFileSync("pnpm", ["data:affiliate:validate"], { stdio: "pipe" });
  execFileSync("pnpm", ["data:gear:validate"], { stdio: "pipe" });
  execFileSync("pnpm", ["data:images:validate"], { stdio: "pipe" });
} catch {
  errors.push("seed config validation failed");
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("Validated published seed JSON and manifest.");
}
