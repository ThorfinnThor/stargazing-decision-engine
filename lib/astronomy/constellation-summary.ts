import type { Locale } from "../i18n/config";
import { constellationCopyById } from "./constellation-copy";
import type { ConstellationSummary, VisibleConstellation } from "./types";

const directions = {
  en: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
  de: ["Norden", "Nordosten", "Osten", "Südosten", "Süden", "Südwesten", "Westen", "Nordwesten"],
} as const;

export function directionLabel(azimuthDeg: number, locale: Locale) {
  const index = Math.round((((azimuthDeg % 360) + 360) % 360) / 45) % 8;
  return directions[locale][index];
}

export function altitudeLabel(altitudeDeg: number, locale: Locale) {
  if (altitudeDeg < 15) return locale === "de" ? "horizontnah" : "near the horizon";
  if (altitudeDeg < 30) return locale === "de" ? "niedrig" : "low";
  if (altitudeDeg <= 60) return locale === "de" ? "mittelhoch" : "mid-sky";
  return locale === "de" ? "hoch" : "high";
}

export function buildConstellationSummaries(visible: readonly VisibleConstellation[], locale: Locale, limit = 3): ConstellationSummary[] {
  return visible
    .filter((constellation) => constellation.visibilityState === "recognizable")
    .slice(0, Math.max(0, limit))
    .flatMap((constellation) => {
      const copy = constellationCopyById.get(constellation.id);
      if (!copy) return [];
      return [{
        constellationId: constellation.id,
        name: copy.name[locale],
        directionLabel: directionLabel(constellation.centerAzimuthDeg, locale),
        altitudeLabel: altitudeLabel(constellation.centerAltitudeDeg, locale),
        recognitionHint: copy.recognitionHint[locale],
        shortDescription: copy.shortDescription[locale],
      }];
    });
}
