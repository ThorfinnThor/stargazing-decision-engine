import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { validateShortTripScoringConfig, type ShortTripScoringConfig } from "../../lib/trips/short-trips.js";
import type { ShortTripFile } from "../../lib/data/types.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/short-trip.json");
const scoringConfig = readJson<ShortTripScoringConfig>(resolve(root, "data-config/trips/short-trip-scoring.json"));
validateShortTripScoringConfig(scoringConfig);
const directory = resolve(publicDataDir, "short-trips");
const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
const errors = files.flatMap((file) => {
  const value = readJson<ShortTripFile>(resolve(directory, file));
  const fileErrors: string[] = [];
  if (!validate?.(value)) fileErrors.push(JSON.stringify(validate?.errors ?? "short-trip schema missing"));
  if (value.entries.some((entry, index) => entry.rank !== index + 1)) fileErrors.push("ranks must be contiguous");
  if (value.entries.some((entry) => entry.distanceKm > value.maxShortTripKm)) fileErrors.push("entry exceeds origin distance limit");
  if (value.entries.some((entry) => Math.abs(entry.shortTripScore - (0.75 * entry.stargazingTripScore + 0.25 * entry.distanceUtility)) > 0.01)) fileErrors.push("short-trip score is not reproducible");
  return fileErrors.map((error) => `${directory}/${file}: ${error}`);
});
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} static short-trip file(s).`);
}
