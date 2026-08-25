import { computeSunHorizontal } from "./compute-sky";
import type { SkyLocation } from "./types";

const astronomicalNightAltitudeDeg = -18;
const stepMs = 30 * 60 * 1000;
const searchWindowMs = 370 * 24 * 60 * 60 * 1000;

export type DestinationSkySelection =
  | { mode: "live-night"; instantIso: string }
  | { mode: "night-preview"; instantIso: string };

export function findNextAstronomicalNight(location: SkyLocation, fromIso: string) {
  const fromMs = Date.parse(fromIso);
  if (!Number.isFinite(fromMs)) throw new Error(`Invalid preview start instant: ${fromIso}`);

  let best: { instantIso: string; sunAltitudeDeg: number } | null = null;
  let foundNight = false;
  for (let offsetMs = stepMs; offsetMs <= searchWindowMs; offsetMs += stepMs) {
    const instantIso = new Date(fromMs + offsetMs).toISOString();
    const sunAltitudeDeg = computeSunHorizontal(location, instantIso).altitudeDeg;
    if (sunAltitudeDeg <= astronomicalNightAltitudeDeg) {
      foundNight = true;
      if (!best || sunAltitudeDeg < best.sunAltitudeDeg) best = { instantIso, sunAltitudeDeg };
      continue;
    }
    if (foundNight) return best;
  }
  return best;
}

export function selectInitialDestinationSky(location: SkyLocation, nowIso: string): DestinationSkySelection {
  const sun = computeSunHorizontal(location, nowIso);
  if (sun.altitudeDeg < astronomicalNightAltitudeDeg) return { mode: "live-night", instantIso: nowIso };
  const nextNight = findNextAstronomicalNight(location, nowIso);
  return nextNight
    ? { mode: "night-preview", instantIso: nextNight.instantIso }
    : { mode: "live-night", instantIso: nowIso };
}
