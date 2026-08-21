import { sunAltitudeDeg } from "./astronomy.js";
import { isConsecutiveUtcHour, localNightDate } from "./time.js";
import type { Era5DerivedHour, Era5MonthlyAggregate, Era5SiteContext, Era5Thresholds } from "./types.js";

const round = (value: number, digits = 6) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const probability = (matches: number, total: number) => total === 0 ? null : round(matches / total);
const mean = (values: number[]) => values.length === 0 ? null : round(values.reduce((sum, value) => sum + value, 0) / values.length);

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * quantile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return round(sorted[lower]);
  return round(sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower));
}

function hasConsecutiveSequence(
  hours: Era5DerivedHour[],
  requiredLength: number,
  predicate: (hour: Era5DerivedHour) => boolean,
) {
  let run = 0;
  let previous: Era5DerivedHour | undefined;
  for (const hour of [...hours].sort((a, b) => a.validTimeUtc.localeCompare(b.validTimeUtc))) {
    const consecutive = previous ? isConsecutiveUtcHour(previous.validTimeUtc, hour.validTimeUtc) : true;
    run = predicate(hour) && consecutive ? run + 1 : predicate(hour) ? 1 : 0;
    if (run >= requiredLength) return true;
    previous = hour;
  }
  return false;
}

export function aggregateEra5Months(
  input: Era5DerivedHour[],
  thresholds: Era5Thresholds,
  expectedAstronomicalHours: ReadonlyMap<number, number>,
  climateNormal = { startYear: 1991, endYear: 2020 },
): Era5MonthlyAggregate[] {
  const seenTimestamps = new Set<string>();
  for (const hour of input) {
    if (seenTimestamps.has(hour.validTimeUtc)) throw new Error(`Duplicate ERA5 timestamp: ${hour.validTimeUtc}`);
    seenTimestamps.add(hour.validTimeUtc);
  }

  const eligible = input.filter((hour) => {
    const year = Number(hour.nightDate.slice(0, 4));
    return hour.astronomicalNight && year >= climateNormal.startYear && year <= climateNormal.endYear;
  });

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const hours = eligible.filter((hour) => Number(hour.nightDate.slice(5, 7)) === month);
    const nights = new Map<string, Era5DerivedHour[]>();
    for (const hour of hours) {
      const list = nights.get(hour.nightDate) ?? [];
      list.push(hour);
      nights.set(hour.nightDate, list);
    }

    let clearNights = 0;
    let goodNights = 0;
    for (const nightHours of nights.values()) {
      if (hasConsecutiveSequence(nightHours, thresholds.clearSequenceHoursMin, (hour) => hour.clearHour && !hour.wetHour)) clearNights += 1;
      if (hasConsecutiveSequence(nightHours, thresholds.clearSequenceHoursMin, (hour) => hour.goodHour && !hour.wetHour)) goodNights += 1;
    }

    const expected = expectedAstronomicalHours.get(month) ?? 0;
    const dataCompleteness = expected === 0 ? (hours.length === 0 ? 1 : 0) : round(Math.min(1, hours.length / expected));
    const years = new Set(hours.map((hour) => Number(hour.nightDate.slice(0, 4))));

    return {
      month: month as Era5MonthlyAggregate["month"],
      astronomicalHourCount: hours.length,
      nightCount: nights.size,
      clearHourProbability: probability(hours.filter((hour) => hour.clearHour).length, hours.length),
      goodHourProbability: probability(hours.filter((hour) => hour.goodHour).length, hours.length),
      overcastHourProbability: probability(hours.filter((hour) => hour.overcastHour).length, hours.length),
      clearNightProbability: probability(clearNights, nights.size),
      goodNightProbability: probability(goodNights, nights.size),
      wetNightHourProbability: probability(hours.filter((hour) => hour.wetHour).length, hours.length),
      dewRiskProbability: probability(hours.filter((hour) => hour.dewRiskHour).length, hours.length),
      nightTempMeanC: mean(hours.map((hour) => hour.tempC)),
      nightTempP10C: percentile(hours.map((hour) => hour.tempC), 0.1),
      nightTempP90C: percentile(hours.map((hour) => hour.tempC), 0.9),
      nightWindMeanKmh: mean(hours.map((hour) => hour.windKmh)),
      highWindHourProbability: probability(hours.filter((hour) => hour.highWindHour).length, hours.length),
      dataCompleteness,
      sampleYearCount: years.size,
    };
  });
}

export function computeExpectedAstronomicalHours(
  site: Era5SiteContext,
  thresholds: Era5Thresholds,
  climateNormal = { startYear: 1991, endYear: 2020 },
  altitudeCalculator = sunAltitudeDeg,
) {
  const counts = new Map<number, number>(Array.from({ length: 12 }, (_, index) => [index + 1, 0]));
  const start = Date.UTC(climateNormal.startYear, 0, 1) - 86_400_000;
  const endExclusive = Date.UTC(climateNormal.endYear + 1, 0, 1) + 2 * 86_400_000;
  for (let time = start; time < endExclusive; time += 3_600_000) {
    const date = new Date(time);
    const nightDate = localNightDate(date, site.timezone);
    const year = Number(nightDate.slice(0, 4));
    if (year < climateNormal.startYear || year > climateNormal.endYear) continue;
    if (altitudeCalculator(date, site.lat, site.lon, site.elevationM ?? 0) > thresholds.astronomicalNightSunAltitudeDeg) continue;
    const month = Number(nightDate.slice(5, 7));
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return counts;
}
