const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  const existing = formatterCache.get(timezone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timezone, created);
  return created;
}

function localParts(date: Date, timezone: string) {
  const parts = Object.fromEntries(
    formatter(timezone).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

function isoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/**
 * Assigns a local night to the local calendar date of its evening.
 * The boundary is local noon: midnight-to-noon belongs to the previous date.
 * This remains stable across UTC offsets and daylight-saving transitions.
 */
export function localNightDate(date: Date, timezone: string) {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid UTC timestamp");
  const local = localParts(date, timezone);
  if (local.hour >= 12) return isoDate(local.year, local.month, local.day);
  const previous = new Date(Date.UTC(local.year, local.month - 1, local.day - 1));
  return isoDate(previous.getUTCFullYear(), previous.getUTCMonth() + 1, previous.getUTCDate());
}

export function normalizeUtcTimestamp(value: string) {
  const explicit = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(explicit);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ERA5 timestamp: ${value}`);
  return date.toISOString();
}

export function isConsecutiveUtcHour(previousIso: string, currentIso: string) {
  return new Date(currentIso).getTime() - new Date(previousIso).getTime() === 3_600_000;
}
