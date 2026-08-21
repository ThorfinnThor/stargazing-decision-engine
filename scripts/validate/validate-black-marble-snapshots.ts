import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { BlackMarbleSnapshot } from "../../lib/darkness/black-marble/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

export function validateBlackMarbleSnapshot(snapshot: BlackMarbleSnapshot) {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/black-marble-snapshot.json");
  const errors = validate?.(snapshot) ? [] : [JSON.stringify(validate?.errors ?? "schema missing")];
  if (snapshot.blackMarbleYears.length !== new Set(snapshot.blackMarbleYears).size) errors.push("baseline years must be unique");
  if (!snapshot.baselineOverrideUsed && snapshot.blackMarbleYears.length !== 3) errors.push("non-override baseline must contain three years");
  if (!snapshot.coverageOverrideUsed && snapshot.coverage < 0.7) errors.push("coverage below 0.70 requires explicit override");
  if (snapshot.rings.length !== 4 || new Set(snapshot.rings.map((ring) => ring.id)).size !== 4) errors.push("snapshot must contain four unique rings");
  for (const ring of snapshot.rings) {
    if (ring.coverage !== Math.min(...ring.years.map((year) => year.coverage))) errors.push(`${ring.id}: aggregate coverage is not the minimum yearly coverage`);
    if (ring.years.length !== snapshot.blackMarbleYears.length) errors.push(`${ring.id}: yearly metrics do not match baseline`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = resolve(root, "data-snapshots/black-marble");
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = files.flatMap((file) =>
    validateBlackMarbleSnapshot(readJson<BlackMarbleSnapshot>(resolve(directory, file))).map((error) => `${file}: ${error}`));
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} committed Black Marble snapshot(s).`);
  }
}
