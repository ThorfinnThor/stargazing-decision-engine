import { computeSky, computeSunHorizontal } from "./compute-sky";
import type { CatalogStar, SkyLocation, SkySnapshot } from "./types";
import type { Locale } from "../i18n/config";

// Naked-eye limiting magnitudes follow the upper ("at best") values John Bortle gives
// for each class in Sky & Telescope's description of his dark-sky scale. The darkest
// tier is capped at 6.5 because that is as deep as the published star files go;
// Bortle classes 1–3 reach 6.6–8.0, so the dark sky shown here is conservative.
export const bortleScaleSourceUrl = "https://skyandtelescope.org/astronomy-resources/light-pollution-and-astronomy-the-bortle-dark-sky-scale/";

export type SkySituationId = "inner-city" | "city" | "suburb" | "small-town" | "village";

export interface SkySituation {
  id: SkySituationId;
  bortle: string;
  limitingMagnitude: number;
  // 0 = no visible glow, 1 = strongest; only drives how the sky is tinted.
  skyglow: number;
  label: Record<Locale, string>;
  hint: Record<Locale, string>;
}

export const skySituations: readonly SkySituation[] = [
  { id: "inner-city", bortle: "9", limitingMagnitude: 4.0, skyglow: 1, label: { en: "City centre", de: "Innenstadt" }, hint: { en: "Bright streets, shop windows, floodlit buildings", de: "Helle Straßen, Schaufenster, angestrahlte Gebäude" } },
  { id: "city", bortle: "8", limitingMagnitude: 4.5, skyglow: 0.8, label: { en: "City neighbourhood", de: "Stadtviertel" }, hint: { en: "Residential streets inside a large city", de: "Wohngebiet in einer Großstadt" } },
  { id: "suburb", bortle: "7", limitingMagnitude: 5.0, skyglow: 0.6, label: { en: "Suburb", de: "Stadtrand" }, hint: { en: "Edge of a city, glow on every horizon", de: "Rand einer Großstadt, Lichtglocke an jedem Horizont" } },
  { id: "small-town", bortle: "6", limitingMagnitude: 5.5, skyglow: 0.4, label: { en: "Small town", de: "Kleinstadt" }, hint: { en: "Town with a few thousand people, city glow in one direction", de: "Kleinstadt, Lichtglocke einer Stadt in einer Richtung" } },
  { id: "village", bortle: "5", limitingMagnitude: 6.0, skyglow: 0.2, label: { en: "Village", de: "Dorf" }, hint: { en: "Village or countryside near towns", de: "Dorf oder Land in der Nähe von Städten" } },
];

export const darkestSky = { bortle: "1–3", limitingMagnitude: 6.5 } as const;

export interface ReferenceCity {
  id: string;
  name: Record<Locale, string>;
  lat: number;
  lon: number;
  timeZone: string;
}

const city = (id: string, en: string, de: string, lat: number, lon: number, timeZone: string): ReferenceCity => ({ id, name: { en, de }, lat, lon, timeZone });

