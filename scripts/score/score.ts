import type { DarknessMetrics, Destination, MonthlySiteClimate, MonthlySiteScore, ObservationSite } from "../../lib/data/types.js";
import { clamp, generatedPath, readJson, round, writeJson } from "../pipeline/io.js";

interface SeedData {
  seed: true;
  generatedAt: string;
  destinations: Destination[];
  sites: ObservationSite[];
}

interface ScoreProfile {
  clear: number;
  darkness: number;
  elevation: number;
  comfort: number;
  dew: number;
  highLatitude?: boolean;
}

interface ScoredData {
  seed: true;
  generatedAt: string;
  climate: MonthlySiteClimate[];
  darkness: DarknessMetrics[];
  scores: MonthlySiteScore[];
}

const profiles: Record<string, ScoreProfile> = {
  "la-palma": { clear: 0.78, darkness: 91, elevation: 94, comfort: 82, dew: 0.18 },
  tenerife: { clear: 0.74, darkness: 88, elevation: 92, comfort: 84, dew: 0.2 },
  westhavelland: { clear: 0.48, darkness: 62, elevation: 22, comfort: 72, dew: 0.42 },
  alqueva: { clear: 0.72, darkness: 79, elevation: 35, comfort: 86, dew: 0.16 },
  galloway: { clear: 0.4, darkness: 71, elevation: 38, comfort: 58, dew: 0.55 },
  atacama: { clear: 0.9, darkness: 97, elevation: 99, comfort: 64, dew: 0.06 },
  "big-bend": { clear: 0.82, darkness: 93, elevation: 48, comfort: 79, dew: 0.12 },
  "aoraki-mackenzie": { clear: 0.68, darkness: 94, elevation: 74, comfort: 55, dew: 0.22 },
  namibrand: { clear: 0.91, darkness: 98, elevation: 68, comfort: 68, dew: 0.04 },
  jasper: { clear: 0.58, darkness: 86, elevation: 63, comfort: 48, dew: 0.28, highLatitude: true },
  "cherry-springs": { clear: 0.62, darkness: 88, elevation: 42, comfort: 62, dew: 0.38, highLatitude: true },
  "great-basin": { clear: 0.82, darkness: 94, elevation: 82, comfort: 58, dew: 0.12 },
  "mauna-kea": { clear: 0.76, darkness: 96, elevation: 99, comfort: 52, dew: 0.16 },
  "kitt-peak": { clear: 0.84, darkness: 92, elevation: 72, comfort: 74, dew: 0.1 },
  "elqui-valley": { clear: 0.86, darkness: 93, elevation: 58, comfort: 78, dew: 0.08 },
  kerry: { clear: 0.42, darkness: 74, elevation: 30, comfort: 55, dew: 0.58, highLatitude: true },
  "north-york-moors": { clear: 0.43, darkness: 68, elevation: 30, comfort: 57, dew: 0.52, highLatitude: true },
  "elan-valley": { clear: 0.44, darkness: 70, elevation: 34, comfort: 58, dew: 0.5, highLatitude: true },
  hortobagy: { clear: 0.58, darkness: 72, elevation: 18, comfort: 72, dew: 0.32, highLatitude: true },
  zselic: { clear: 0.56, darkness: 70, elevation: 28, comfort: 68, dew: 0.38, highLatitude: true },
  warrumbungle: { clear: 0.74, darkness: 91, elevation: 62, comfort: 70, dew: 0.16 },
  uluru: { clear: 0.88, darkness: 94, elevation: 30, comfort: 76, dew: 0.08 },
  hanle: { clear: 0.86, darkness: 95, elevation: 99, comfort: 42, dew: 0.04 },
  witsand: { clear: 0.78, darkness: 90, elevation: 52, comfort: 72, dew: 0.1 },
  "al-wathba": { clear: 0.82, darkness: 72, elevation: 8, comfort: 82, dew: 0.06 },
};

const input = readJson<SeedData>(generatedPath("seed.normalized.json"));
const clampProbability = (value: number | null) => value === null ? null : round(clamp(value, 0, 1), 4);
const seasonal = (month: number) => Math.sin(((month - 1) / 12) * Math.PI * 2 - Math.PI / 2);

