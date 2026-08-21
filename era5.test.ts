import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { aggregateEra5Months, computeExpectedAstronomicalHours } from "../lib/climate/era5/aggregate.js";
import { sunAltitudeDeg } from "../lib/climate/era5/astronomy.js";
import { parseEra5Csv } from "../lib/climate/era5/csv.js";
import { deriveEra5Hour } from "../lib/climate/era5/derive.js";
import { buildEra5Request, type Era5SourceConfig } from "../lib/climate/era5/request.js";
import { buildEra5Snapshot } from "../lib/climate/era5/snapshot.js";
import { localNightDate } from "../lib/climate/era5/time.js";
import type { Era5DerivedHour, Era5RawHour, Era5SiteContext } from "../lib/climate/era5/types.js";
import { validateEra5Snapshot } from "../scripts/validate/validate-climate-snapshots.js";

const root = process.cwd();
const config = JSON.parse(readFileSync(resolve(root, "data-config/sources/era5.json"), "utf8")) as Era5SourceConfig;
const site: Era5SiteContext = {
  siteId: "westhavelland-core",
  timezone: "Europe/Berlin",
  lat: 52.72,
  lon: 12.28,
  elevationM: 45,
};

test("CDS request uses the exact normal plus local-night boundary buffers", () => {
  const built = buildEra5Request(site, config);
  assert.equal(built.dataset, "reanalysis-era5-single-levels-timeseries");
  assert.deepEqual(built.request.date, ["1990-12-31/2021-01-02"]);
  assert.deepEqual(built.request.location, { longitude: 12.28, latitude: 52.72 });
  assert.equal(built.request.variable.length, 6);
});

test("grouped ERA5 CSV files merge by UTC timestamp and convert hourly units", () => {
  const fixture = (name: string) => readFileSync(resolve(root, "tests/fixtures/era5", name), "utf8");
  const rows = parseEra5Csv([fixture("atmosphere.csv"), fixture("wind-precipitation.csv")]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].validTimeUtc, "2020-10-12T20:00:00.000Z");
  const derived = deriveEra5Hour(rows[0], site, config.thresholds, () => -20);
  assert.equal(derived.tempC, 10);
  assert.equal(derived.dewC, 8);
  assert.equal(derived.dewpointDepressionC, 2);
  assert.equal(derived.windMs, 5);
  assert.equal(derived.windKmh, 18);
  assert.equal(derived.precipitationMm, 0.1);
  assert.equal(derived.wetHour, true);
  assert.equal(derived.astronomicalNight, true);
});

test("local night identity retains the evening date across midnight and DST", () => {
  assert.equal(localNightDate(new Date("2027-10-12T20:00:00Z"), "Europe/Berlin"), "2027-10-12");
  assert.equal(localNightDate(new Date("2027-10-13T03:00:00Z"), "Europe/Berlin"), "2027-10-12");
  assert.equal(localNightDate(new Date("2027-10-31T04:00:00Z"), "Europe/Berlin"), "2027-10-30");
  assert.equal(localNightDate(new Date("2027-10-31T18:00:00Z"), "Europe/Berlin"), "2027-10-31");
});

test("geometric Sun altitude distinguishes equatorial noon from midnight", () => {
  const noon = sunAltitudeDeg(new Date("2020-03-20T12:00:00Z"), 0, 0, 0);
  const midnight = sunAltitudeDeg(new Date("2020-03-20T00:00:00Z"), 0, 0, 0);
  assert.ok(noon > 85, `expected equatorial noon Sun > 85°, received ${noon}`);
  assert.ok(midnight < -85, `expected equatorial midnight Sun < -85°, received ${midnight}`);
});

test("clear nights require three consecutive dry astronomical hours", () => {
  const hours = [
    syntheticDerived("2020-10-12T19:00:00Z", "2020-10-12", 0.1),
    syntheticDerived("2020-10-12T20:00:00Z", "2020-10-12", 0.1),
    syntheticDerived("2020-10-12T21:00:00Z", "2020-10-12", 0.1),
    syntheticDerived("2020-10-13T19:00:00Z", "2020-10-13", 0.1),
    syntheticDerived("2020-10-13T20:00:00Z", "2020-10-13", 0.1),
    syntheticDerived("2020-10-13T21:00:00Z", "2020-10-13", 0.3),
  ];
  const expected = new Map([[10, 6]]);
  const october = aggregateEra5Months(hours, config.thresholds, expected, { startYear: 2020, endYear: 2020 })[9];
  assert.equal(october.astronomicalHourCount, 6);
  assert.equal(october.nightCount, 2);
  assert.equal(october.clearNightProbability, 0.5);
  assert.equal(october.goodNightProbability, 1);
  assert.equal(october.dataCompleteness, 1);
});

test("a missing UTC hour breaks an otherwise clear three-hour sequence", () => {
  const hours = [
    syntheticDerived("2020-10-12T19:00:00Z", "2020-10-12", 0.1),
    syntheticDerived("2020-10-12T20:00:00Z", "2020-10-12", 0.1),
    syntheticDerived("2020-10-12T22:00:00Z", "2020-10-12", 0.1),
  ];
  const october = aggregateEra5Months(hours, config.thresholds, new Map([[10, 4]]), { startYear: 2020, endYear: 2020 })[9];
  assert.equal(october.clearNightProbability, 0);
  assert.equal(october.dataCompleteness, 0.75);
});

