import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { BlackMarbleConfig, BlackMarbleSnapshot } from "../../lib/darkness/black-marble/types.js";
import type { ObservationSite } from "../../lib/data/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

export function validateBlackMarbleSnapshot(snapshot: BlackMarbleSnapshot, config?: BlackMarbleConfig) {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/black-marble-snapshot.json");
  const errors = validate?.(snapshot) ? [] : [JSON.stringify(validate?.errors ?? "schema missing")];
  if (snapshot.blackMarbleYears.length !== new Set(snapshot.blackMarbleYears).size) errors.push("baseline years must be unique");
  if (!snapshot.baselineOverrideUsed && snapshot.blackMarbleYears.length !== 3) errors.push("non-override baseline must contain three years");
  if (!snapshot.coverageOverrideUsed && snapshot.coverage < 0.7) errors.push("coverage below 0.70 requires explicit override");
  if (snapshot.coverageOverrideUsed) {
    if (!snapshot.warnings.some((warning) => warning.includes("Low-coverage override used"))) {
      errors.push("coverage override must be disclosed in warnings");
    }
    if (config) {
      const override = config.coverageOverrides.find((item) => item.siteId === snapshot.siteId);
      if (!override) errors.push("coverage override is not present in the reviewed site allowlist");
      else {
        if (snapshot.coverage < override.minimumCoverage) errors.push("coverage is below the reviewed site floor");
        if (!snapshot.warnings.some((warning) => warning.includes(override.reviewedAt) && warning.includes(override.reason))) {
          errors.push("coverage override review metadata is missing from warnings");
        }
      }
    }
  }
  if (snapshot.rings.length !== 4 || new Set(snapshot.rings.map((ring) => ring.id)).size !== 4) errors.push("snapshot must contain four unique rings");
  for (const ring of snapshot.rings) {
    if (ring.coverage !== Math.min(...ring.years.map((year) => year.coverage))) errors.push(`${ring.id}: aggregate coverage is not the minimum yearly coverage`);
    if (ring.years.length !== snapshot.blackMarbleYears.length) errors.push(`${ring.id}: yearly metrics do not match baseline`);
  }
  return errors;
}

export function validateBlackMarbleConfig(config: BlackMarbleConfig, siteIds: Set<string>) {
  const errors: string[] = [];
  const overrideIds = config.coverageOverrides.map((item) => item.siteId);
  if (overrideIds.length !== new Set(overrideIds).size) errors.push("coverage override site IDs must be unique");
  for (const override of config.coverageOverrides) {
    if (!siteIds.has(override.siteId)) errors.push(`${override.siteId}: coverage override references an unknown site`);
    if (!(override.minimumCoverage >= 0 && override.minimumCoverage < config.coverageErrorMin)) {
      errors.push(`${override.siteId}: minimum coverage must be below the global error threshold`);
    }
    if (override.reason.trim().length < 20) errors.push(`${override.siteId}: coverage override reason is too short`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(override.reviewedAt)) errors.push(`${override.siteId}: reviewedAt must be YYYY-MM-DD`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = resolve(root, "data-snapshots/black-marble");
  const config = readJson<BlackMarbleConfig>(resolve(root, "data-config/sources/black-marble.json"));
  const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = validateBlackMarbleConfig(config, new Set(sites.map((site) => site.id))).concat(
    files.flatMap((file) =>
      validateBlackMarbleSnapshot(readJson<BlackMarbleSnapshot>(resolve(directory, file)), config)
        .map((error) => `${file}: ${error}`)),
  );
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} committed Black Marble snapshot(s).`);
  }
}