const climate: MonthlySiteClimate[] = [];
const darkness: DarknessMetrics[] = [];
const scores: MonthlySiteScore[] = [];

for (const site of input.sites) {
  const destination = input.destinations.find((item) => item.id === site.destinationId);
  if (!destination) throw new Error(`Missing destination for site ${site.id}`);
  const profile = profiles[destination.id];
  if (!profile) throw new Error(`Missing seed score profile for ${destination.id}`);

  darkness.push({
    siteId: site.id,
    blackMarbleYears: [2023, 2024, 2025],
    radiance0to2: round((100 - profile.darkness) / 80),
    radiance2to10: round((100 - profile.darkness) / 30),
    radiance10to30: round((100 - profile.darkness) / 12),
    radiance30to75: round((100 - profile.darkness) / 5),
    alanExposure: round((100 - profile.darkness) / 100),
    darknessScore: profile.darkness,
    coverage: 1,
  });

  for (let month = 1; month <= 12; month += 1) {
    const seasonalValue = seasonal(month);
    const astronomicalHours = profile.highLatitude && month === 6
      ? 0
      : round(Math.max(0, 10 + (profile.highLatitude ? 5 : 2) * seasonalValue));
    const clearHourProbability = clampProbability(profile.clear + seasonalValue * 0.05);
    const dewRiskProbability = clampProbability(profile.dew - seasonalValue * 0.04);
    const comfort = clamp(profile.comfort + seasonalValue * 5);
    const clearSkyScore = clamp((clearHourProbability ?? 0) * 100);
    const dewScore = clamp((1 - (dewRiskProbability ?? 1)) * 100);
    const tripComfort = round((comfort + dewScore) / 2, 2);
    const stargazingTrip = round(clearSkyScore * 0.4 + profile.darkness * 0.35 + tripComfort * 0.25, 2);

    climate.push({
      siteId: site.id,
      month: month as MonthlySiteClimate["month"],
      astronomicalHours,
      clearHourProbability,
      goodHourProbability: clampProbability((clearHourProbability ?? 0) * 0.72),
      overcastHourProbability: clampProbability(1 - (clearHourProbability ?? 0)),
      clearNightProbability: clampProbability((clearHourProbability ?? 0) * 0.82),
      wetNightHourProbability: clampProbability((dewRiskProbability ?? 0) * 0.65),
      dewRiskProbability,
      nightTempMeanC: round(12 + seasonalValue * 6 - (site.elevationM ?? 0) / 500),
      nightTempP10C: round(7 + seasonalValue * 6 - (site.elevationM ?? 0) / 500),
      nightTempP90C: round(17 + seasonalValue * 6 - (site.elevationM ?? 0) / 500),
      nightWindMeanKmh: round(12 + (1 - profile.comfort / 100) * 15),
      highWindHourProbability: clampProbability((1 - profile.comfort / 100) * 0.5),
      daylightOppositeNightHoursMean: round(24 - astronomicalHours),
      dataCompleteness: 1,
    });

    scores.push({
      siteId: site.id,
      month: month as MonthlySiteScore["month"],
      skyQuality: round((clearSkyScore + profile.darkness) / 2, 2),
      tripComfort,
      stargazingTrip,
      clearSkyScore: round(clearSkyScore, 2),
      darknessScore: profile.darkness,
      dewScore: round(dewScore, 2),
      elevationScore: profile.elevation,
      temperatureComfortScore: round(comfort, 2),
      windComfortScore: round(profile.comfort, 2),
      rainComfortScore: round(clearSkyScore, 2),
      accessScore: site.accessScore,
      confidenceScore: 35,
      confidenceLevel: "low",
      reasons: ["Synthetic seed fixture", "Scores exist to exercise the static pipeline"],
      caveats: ["Not production climate data", "Not a weather forecast"],
    });
  }
}

const output: ScoredData = { seed: true, generatedAt: input.generatedAt, climate, darkness, scores };
writeJson(generatedPath("seed.scored.json"), output);
console.log(`Scored synthetic seed: ${scores.length} site-month rows.`);
