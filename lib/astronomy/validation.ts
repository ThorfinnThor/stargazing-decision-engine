import type { SkyLocation } from "./types";

export function isFiniteLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isFiniteLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function isValidInstantIso(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

export function assertValidSkyLocation(location: SkyLocation) {
  if (!isFiniteLatitude(location.lat)) throw new Error(`Invalid latitude for ${location.id}`);
  if (!isFiniteLongitude(location.lon)) throw new Error(`Invalid longitude for ${location.id}`);
  if (location.elevationM !== null && !Number.isFinite(location.elevationM)) throw new Error(`Invalid elevation for ${location.id}`);
  if (!isValidTimeZone(location.timeZone)) throw new Error(`Invalid timezone for ${location.id}`);
}

export function assertValidInstant(value: string) {
  if (!isValidInstantIso(value)) throw new Error(`Invalid UTC instant: ${value}`);
  return new Date(value);
}
