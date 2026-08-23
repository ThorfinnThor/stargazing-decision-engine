import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { validateShortTripScoringConfig, type ShortTripScoringConfig } from "../../lib/trips/short-trips.js";
import { isTravelEligibleSite } from "../../lib/access/travel.js";
import type { ObservationSite, ShortTripFile } from "../../lib/data/types.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { loadRequiredRealScores } from "../pipeline/real-scores.js";
import { createSchemaValidator } from "./validate-schemas.js";

const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/short-trip.json");
const scoringConfig = readJson<ShortTripScoringConfig>(resolve(root, "data-config/trips/short-trip-scoring.json"));
validateShortTripScoringConfig(scoringConfig);
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const real = loadRequiredRealScores(sites);
const scoresBySite = new Map(sites.map((site) => [site.id, real.scores.filter((score) => score.siteId === site.id)]));
const directory = resolve(publicDataDir, "short-trips");
const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
const errors = files.flatMap((file) => {
  const value = readJson<ShortTripFile>(resolve(directory, file));
  const fileErrors: string[] = [];
  if (!validate?.(value)) fileErrors.push(JSON.stringify(validate?.errors ?? "short-trip schema missing"));
  if (value.entries.some((entry, index) => entry.rank !== index + 1)) fileErrors.push("ranks must be contiguous");
  if (value.entries.some((entry) => entry.distanceKm > value.maxShortTripKm)) fileErrors.push("entry exceeds origin distance limit");
  if (value.entries.some((entry) => Math.abs(entry.shortTripScore - (0.75 * entry.stargazingTripScore + 0.25 * entry.distanceUtility)) > 0.01)) fileErrors.push("short-trip score is not reproducible");
  if (value.generatedAt !== real.generatedAt) fileErrors.push("short-trip file is not generated from the latest real score snapshots");
  for (const entry of value.entries) {
    const site = sites.find((candidate) => candidate.id === entry.bestSiteId);
    if (!site || !isTravelEligibleSite(site)) fileErrors.push(`${entry.bestSiteId}: site is not eligible for travel rankings`);
    const expected = scoresBySite.get(entry.bestSiteId) ?? [];
    if (expected.length !== 12 || entry.monthlyStargazingTripScores.some((month) => {
      const score = expected.find((candidate) => candidate.month === month.month);
      return !score || score.stargazingTrip !== month.score || score.confidenceLevel !== month.confidenceLevel;
    })) fileErrors.push(`${entry.bestSiteId}: monthly values do not match real score snapshots`);
  }
  return fileErrors.map((error) => `${directory}/${file}: ${error}`);
});
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} static short-trip file(s).`);
}
