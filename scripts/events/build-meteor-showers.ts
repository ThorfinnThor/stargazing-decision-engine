import { resolve } from "node:path";

import type { CalendarConfig } from "../../lib/astronomy/calendar.js";
import { buildMeteorShowerEvents, type MeteorShowerConfig, type MeteorShowerScoringConfig } from "../../lib/astronomy/meteor-showers.js";
import type { Destination, ObservationSite } from "../../lib/data/types.js";
import { generatedPath, readJson, root, writeJson } from "../pipeline/io.js";
import { loadRequiredRealScores } from "../pipeline/real-scores.js";

interface SeedData {
  destinations: Destination[];
  sites: ObservationSite[];
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const year = Number(argument("--year") ?? 2027);
if (!Number.isInteger(year) || year < 1900) throw new Error("--year must be an integer >= 1900");
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const real = loadRequiredRealScores(seed.sites);
const config = readJson<MeteorShowerConfig>(resolve(root, "data-config/astronomy/meteor-showers", `${year}.json`));
const scoringConfig = readJson<MeteorShowerScoringConfig>(resolve(root, "data-config/astronomy/meteor-scoring.json"));
const calendarConfig = readJson<CalendarConfig>(resolve(root, "data-config/astronomy/calendar-config.json"));
const events = buildMeteorShowerEvents({
  config,
  scoringConfig,
  calendarConfig,
  destinations: seed.destinations,
  sites: seed.sites,
  scores: real.scores,
});

writeJson(generatedPath(`meteor-showers-${year}.json`), { dataStatus: "real", generatedAt: real.generatedAt, events });
console.log(`Built ${events.length} static meteor-shower event(s) for ${year}.`);
