import type { SkyCondition } from "./types";
import { clamp } from "./projection";

export function classifySkyCondition(sunAltitudeDeg: number): SkyCondition {
  if (sunAltitudeDeg >= 0) return "daylight";
  if (sunAltitudeDeg >= -6) return "civil-twilight";
  if (sunAltitudeDeg >= -12) return "nautical-twilight";
  if (sunAltitudeDeg >= -18) return "astronomical-twilight";
  return "night";
}

function interpolate(value: number, start: number, end: number, from: number, to: number) {
  const unit = clamp((value - start) / (end - start), 0, 1);
  return from + unit * (to - from);
}

export function getEffectiveLimitingMagnitude(input: { baseLimitingMagnitude: number; sunAltitudeDeg: number }) {
  const base = clamp(input.baseLimitingMagnitude, -2, 6.5);
  const sun = input.sunAltitudeDeg;
  if (sun >= -6) return -2;
  if (sun >= -12) return interpolate(sun, -6, -12, -2, 3);
  if (sun >= -18) return interpolate(sun, -12, -18, 3, base);
  return base;
}

export function starVisualStyle(magnitude: number, limitingMagnitude: number) {
  const brightness = clamp((limitingMagnitude - magnitude + 0.5) / Math.max(1, limitingMagnitude + 2), 0.12, 1);
  return { opacity: 0.25 + 0.75 * brightness, radiusFactor: clamp(0.65 + 1.45 * brightness, 0.65, 2.1) };
}
