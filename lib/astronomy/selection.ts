import { computeSunHorizontal } from "./compute-sky";
import type { HomepageSkyCandidate, HomepageSkySelection, NightPreview } from "./types";

export function selectRandomItem<T>(items: readonly T[], randomUnit: number): T | null {
  if (!Number.isFinite(randomUnit) || randomUnit < 0 || randomUnit >= 1) throw new Error("randomUnit must be in [0, 1)");
  if (items.length === 0) return null;
  return items[Math.floor(randomUnit * items.length)] ?? null;
}

export function selectDarknessTier<T extends { sunAltitudeDeg: number }>(evaluated: readonly T[]): T[] {
  const astronomicalNight = evaluated.filter((item) => item.sunAltitudeDeg <= -18);
  if (astronomicalNight.length > 0) return astronomicalNight;
  return evaluated.filter((item) => item.sunAltitudeDeg > -18 && item.sunAltitudeDeg <= -12);
}

export function shouldKeepLiveSelection(sunAltitudeDeg: number) {
  return Number.isFinite(sunAltitudeDeg) && sunAltitudeDeg <= -10;
}

export function selectHomepageSky(input: {
  candidates: readonly HomepageSkyCandidate[];
  previews: readonly NightPreview[];
  instantIso: string;
  locationRandomUnit: number;
  previewRandomUnit: number;
}): HomepageSkySelection | null {
  const evaluated = input.candidates.flatMap((candidate) => {
    try {
      return [{ candidate, sunAltitudeDeg: computeSunHorizontal(candidate.location, input.instantIso).altitudeDeg }];
    } catch {
      return [];
    }
  });
  const livePool = selectDarknessTier(evaluated);
  const live = selectRandomItem(livePool, input.locationRandomUnit);
  if (live) return { mode: "live-night", candidateId: live.candidate.id, selectedAtIso: input.instantIso, sunAltitudeDegAtSelection: live.sunAltitudeDeg };
  const fallbackCandidates = evaluated.length > 0 ? evaluated.map((item) => item.candidate) : input.candidates;
  const previewPools = fallbackCandidates.flatMap((candidate) => {
    const previews = input.previews.filter((preview) => candidate.previewIds.includes(preview.id)
      && preview.destinationId === candidate.location.destinationId
      && preview.siteId === candidate.location.siteId);
    return previews.length > 0 ? [{ candidate, previews }] : [];
  });
  const fallback = selectRandomItem(previewPools, input.locationRandomUnit);
  if (!fallback) return null;
  const preview = selectRandomItem(fallback.previews, input.previewRandomUnit);
  return preview ? { mode: "night-preview", candidateId: fallback.candidate.id, previewId: preview.id, instantIso: preview.instantIso } : null;
}

export function roundedCurrentMinuteIso(now = Date.now()) {
  return new Date(Math.floor(now / 60_000) * 60_000).toISOString();
}
