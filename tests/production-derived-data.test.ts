import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { CalendarFile, Manifest, MeteorShowerEvent, ObservationSite, ShortTripFile } from "../lib/data/types.js";
import { isTravelEligibleSite } from "../lib/access/travel.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;

test("published derived products are real and access-gated", () => {
  const manifest = read<Manifest>("public/data/stargazing/manifest.json");
  assert.equal(manifest.counts.seedScoreSites, 0);
  assert.equal(manifest.counts.observationSites, 150);
  assert.equal(manifest.counts.realScoreSites, 150);
  assert.equal(manifest.counts.calendarFiles, manifest.counts.destinations * 36);
  assert.ok(manifest.counts.approvedImageAssets >= 50);
  assert.ok(manifest.counts.approvedImageAssets <= manifest.counts.imageAssets);
  assert.equal(manifest.sourceVersions.calendar, "astronomy-calendar-real-1.0.0");
  assert.match(manifest.sourceVersions.meteorShowers, /real-site-score/);
  assert.match(manifest.sourceVersions.shortTrips, /real-site-score/);

  const alquevaCalendarDirectory = resolve(process.cwd(), "public/data/stargazing/calendar/alqueva");
  const firstCalendarFile = readdirSync(alquevaCalendarDirectory).filter((file) => /^\d{4}-\d{2}\.json$/.test(file)).sort()[0];
  assert.ok(firstCalendarFile);
  const calendar = read<CalendarFile>(`public/data/stargazing/calendar/alqueva/${firstCalendarFile}`);
  assert.equal(calendar.algorithmVersion, "astronomy-calendar-1.0.0");
  assert.equal(calendar.nights.length, new Date(Date.UTC(calendar.year, calendar.month, 0)).getUTCDate());

  const sites = read<ObservationSite[]>("data-config/sources/observation-sites.json");
  assert.equal(sites.length, 150);
  const eligible = new Set(sites.filter(isTravelEligibleSite).map((site) => site.id));
  for (const file of readdirSync(resolve(process.cwd(), "public/data/stargazing/short-trips"))) {
    const trip = read<ShortTripFile>(`public/data/stargazing/short-trips/${file}`);
    assert.ok(trip.entries.every((entry) => eligible.has(entry.bestSiteId)));
  }
  for (const file of readdirSync(resolve(process.cwd(), "public/data/stargazing/events/meteor-showers/2027"))) {
    const event = read<MeteorShowerEvent>(`public/data/stargazing/events/meteor-showers/2027/${file}`);
    assert.ok([...event.topSites, ...event.topDestinations].every((row) => eligible.has(row.siteId)));
  }
});
