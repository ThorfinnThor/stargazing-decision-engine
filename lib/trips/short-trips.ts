import type {
  ConfidenceLevel,
  Destination,
  MonthlySiteScore,
  ObservationSite,
  OriginCity,
  ShortTripFile,
  StayArea,
} from "../data/types.js";
import { haversineKm } from "../climate/era5/distance.js";
import { isTravelEligibleSite } from "../access/travel.js";

export interface ShortTripDistanceBand {
  id: string;
  maxKm: number | null;
  utility: number;
}

export interface ShortTripScoringConfig {
  version: number;
  weights: { stargazingTrip: number; distance: number };
  distanceBands: ShortTripDistanceBand[];
  excludedPublicAccess: "no";
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function validateConfig(config: ShortTripScoringConfig) {
  if (config.version !== 1 || config.excludedPublicAccess !== "no") throw new Error("Short-trip V1 config is invalid");
  const weightSum = config.weights.stargazingTrip + config.weights.distance;
  if ([config.weights.stargazingTrip, config.weights.distance].some((value) => value < 0 || !Number.isFinite(value)) || Math.abs(weightSum - 1) > 1e-9) throw new Error("Short-trip weights must be non-negative and sum to one");
  if (config.distanceBands.length === 0) throw new Error("Short-trip distance bands are required");
  let previousMax = 0;
  for (const [index, band] of config.distanceBands.entries()) {
    if (!band.id || band.utility < 0 || band.utility > 100 || (band.maxKm !== null && band.maxKm <= previousMax)) throw new Error(`Invalid short-trip distance band at ${index}`);
    if (index > 0 && band.utility > config.distanceBands[index - 1].utility) throw new Error("Short-trip distance utility must not increase with distance");
    if (band.maxKm !== null) previousMax = band.maxKm;
  }
  if (config.distanceBands.at(-1)?.maxKm !== null) throw new Error("Final short-trip distance band must be open-ended");
}

export function shortTripDistance(distanceKm: number, config: ShortTripScoringConfig) {
  const band = config.distanceBands.find((candidate) => candidate.maxKm === null || distanceKm <= candidate.maxKm);
  if (!band) throw new Error("No short-trip distance band matches distance");
  return { band: band.id, utility: band.utility };
}

function bestSiteForDestination(destination: Destination, sites: ObservationSite[], scores: MonthlySiteScore[]) {
  const candidates = sites.filter((site) => site.destinationId === destination.id && isTravelEligibleSite(site));
  return [...candidates].sort((left, right) => {
    const leftScores = scores.filter((score) => score.siteId === left.id);
    const rightScores = scores.filter((score) => score.siteId === right.id);
    const leftAverage = leftScores.length ? leftScores.reduce((sum, score) => sum + score.stargazingTrip, 0) / leftScores.length : -1;
    const rightAverage = rightScores.length ? rightScores.reduce((sum, score) => sum + score.stargazingTrip, 0) / rightScores.length : -1;
    return rightAverage - leftAverage || right.priority - left.priority || left.id.localeCompare(right.id);
  })[0] ?? null;
}

function bestMonths(monthlyScores: MonthlySiteScore[]) {
  return [...monthlyScores]
    .sort((left, right) => right.stargazingTrip - left.stargazingTrip || left.month - right.month)
    .slice(0, 3)
    .map((score) => ({ month: score.month, score: score.stargazingTrip }));
}

export function buildShortTripFiles(options: {
  origins: OriginCity[];
  destinations: Destination[];
  sites: ObservationSite[];
  stayAreas: StayArea[];
  scores: MonthlySiteScore[];
  scoringConfig: ShortTripScoringConfig;
  generatedAt: string;
}): ShortTripFile[] {
  validateConfig(options.scoringConfig);
  return options.origins.filter((origin) => origin.active).map((origin) => {
    const entries = options.destinations.filter((destination) => destination.active).flatMap((destination) => {
      const site = bestSiteForDestination(destination, options.sites, options.scores);
      if (!site) return [];
      const monthlyScores = options.scores.filter((score) => score.siteId === site.id).sort((left, right) => left.month - right.month);
      if (monthlyScores.length === 0) return [];
      const distanceKm = round(haversineKm(origin.lat, origin.lon, site.lat, site.lon));
      if (distanceKm > origin.maxShortTripKm) return [];
      const distance = shortTripDistance(distanceKm, options.scoringConfig);
      const topMonth = [...monthlyScores].sort((left, right) => right.stargazingTrip - left.stargazingTrip || left.month - right.month)[0];
      if (!topMonth) return [];
      const stayArea = options.stayAreas.find((area) => area.destinationId === destination.id && area.observationSiteIds.includes(site.id))
        ?? options.stayAreas.find((area) => area.destinationId === destination.id)
        ?? null;
      const shortTripScore = round(
        options.scoringConfig.weights.stargazingTrip * topMonth.stargazingTrip
        + options.scoringConfig.weights.distance * distance.utility,
      );
      const confidenceLevel: ConfidenceLevel = topMonth.confidenceLevel;
      return [{
        destination,
        site,
        distanceKm,
        distance,
        monthlyScores,
        topMonth,
        stayArea,
        shortTripScore,
        confidenceLevel,
      }];
    });
    entries.sort((left, right) => right.shortTripScore - left.shortTripScore || right.topMonth.stargazingTrip - left.topMonth.stargazingTrip || left.distanceKm - right.distanceKm || left.destination.id.localeCompare(right.destination.id));
    return {
      originSlug: origin.slug,
      originName: origin.name,
      countryCode: origin.countryCode,
      maxShortTripKm: origin.maxShortTripKm,
      generatedAt: options.generatedAt,
      entries: entries.map((entry, index) => ({
        rank: index + 1,
        destinationId: entry.destination.id,
        destinationSlug: entry.destination.slug,
        destinationName: entry.destination.name,
        distanceKm: entry.distanceKm,
        distanceBand: entry.distance.band,
        bestMonths: bestMonths(entry.monthlyScores),
        monthlyStargazingTripScores: entry.monthlyScores.map((score) => ({ month: score.month, score: score.stargazingTrip, confidenceLevel: score.confidenceLevel })),
        stargazingTripScore: entry.topMonth.stargazingTrip,
        distanceUtility: entry.distance.utility,
        shortTripScore: entry.shortTripScore,
        bestSiteId: entry.site.id,
        stayArea: entry.stayArea ? { id: entry.stayArea.id, name: entry.stayArea.name, affiliateQuery: entry.stayArea.affiliateQuery } : null,
        campingAvailable: null,
        reasons: [
          `Best month score ${entry.topMonth.stargazingTrip} in month ${entry.topMonth.month}.`,
          `Distance is ${entry.distanceKm} km by great-circle calculation; no road time is estimated.`,
          entry.stayArea ? `Stay area metadata: ${entry.stayArea.name}.` : "No curated stay-area metadata is available.",
        ],
        confidenceLevel: entry.confidenceLevel,
      })),
    } satisfies ShortTripFile;
  });
}

export { validateConfig as validateShortTripScoringConfig };
