import type { Locale } from "../i18n/config";
import { assertValidInstant } from "./validation";

export function formatSkyLocalTime(locale: Locale, timeZone: string, instantIso: string) {
  const instant = assertValidInstant(instantIso);
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium", timeStyle: "short" }).format(instant);
}

export function formatLocalClockTime(locale: Locale, timeZone: string, instantIso: string, includeUtcOffset = false) {
  const instant = assertValidInstant(instantIso);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: locale === "de" ? "h23" : undefined,
    timeZoneName: includeUtcOffset ? "shortOffset" : undefined,
  }).format(instant);
}

function utcOffsetLabel(timeZone: string, instantIso: string) {
  const instant = assertValidInstant(instantIso);
  return new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "2-digit",
    timeZoneName: "longOffset",
  }).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "";
}

export function hasTimeZoneOffsetTransition(timeZone: string, startIso: string, endIso: string) {
  return utcOffsetLabel(timeZone, startIso) !== utcOffsetLabel(timeZone, endIso);
}

export function shouldScheduleSkyRefresh(mode: "live-night" | "night-preview") {
  return mode === "live-night";
}
