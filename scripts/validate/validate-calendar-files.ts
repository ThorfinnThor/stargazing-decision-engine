import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import type { CalendarFile } from "../../lib/data/types.js";
import { calculateCalendarDarknessScore, type CalendarConfig, validateCalendarConfig } from "../../lib/astronomy/calendar.js";
import { publicDataDir, readJson, root as projectRoot } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/calendar.json");
const errors: string[] = [];
const calendarConfig = readJson<CalendarConfig>(resolve(projectRoot, "data-config/astronomy/calendar-config.json"));

export function validateCalendarFile(value: CalendarFile) {
  const fileErrors: string[] = [];
  if (!validate?.(value)) fileErrors.push(JSON.stringify(validate?.errors ?? "schema missing"));
  const dates = new Set<string>();
  const ranks = new Set<number>();
  for (const night of value.nights) {
    if (dates.has(night.dateLocal)) fileErrors.push(`duplicate local date: ${night.dateLocal}`);
    dates.add(night.dateLocal);
    if (ranks.has(night.darknessRank)) fileErrors.push(`duplicate darkness rank: ${night.darknessRank}`);
    ranks.add(night.darknessRank);
    if (!night.dateLocal.startsWith(`${value.year}-${String(value.month).padStart(2, "0")}-`)) fileErrors.push(`${night.dateLocal}: date does not belong to file month`);
    if (night.moonlessHours > night.totalDarknessHours) fileErrors.push("moonless hours exceed astronomical darkness");
    if (Math.abs(night.moonBelowHorizonDarkHours - night.moonlessHours) > 0.01) fileErrors.push("moon-below hours must equal moonless hours in V1");
    if (night.moonBelowHorizonDarkHours + night.moonAboveHorizonDarkHours > night.totalDarknessHours + 0.02) fileErrors.push("lunar dark-hour partition exceeds total darkness");
    if (night.totalDarknessHours === 0 && (night.moonlessHours !== 0 || night.calendarDarknessScore !== 0 || night.astronomicalDusk !== null || night.astronomicalDawn !== null)) fileErrors.push("zero darkness must have zero score/hours and null twilight events");
    if (night.milkyWayUsefulHours > night.totalDarknessHours || night.milkyWayStrongHours > night.milkyWayUsefulHours) fileErrors.push("Milky Way durations violate astronomical-darkness bounds");
    if (night.milkyWayUsefulHours > 0 && night.milkyWayOpportunityScore === null) fileErrors.push("Milky Way opportunity score is required when useful hours are positive");
    if (night.galacticCenterAltitudeMaxDeg === null && (night.milkyWayUsefulHours !== 0 || night.milkyWayStrongHours !== 0)) fileErrors.push("Milky Way altitude is required when overlap hours are positive");
    if (night.galacticCenterAltitudeMaxDeg !== null && (night.galacticCenterAltitudeMaxDeg < -90 || night.galacticCenterAltitudeMaxDeg > 90)) fileErrors.push("Milky Way maximum altitude is outside physical bounds");
    if (night.milkyWayOpportunityScore !== null && (night.milkyWayOpportunityScore < 0 || night.milkyWayOpportunityScore > 100)) fileErrors.push("Milky Way opportunity score is outside [0,100]");
    if (night.totalDarknessHours === 0 && (night.milkyWayUsefulHours !== 0 || night.milkyWayStrongHours !== 0 || night.galacticCenterAltitudeMaxDeg !== null || night.milkyWayOpportunityScore !== 0)) fileErrors.push("zero darkness must have zero/null Milky Way metrics");
    if (value.algorithmVersion === "astronomy-calendar-1.0.0") {
      const expected = calculateCalendarDarknessScore(night.moonlessHours, night.totalDarknessHours, calendarConfig);
      if (Math.abs(expected - night.calendarDarknessScore) > 1) fileErrors.push(`${night.dateLocal}: calendar darkness score is not reproducible`);
    }
  }
  if (value.siteId !== value.bestSiteId) fileErrors.push("siteId and bestSiteId must identify the same selected calendar site");
  if (value.algorithmVersion === "astronomy-calendar-1.0.0") {
    const expectedDays = new Date(Date.UTC(value.year, value.month, 0)).getUTCDate();
    if (value.nights.length !== expectedDays) fileErrors.push(`real calendar requires ${expectedDays} nights`);
    if (ranks.size !== value.nights.length || Math.max(...ranks) !== value.nights.length) fileErrors.push("real calendar darkness ranks must be contiguous");
  }
  return fileErrors;
}

function visit(directory: string) {
  if (!existsSync(directory)) return;
  for (const file of readdirSync(directory)) {
    const path = resolve(directory, file);
    if (statSync(path).isDirectory()) visit(path);
    else if (file.endsWith(".json")) {
      const value = JSON.parse(readFileSync(path, "utf8")) as CalendarFile;
      errors.push(...validateCalendarFile(value).map((error) => `${path}: ${error}`));
    }
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateCalendarConfig(calendarConfig);
    const rootArgumentIndex = process.argv.indexOf("--root");
    const calendarRoot = rootArgumentIndex >= 0 && process.argv[rootArgumentIndex + 1]
      ? resolve(projectRoot, process.argv[rootArgumentIndex + 1])
      : resolve(publicDataDir, "calendar");
    visit(calendarRoot);
    if (errors.length > 0) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log("Validated static astronomy calendar files.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
