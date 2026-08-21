import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { DemSnapshot } from "../../lib/elevation/dem/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

export function validateDemSnapshot(snapshot: DemSnapshot) {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/dem-snapshot.json");
  const errors = validate?.(snapshot) ? [] : [JSON.stringify(validate?.errors ?? "schema missing")];
  if (snapshot.elevationM === null && snapshot.coverage > 0) errors.push("NoData elevation cannot have positive point coverage");
  if (snapshot.elevationM !== null && snapshot.coverage !== 1) errors.push("valid point elevation must have full point coverage");
  for (const neighborhood of snapshot.neighborhoods) {
    if (neighborhood.elevationM === null && neighborhood.validSampleCount > 0) errors.push(`radius ${neighborhood.radiusKm}: null median has valid samples`);
    if (neighborhood.elevationM !== null && neighborhood.validSampleCount === 0) errors.push(`radius ${neighborhood.radiusKm}: median has no valid samples`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = resolve(root, "data-snapshots/dem");
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = files.flatMap((file) => validateDemSnapshot(readJson<DemSnapshot>(resolve(directory, file))).map((error) => `${file}: ${error}`));
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} committed DEM snapshot(s).`);
  }
}
