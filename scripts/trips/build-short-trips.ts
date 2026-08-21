import { resolve } from "node:path";

import { buildShortTripFiles, type ShortTripScoringConfig } from "../../lib/trips/short-trips.js";
import type { Destination, MonthlySiteScore, ObservationSite, OriginCity, StayArea } from "../../lib/data/types.js";
import { generatedPath, readJson, root, seedGeneratedAt, writeJson } from "../pipeline/io.js";

interface SeedData {
  destinations: Destination[];
  sites: ObservationSite[];
  stayAreas: StayArea[];
  origins: OriginCity[];
}

interface ScoredData {
  scores: MonthlySiteScore[];
}

const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const scored = readJson<ScoredData>(generatedPath("seed.scored.json"));
const scoringConfig = readJson<ShortTripScoringConfig>(resolve(root, "data-config/trips/short-trip-scoring.json"));
const files = buildShortTripFiles({ ...seed, scores: scored.scores, scoringConfig, generatedAt: seedGeneratedAt });
for (const file of files) writeJson(generatedPath(`short-trips-${file.originSlug}.json`), file);
console.log(`Built ${files.length} static short-trip file(s).`);
