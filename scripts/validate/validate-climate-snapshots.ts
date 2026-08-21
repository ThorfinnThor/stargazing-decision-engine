import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { Era5ClimateSnapshot } from "../../lib/climate/era5/types.js";
import { createSchemaValidator } from "./validate-schemas.js";
import { readJson, root } from "../pipeline/io.js";

export function validateEra5SnapshotInvariants(snapshot: Era5ClimateSnapshot) {
  const errors: string[] = [];
  if (snapshot.climateNormal.startYear !== 1991 || snapshot.climateNormal.endYear !== 2020) errors.push("climate normal must be exactly 1991–2020");
  const months = snapshot.months.map((month) => month.month);
  if (months.length !== 12 || new Set(months).size !== 12 || months.some((month) => month < 1 || month > 12)) errors.push("snapshot must contain 12 unique months");
  for (const month of snapshot.months) {
    if (month.clearHourProbability !== null && month.goodHourProbability !== null && month.clearHourProbability > month.goodHourProbability) errors.push(`month ${month.month}: clear-hour probability exceeds good-hour probability`);
    if (month.clearNightProbability !== null && month.goodNightProbability !== null && month.clearNightProbability > month.goodNightProbability) errors.push(`month ${month.month}: clear-night probability exceeds good-night probability`);
    if (month.nightTempP10C !== null && month.nightTempP90C !== null && month.nightTempP10C > month.nightTempP90C) errors.push(`month ${month.month}: P10 exceeds P90 temperature`);
  }
  return errors;
}

export function validateEra5Snapshot(snapshot: Era5ClimateSnapshot) {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/era5-climate-snapshot.json");
  const errors = validate?.(snapshot) ? [] : [JSON.stringify(validate?.errors ?? "schema missing")];
  return [...errors, ...validateEra5SnapshotInvariants(snapshot)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = resolve(root, "data-snapshots/climate");
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = files.flatMap((file) => validateEra5Snapshot(readJson<Era5ClimateSnapshot>(resolve(directory, file))).map((error) => `${file}: ${error}`));
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} committed ERA5 climate snapshot(s).`);
  }
}
