import type { CalendarFile, Destination, ObservationSite } from "../../lib/data/types.js";
import { addLocalDate, localDateTimeToUtc, localIso } from "../../lib/astronomy/calendar.js";
import { generatedPath, readJson, round, writeJson } from "../pipeline/io.js";

interface SeedData {
  seed: true;
  generatedAt: string;
  destinations: Destination[];
  sites: ObservationSite[];
}

interface CalendarOutput {
  seed: true;
  generatedAt: string;
  files: Record<string, CalendarFile>;
}

const input = readJson<SeedData>(generatedPath("seed.normalized.json"));
const files: Record<string, CalendarFile> = {};

for (const destination of input.destinations) {
  const site = input.sites.find((item) => item.destinationId === destination.id);
  for (let month = 1; month <= 12; month += 1) {
    const key = `${destination.slug}/2026-${String(month).padStart(2, "0")}`;
    const darkHours = site?.destinationId === "jasper" && month === 6 ? 0 : round(5 + ((month * 7) % 8));
    const dateLocal = `2026-${String(month).padStart(2, "0")}-15`;
    const astronomicalDusk = darkHours === 0 ? null : localIso(localDateTimeToUtc(dateLocal, 20, destination.timezone), destination.timezone);
    const astronomicalDawn = darkHours === 0 ? null : localIso(localDateTimeToUtc(addLocalDate(dateLocal, 1), 5, destination.timezone), destination.timezone);
    files[key] = {
      destinationId: destination.id,
      siteId: site?.id ?? null,
      bestSiteId: site?.id ?? null,
      year: 2026,
      month: month as CalendarFile["month"],
      algorithmVersion: "seed-fixture-calendar-0.2.0",
      astronomyEngineVersion: "synthetic-seed",
      generatedAt: input.generatedAt,
      nights: [{
        darknessRank: 1,
        dateLocal,
        timezone: destination.timezone,
        astronomicalDusk,
        astronomicalDawn,
        moonIlluminationFraction: round(((month * 0.137) % 1), 4),
        moonPhaseAngleDeg: round(((month * 49) % 180), 2),
        moonRiseLocal: null,
        moonSetLocal: null,
        moonAltitudeMaxDeg: round(-20 + month * 2),
        moonAboveHorizonDarkHours: darkHours === 0 ? 0 : round(darkHours * 0.38),
        moonBelowHorizonDarkHours: darkHours === 0 ? 0 : round(darkHours * 0.62),
        moonlessHours: darkHours === 0 ? 0 : round(darkHours * 0.62),
        totalDarknessHours: darkHours,
        calendarDarknessScore: darkHours === 0 ? 0 : round(Math.min(100, darkHours * 8)),
        milkyWayUsefulHours: darkHours === 0 ? 0 : round(darkHours * 0.5),
        milkyWayStrongHours: darkHours === 0 ? 0 : round(darkHours * 0.35),
        galacticCenterAltitudeMaxDeg: darkHours === 0 ? null : round(20 + month),
        milkyWayOpportunityScore: darkHours === 0 ? 0 : round(Math.min(100, darkHours * 8)),
      }],
    };
  }
}

writeJson(generatedPath("seed.calendar.json"), { seed: true, generatedAt: input.generatedAt, files } satisfies CalendarOutput);
console.log(`Built ${Object.keys(files).length} synthetic calendar files.`);
