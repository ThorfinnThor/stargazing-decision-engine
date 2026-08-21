import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import type { CalendarFile, ObservationSite, Destination } from "../../lib/data/types.js";
import { buildCalendarNight, rankCalendarNights, type CalendarConfig } from "../../lib/astronomy/calendar.js";
import { validateMilkyWayConfig, type MilkyWayConfig } from "../../lib/astronomy/milky-way.js";
import { readJson, root, writeJson } from "../pipeline/io.js";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const start = argument("--start");
if (!start || !/^\d{4}-\d{2}$/.test(start)) throw new Error("Usage: pnpm data:calendar:real -- --start YYYY-MM");
const [startYear, startMonth] = start.split("-").map(Number);
if (startMonth < 1 || startMonth > 12) throw new Error(`Invalid calendar start month: ${start}`);
const horizonMonths = Number(argument("--months") ?? 36);
if (!Number.isInteger(horizonMonths) || horizonMonths < 1 || horizonMonths > 60) throw new Error("--months must be an integer from 1 to 60");
const generatedAt = argument("--generated-at") ?? `${start}-01T00:00:00.000Z`;
if (!/^\d{4}-\d{2}-\d{2}T.+Z$/.test(generatedAt)) throw new Error("--generated-at must be an ISO UTC timestamp");

const config = readJson<CalendarConfig>(resolve(root, "data-config/astronomy/calendar-config.json"));
const milkyWayConfig = readJson<MilkyWayConfig>(resolve(root, "data-config/astronomy/milky-way.json"));
validateMilkyWayConfig(milkyWayConfig);
if (milkyWayConfig.referenceStatus !== "approved") throw new Error("Milky Way coordinate requires Sol review before production calendar generation");
const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const outputRoot = resolve(root, argument("--output-root") ?? "public/data/stargazing/calendar");
const destinationSlug = argument("--destination");
const selectedDestinations = destinations.filter((item) => item.active && (!destinationSlug || item.slug === destinationSlug));
if (destinationSlug && selectedDestinations.length === 0) throw new Error(`Unknown active destination slug: ${destinationSlug}`);

function monthAt(offset: number) {
  const date = new Date(Date.UTC(startYear, startMonth - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mean(values: number[]) {
  return values.length === 0 ? -1 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

let fileCount = 0;
for (const destination of selectedDestinations) {
  const destinationSites = sites.filter((site) => site.destinationId === destination.id && site.active);
  if (destinationSites.length === 0) continue;
  for (let offset = 0; offset < horizonMonths; offset += 1) {
    const { year, month } = monthAt(offset);
    const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const candidates = destinationSites.map((site) => {
      const nights = rankCalendarNights(Array.from({ length: dayCount }, (_, day) => buildCalendarNight({
        site,
        dateLocal: dateString(year, month, day + 1),
        timezone: destination.timezone,
        config,
        milkyWayConfig,
      })));
      return { site, nights, score: mean(nights.map((night) => night.calendarDarknessScore)), moonless: mean(nights.map((night) => night.moonlessHours)) };
    });
    candidates.sort((left, right) => right.score - left.score || right.moonless - left.moonless || left.site.id.localeCompare(right.site.id));
    const best = candidates[0];
    const output: CalendarFile = {
      destinationId: destination.id,
      siteId: best.site.id,
      bestSiteId: best.site.id,
      year,
      month: month as CalendarFile["month"],
      algorithmVersion: "astronomy-calendar-1.0.0",
      astronomyEngineVersion: "2.1.19",
      generatedAt,
      nights: best.nights,
    };
    const directory = resolve(outputRoot, destination.slug);
    mkdirSync(directory, { recursive: true });
    writeJson(resolve(directory, `${year}-${String(month).padStart(2, "0")}.json`), output);
    fileCount += 1;
  }
}
console.log(`Built ${fileCount} static real astronomy calendar file(s).`);