test("24 hourly precipitation accumulations sum without differencing across 00 UTC", () => {
  const rows: Era5RawHour[] = Array.from({ length: 24 }, (_, index) => ({
    validTimeUtc: new Date(Date.UTC(2020, 0, 1, index + 1)).toISOString(),
    gridLat: 52.75,
    gridLon: 12.25,
    totalCloudCover: 0.5,
    temperatureK: 280,
    dewpointTemperatureK: 278,
    u10Ms: 0,
    v10Ms: 0,
    totalPrecipitationM: 0.001,
  }));
  const millimetres = rows.map((row) => deriveEra5Hour(row, site, config.thresholds, () => -20).precipitationMm);
  assert.equal(millimetres.reduce((sum, value) => sum + value, 0), 24);
  assert.equal(rows.at(-1)?.validTimeUtc, "2020-01-02T00:00:00.000Z");
});

test("high-latitude summer can contain zero expected astronomical hours", () => {
  const tromso = { siteId: "tromso", timezone: "Europe/Oslo", lat: 69.6492, lon: 18.9553, elevationM: 0 };
  const expected = computeExpectedAstronomicalHours(tromso, config.thresholds, { startYear: 2020, endYear: 2020 });
  assert.equal(expected.get(6), 0);
  assert.ok((expected.get(1) ?? 0) > 0);
});

test("CSV merge rejects timestamps with incomplete variable groups", () => {
  assert.throws(
    () => parseEra5Csv(["valid_time,latitude,longitude,tcc\n2020-01-01T00:00:00,1,2,0.1\n"]),
    /missing temperatureK/,
  );
});

test("snapshot construction rejects mixed ERA5 grid points", () => {
  const fixture = (name: string) => readFileSync(resolve(root, "tests/fixtures/era5", name), "utf8");
  const rows = parseEra5Csv([fixture("atmosphere.csv"), fixture("wind-precipitation.csv")]);
  rows[1] = { ...rows[1], gridLat: rows[1].gridLat + 0.25 };

  assert.throws(
    () =>
      buildEra5Snapshot({
        rows,
        site,
        thresholds: config.thresholds,
        retrievedAt: "2026-08-20T00:00:00Z",
        expectedAstronomicalHours: new Map([[10, 3]]),
      }),
    /grid point/i,
  );
});

test("fixture rows produce a schema-valid 1991–2020 climate snapshot", () => {
  const fixture = (name: string) => readFileSync(resolve(root, "tests/fixtures/era5", name), "utf8");
  const rows = parseEra5Csv([fixture("atmosphere.csv"), fixture("wind-precipitation.csv")]);
  const snapshot = buildEra5Snapshot({
    rows,
    site,
    thresholds: config.thresholds,
    retrievedAt: "2026-08-20T00:00:00Z",
    expectedAstronomicalHours: new Map([[10, 3]]),
  });
  assert.equal(snapshot.months.length, 12);
  assert.equal(snapshot.gridPoint[0], 52.75);
  assert.equal(snapshot.precipitationConvention, "hourly-accumulation-ending-at-valid-time-metres-to-mm");
  assert.deepEqual(validateEra5Snapshot(snapshot), []);
});

test("a skewed temperature distribution may place the mean below P10", () => {
  const fixture = (name: string) => readFileSync(resolve(root, "tests/fixtures/era5", name), "utf8");
  const rows = parseEra5Csv([fixture("atmosphere.csv"), fixture("wind-precipitation.csv")]);
  const snapshot = buildEra5Snapshot({
    rows,
    site,
    thresholds: config.thresholds,
    retrievedAt: "2026-08-20T00:00:00Z",
    expectedAstronomicalHours: new Map([[10, 3]]),
  });
  snapshot.months[9].nightTempMeanC = -10;
  snapshot.months[9].nightTempP10C = 0;
  snapshot.months[9].nightTempP90C = 0;
  assert.deepEqual(validateEra5Snapshot(snapshot), []);
});

function syntheticDerived(validTimeUtc: string, nightDate: string, cloud: number): Era5DerivedHour {
  return {
    validTimeUtc,
    gridLat: 0,
    gridLon: 0,
    totalCloudCover: cloud,
    temperatureK: 280,
    dewpointTemperatureK: 275,
    u10Ms: 0,
    v10Ms: 0,
    totalPrecipitationM: 0,
    sunAltitudeDeg: -25,
    astronomicalNight: true,
    nightDate,
    tempC: 6.85,
    dewC: 1.85,
    dewpointDepressionC: 5,
    windMs: 0,
    windKmh: 0,
    precipitationMm: 0,
    clearHour: cloud <= config.thresholds.clearCloudCoverMax,
    goodHour: cloud <= config.thresholds.goodCloudCoverMax,
    overcastHour: false,
    wetHour: false,
    dewRiskHour: false,
    highWindHour: false,
  };
}
