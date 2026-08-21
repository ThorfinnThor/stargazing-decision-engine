import { resolve } from "node:path";

import type { CalendarConfig } from "../../lib/astronomy/calendar.js";
import { buildMeteorShowerEvents, type MeteorShowerConfig, type MeteorShowerScoringConfig } from "../../lib/astronomy/meteor-showers.js";
import type { Destination, MonthlySiteScore, ObservationSite } from "../../lib/data/types.js";
import { generatedPath, readJson, root, seedGeneratedAt, writeJson } from "../pipeline/io.js";

interface SeedData {
  destinations: Destination[];
  sites: ObservationSite[];
}

interface ScoredData {
  scores: MonthlySiteScore[];
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const year = Number(argument("--year") ?? 2027);
if (!Number.isInteger(year) || year < 1900) throw new Error("--year must be an integer >= 1900");
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const scored = readJson<ScoredData>(generatedPath("seed.scored.json"));
const config = readJson<MeteorShowerConfig>(resolve(root, "data-config/astronomy/meteor-showers", `${year}.json`));
const scoringConfig = readJson<MeteorShowerScoringConfig>(resolve(root, "data-config/astronomy/meteor-scoring.json"));
const calendarConfig = readJson<CalendarConfig>(resolve(root, "data-config/astronomy/calendar-config.json"));
const events = buildMeteorShowerEvents({
  config,
  scoringConfig,
  calendarConfig,
  destinations: seed.destinations,
  sites: seed.sites,
  scores: scored.scores,
});

writeJson(generatedPath(`meteor-showers-${year}.json`), { seed: true, generatedAt: seedGeneratedAt, events });
console.log(`Built ${events.length} static meteor-shower event(s) for ${year}.`);
