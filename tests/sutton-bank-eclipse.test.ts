import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as Astronomy from "astronomy-engine";

import type { DestinationEditorialGuide, ObservationSite } from "../lib/data/types.js";

const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;

function clock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(Math.round(date.getTime() / 60_000) * 60_000);
}

test("Sutton Bank eclipse times quoted in the guide match the ephemeris", () => {
  const site = read<ObservationSite[]>("data-config/sources/observation-sites.json").find((item) => item.id === "sutton-bank-star-hub");
  const guide = read<DestinationEditorialGuide[]>("data-config/editorial/destination-guides.json").find((item) => item.slug === "north-york-moors");
  assert.ok(site && guide);
  const observer = new Astronomy.Observer(site.lat, site.lon, 290);
  const section = guide.sections.find((item) => item.id === "sutton-bank-eclipse");
  assert.ok(section);

  const year2026 = Astronomy.SearchLocalSolarEclipse(new Date("2026-08-01T00:00:00Z"), observer);
  const year2027 = Astronomy.NextLocalSolarEclipse(year2026.peak.time, observer);
  const year2028 = Astronomy.NextLocalSolarEclipse(year2027.peak.time, observer);
  assert.deepEqual([year2026, year2027, year2028].map((item) => item.peak.time.date.toISOString().slice(0, 10)), ["2026-08-12", "2027-08-02", "2028-01-26"]);
  assert.ok(Math.abs(year2026.obscuration - 0.9) < 0.01);
  assert.ok(Math.abs(year2027.obscuration - 1 / 3) < 0.02);
  assert.ok(year2028.peak.altitude < 0);
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, new Date("2028-01-26T12:00:00Z"), 1);
  assert.ok(sunset);

  const quoted = [
    year2026.partial_begin, year2026.peak, year2026.partial_end,
    year2027.partial_begin, year2027.peak, year2027.partial_end,
    year2028.partial_begin,
  ].map((item) => clock(item.time.date)).concat(clock(sunset.date));
  for (const locale of ["en", "de"] as const) {
    const copy = section.paragraphs[locale].join(" ");
    for (const time of quoted) assert.ok(copy.includes(time), `${locale} copy misses ${time}`);
  }
});

test("destination and blog pages link to the light-pollution comparison", () => {
  for (const path of ["app/[locale]/stargazing-destinations/[slug]/page.tsx", "app/[locale]/blog/[slug]/page.tsx"]) {
    assert.match(readFileSync(path, "utf8"), /localizedLinks\.lightPollutionComparison\(/);
  }
});
