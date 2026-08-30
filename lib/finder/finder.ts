import type { FinderDestination, FinderMonth, MonthNumber } from "../data/types.js";

export type FinderTemperature = "any" | "cold" | "cool" | "mild" | "warm";
export type FinderPriority = "balanced" | "darkness" | "comfort" | "clear";
export type FinderAccess = "public" | "reviewed";

export interface FinderPreferences {
  month: MonthNumber | "all";
  region: string | "all";
  temperature: FinderTemperature;
  priority: FinderPriority;
  access: FinderAccess;
}

export interface FinderMatch {
  destination: FinderDestination;
  month: FinderMonth;
  matchScore: number;
  preferenceScore: number;
}

export interface FinderExclusions {
  lowConfidence: number;
  noData: number;
  noUsableWindow: number;
}

export interface FinderAnalysis {
  matches: FinderMatch[];
  exclusions: FinderExclusions;
}

const temperatureTargets: Record<Exclude<FinderTemperature, "any">, number> = {
  cold: 0,
  cool: 7,
  mild: 14,
  warm: 21,
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function temperatureFit(value: number | null, preference: FinderTemperature) {
  if (preference === "any") return 100;
  if (value === null) return 0;
  return Math.max(0, 100 - Math.abs(value - temperatureTargets[preference]) * 6);
}

function priorityFit(month: FinderMonth, priority: FinderPriority) {
  if (priority === "darkness") return month.darknessScore;
  if (priority === "comfort") return month.tripComfort;
  if (priority === "clear") return month.clearSkyScore;
  return month.stargazingTrip;
}

function scoreMonth(month: FinderMonth, preferences: FinderPreferences) {
  const preferenceScore = 0.65 * priorityFit(month, preferences.priority)
    + 0.35 * temperatureFit(month.nightTempMeanC, preferences.temperature);
  const matchScore = 0.6 * month.stargazingTrip
    + 0.25 * preferenceScore
    + 0.15 * month.confidenceScore;
  return { matchScore: round(matchScore), preferenceScore: round(preferenceScore) };
}

export function analyzeDestinations(index: FinderDestination[], preferences: FinderPreferences): FinderAnalysis {
  const candidates = index.filter((destination) => {
    if (preferences.region !== "all" && destination.continent !== preferences.region) return false;
    if (destination.publicAccess !== "yes" && !(preferences.access === "reviewed" && destination.publicAccess === "limited")) return false;
    return true;
  });

  const exclusions: FinderExclusions = { lowConfidence: 0, noData: 0, noUsableWindow: 0 };
  const matches = candidates.flatMap((destination) => {
    const months = preferences.month === "all"
      ? destination.monthly
      : destination.monthly.filter((month) => month.month === preferences.month);
    const eligible = months.filter((month) => month.confidenceLevel !== "low" && month.stargazingTrip > 0);
    const best = eligible.map((month) => ({ month, ...scoreMonth(month, preferences) }))
      .sort((left, right) => right.matchScore - left.matchScore || right.month.stargazingTrip - left.month.stargazingTrip || left.month.month - right.month.month)[0];
    if (best) return [{ destination, ...best }];
    if (months.length === 0) exclusions.noData += 1;
    else if (months.some((month) => month.stargazingTrip > 0 && month.confidenceLevel === "low")) exclusions.lowConfidence += 1;
    else exclusions.noUsableWindow += 1;
    return [];
  }).sort((left, right) => right.matchScore - left.matchScore
    || right.month.stargazingTrip - left.month.stargazingTrip
    || left.destination.name.localeCompare(right.destination.name));

  return { matches, exclusions };
}

export function findDestinations(index: FinderDestination[], preferences: FinderPreferences): FinderMatch[] {
  return analyzeDestinations(index, preferences).matches;
}
