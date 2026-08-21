import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  calculateMeteorMoonScore,
  calculateMeteorRadiantScore,
  calculateMeteorViewingScore,
  validateMeteorShowerConfig,
  validateMeteorShowerScoringConfig,
  type MeteorShowerConfig,
  type MeteorShowerScoringConfig,
} from "../../lib/astronomy/meteor-showers.js";
import type { MeteorShowerEvent } from "../../lib/data/types.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/meteor-shower.json");

export function validateMeteorShowerEvent(value: MeteorShowerEvent, scoringConfig: MeteorShowerScoringConfig) {
  const errors: string[] = [];
  if (!validate?.(value)) errors.push(JSON.stringify(validate?.errors ?? "meteor-shower schema missing"));
  if (value.sourceYear !== value.year) errors.push("source year must match event year");
  if (value.climateContext.month !== Number(value.peakDate.slice(5, 7))) errors.push("climate context month must match peak month");
  if (value.peakUtc && !value.peakUtc.startsWith(value.peakDate)) errors.push("peak UTC and peak date disagree");
  if (value.activeStart > value.peakDate || value.peakDate > value.activeEnd) errors.push("peak date is outside active period");
  if (value.topSites.length === 0 || value.topDestinations.length === 0) errors.push("event requires top sites and destinations");
  if (value.topSites.some((row, index) => row.rank !== index + 1)) errors.push("top site ranks must be contiguous");
  if (value.topDestinations.some((row, index) => row.rank !== index + 1)) errors.push("top destination ranks must be contiguous");
  if (new Set(value.topDestinations.map((row) => row.destinationId)).size !== value.topDestinations.length) errors.push("top destinations must be unique");
  if (value.topSites.some((row) => row.moonConditions.moonlessHours > row.moonConditions.totalDarknessHours + 0.02)) errors.push("moonless hours exceed astronomical darkness");
  if (value.confidenceLevel === "low" && value.indexable) errors.push("low-confidence event must not be indexable");
  for (const row of [...value.topSites, ...value.topDestinations]) {
    const expectedMoon = calculateMeteorMoonScore(
      row.moonConditions.moonlessHours,
      row.moonConditions.totalDarknessHours,
      row.moonConditions.moonIlluminationFraction,
      scoringConfig,
    );
    if (Math.abs(expectedMoon - row.moonScore) > 0.01) errors.push(`${row.siteId}: Moon score is not reproducible`);
    const expectedRadiant = calculateMeteorRadiantScore(
      row.radiantConditions.darkRadiantHours,
      row.radiantConditions.maximumAltitudeDeg,
      scoringConfig,
    );
    if (Math.abs(expectedRadiant - row.radiantScore) > 0.01) errors.push(`${row.siteId}: radiant score is not reproducible`);
    const expectedViewing = calculateMeteorViewingScore(row.climateScore, row.moonScore, row.radiantScore, scoringConfig);
    if (Math.abs(expectedViewing - row.viewingScore) > 0.01) errors.push(`${row.siteId}: viewing score is not reproducible`);
  }
  const best = value.topSites[0];
  if (best) {
    if (value.climateScore !== best.climateScore || value.moonScore !== best.moonScore || value.radiantScore !== best.radiantScore || value.viewingScore !== best.viewingScore) errors.push("event scores must match the best site");
    if (value.moonConditions.bestSiteId !== best.siteId
      || value.moonConditions.dateLocal !== best.moonConditions.dateLocal
      || value.moonConditions.timezone !== best.moonConditions.timezone
      || value.moonConditions.moonIlluminationFraction !== best.moonConditions.moonIlluminationFraction
      || value.moonConditions.moonlessHours !== best.moonConditions.moonlessHours
      || value.moonConditions.totalDarknessHours !== best.moonConditions.totalDarknessHours) errors.push("event Moon conditions must match the best site");
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const yearArgument = process.argv.indexOf("--year");
  const year = yearArgument >= 0 && process.argv[yearArgument + 1] ? process.argv[yearArgument + 1] : "2027";
  let scoringConfig: MeteorShowerScoringConfig;
  try {
    const config = readJson<MeteorShowerConfig>(resolve(root, "data-config/astronomy/meteor-showers", `${year}.json`));
    scoringConfig = readJson<MeteorShowerScoringConfig>(resolve(root, "data-config/astronomy/meteor-scoring.json"));
    validateMeteorShowerConfig(config);
    validateMeteorShowerScoringConfig(scoringConfig);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    process.exit();
  }
  const directory = resolve(publicDataDir, "events/meteor-showers", year);
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = files.flatMap((file) => validateMeteorShowerEvent(readJson<MeteorShowerEvent>(resolve(directory, file)), scoringConfig).map((error) => `${directory}/${file}: ${error}`));
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} static meteor-shower event file(s) for ${year}.`);
  }
}
