import type { Locale } from "./config";

export function formatMonth(month: number, locale: Locale) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return "—";

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month - 1, 1)));
}
