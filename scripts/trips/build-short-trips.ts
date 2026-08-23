import { resolve } from "node:path";

import { buildShortTripFiles, type ShortTripScoringConfig } from "../../lib/trips/short-trips.js";
import type { Destination, ObservationSite, OriginCity, StayArea } from "../../lib/data/types.js";
import { generatedPath, readJson, root, writeJson } from "../pipeline/io.js";
import { loadRequiredRealScores } from "../pipeline/real-scores.js";

interface SeedData {
  destinations: Destination[];
  sites: ObservationSite[];
  stayAreas: StayArea[];
  origins: OriginCity[];
}

const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const real = loadRequiredRealScores(seed.sites);
const scoringConfig = readJson<ShortTripScoringConfig>(resolve(root, "data-config/trips/short-trip-scoring.json"));
const files = buildShortTripFiles({ ...seed, scores: real.scores, scoringConfig, generatedAt: real.generatedAt });
for (const file of files) writeJson(generatedPath(`short-trips-${file.originSlug}.json`), file);
console.log(`Built ${files.length} static short-trip file(s).`);