// Only fixes which stars are above the horizon and when night falls; light pollution
// comes from the chosen situation, not from the city.
export const referenceCities: readonly ReferenceCity[] = [
  city("berlin", "Berlin", "Berlin", 52.52, 13.405, "Europe/Berlin"),
  city("hamburg", "Hamburg", "Hamburg", 53.551, 9.994, "Europe/Berlin"),
  city("munich", "Munich", "München", 48.137, 11.575, "Europe/Berlin"),
  city("cologne", "Cologne", "Köln", 50.938, 6.96, "Europe/Berlin"),
  city("frankfurt", "Frankfurt", "Frankfurt", 50.11, 8.682, "Europe/Berlin"),
  city("stuttgart", "Stuttgart", "Stuttgart", 48.776, 9.183, "Europe/Berlin"),
  city("leipzig", "Leipzig", "Leipzig", 51.34, 12.375, "Europe/Berlin"),
  city("vienna", "Vienna", "Wien", 48.208, 16.373, "Europe/Vienna"),
  city("zurich", "Zurich", "Zürich", 47.377, 8.541, "Europe/Zurich"),
  city("london", "London", "London", 51.507, -0.128, "Europe/London"),
  city("manchester", "Manchester", "Manchester", 53.481, -2.243, "Europe/London"),
  city("dublin", "Dublin", "Dublin", 53.35, -6.26, "Europe/Dublin"),
  city("amsterdam", "Amsterdam", "Amsterdam", 52.37, 4.9, "Europe/Amsterdam"),
  city("paris", "Paris", "Paris", 48.857, 2.352, "Europe/Paris"),
  city("madrid", "Madrid", "Madrid", 40.417, -3.704, "Europe/Madrid"),
  city("rome", "Rome", "Rom", 41.903, 12.496, "Europe/Rome"),
  city("new-york", "New York", "New York", 40.713, -74.006, "America/New_York"),
  city("boston", "Boston", "Boston", 42.36, -71.059, "America/New_York"),
  city("washington", "Washington, D.C.", "Washington, D.C.", 38.907, -77.037, "America/New_York"),
  city("toronto", "Toronto", "Toronto", 43.653, -79.383, "America/Toronto"),
  city("chicago", "Chicago", "Chicago", 41.878, -87.63, "America/Chicago"),
  city("denver", "Denver", "Denver", 39.739, -104.99, "America/Denver"),
  city("phoenix", "Phoenix", "Phoenix", 33.448, -112.074, "America/Phoenix"),
  city("los-angeles", "Los Angeles", "Los Angeles", 34.052, -118.244, "America/Los_Angeles"),
  city("san-francisco", "San Francisco", "San Francisco", 37.775, -122.419, "America/Los_Angeles"),
  city("seattle", "Seattle", "Seattle", 47.606, -122.332, "America/Los_Angeles"),
  city("vancouver", "Vancouver", "Vancouver", 49.283, -123.121, "America/Vancouver"),
  city("dubai", "Dubai", "Dubai", 25.205, 55.271, "Asia/Dubai"),
  city("tokyo", "Tokyo", "Tokio", 35.676, 139.65, "Asia/Tokyo"),
  city("cape-town", "Cape Town", "Kapstadt", -33.925, 18.424, "Africa/Johannesburg"),
  city("sydney", "Sydney", "Sydney", -33.869, 151.209, "Australia/Sydney"),
  city("melbourne", "Melbourne", "Melbourne", -37.814, 144.963, "Australia/Melbourne"),
  city("auckland", "Auckland", "Auckland", -36.848, 174.763, "Pacific/Auckland"),
];

export const defaultSituationId: SkySituationId = "suburb";

export function findSituation(id: string | null | undefined) {
  return skySituations.find((item) => item.id === id) ?? null;
}

export function findReferenceCity(id: string | null | undefined) {
  return referenceCities.find((item) => item.id === id) ?? null;
}

// Picks a city in the reader's own time zone so the default sky is roughly theirs,
// without asking for their location.
export function defaultReferenceCity(locale: Locale, timeZone: string | null | undefined): ReferenceCity {
  const byZone = timeZone ? referenceCities.find((item) => item.timeZone === timeZone) : undefined;
  return byZone ?? (findReferenceCity(locale === "de" ? "berlin" : "new-york") as ReferenceCity);
}

export function referenceCityLocation(item: ReferenceCity, limitingMagnitude: number): SkyLocation {
  const id = `light-pollution-${item.id}`;
  return { id, destinationId: id, destinationSlug: item.id, destinationName: item.name.en, siteId: id, siteName: item.name.en, label: item.name.en, lat: item.lat, lon: item.lon, elevationM: 0, timeZone: item.timeZone, limitingMagnitude };
}

const stepMs = 10 * 60 * 1000;

// Uses the current moment when it is already astronomical night; otherwise the darkest
// moment of the coming 24 hours, so the comparison is never drawn in daylight.
export function selectComparisonInstant(location: SkyLocation, nowIso: string): { instantIso: string; live: boolean } {
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) throw new Error(`Invalid comparison instant: ${nowIso}`);
  if (computeSunHorizontal(location, nowIso).altitudeDeg < -18) return { instantIso: nowIso, live: true };
  let best = { instantIso: nowIso, altitudeDeg: Infinity };
  for (let offset = stepMs; offset <= 24 * 60 * 60 * 1000; offset += stepMs) {
    const instantIso = new Date(nowMs + offset).toISOString();
    const altitudeDeg = computeSunHorizontal(location, instantIso).altitudeDeg;
    if (altitudeDeg < best.altitudeDeg) best = { instantIso, altitudeDeg };
  }
  return { instantIso: best.instantIso, live: false };
}

export interface SkyComparisonSide {
  snapshot: SkySnapshot;
  visibleStars: number;
}

function summarize(snapshot: SkySnapshot): SkyComparisonSide {
  return { snapshot, visibleStars: snapshot.stars.length };
}

export function computeSkyComparison(input: { city: ReferenceCity; situation: SkySituation; instantIso: string; stars: readonly CatalogStar[] }) {
  const yours = summarize(computeSky(referenceCityLocation(input.city, input.situation.limitingMagnitude), input.instantIso, input.stars));
  const darkest = summarize(computeSky(referenceCityLocation(input.city, darkestSky.limitingMagnitude), input.instantIso, input.stars));
  const visibleShare = darkest.visibleStars === 0 ? 0 : yours.visibleStars / darkest.visibleStars;
  return { yours, darkest, visibleShare };
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
