import type { Locale } from "../i18n/config";
import { assertValidInstant } from "./validation";

export function formatSkyLocalTime(locale: Locale, timeZone: string, instantIso: string) {
  const instant = assertValidInstant(instantIso);
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium", timeStyle: "short" }).format(instant);
}

export function shouldScheduleSkyRefresh(mode: "live-night" | "night-preview") {
  return mode === "live-night";
}
