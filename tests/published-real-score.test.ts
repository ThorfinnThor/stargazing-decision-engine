import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { Destination, DestinationMonthlySummary, Manifest, ObservationSite, SiteScoreSnapshot } from "../lib/data/types.js";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
}

test("published destination summaries prefer complete real score snapshots and disclose seed fallbacks", () => {
  const destinations = readJson<Destination[]>("data-config/sources/destinations.json");
  const sites = readJson<ObservationSite[]>("data-config/sources/observation-sites.json");
  const scoreDirectory = resolve(process.cwd(), "data-snapshots/scores");
  const snapshots = new Map<string, SiteScoreSnapshot>(
    existsSync(scoreDirectory)
      ? readdirSync(scoreDirectory).filter((file) => file.endsWith(".json")).map((file) => {
        const snapshot = readJson<SiteScoreSnapshot>(`data-snapshots/scores/${file}`);
        return [snapshot.siteId, snapshot];
      })
      : [],
  );

  for (const destination of destinations) {
    const summary = readJson<DestinationMonthlySummary>(`public/data/stargazing/monthly/destinations/${destination.slug}.json`);
    const realSite = destination.observationSiteIds
      .map((siteId) => sites.find((site) => site.id === siteId))
      .find((site) => site && snapshots.has(site.id));
    assert.equal(summary.months.length, 12);
    assert.equal(new Set(summary.months.map((month) => month.month)).size, 12);
    if (!realSite) {
      assert.equal(summary.dataStatus, "seed");
      continue;
    }
    const snapshot = snapshots.get(realSite.id) as SiteScoreSnapshot;
    assert.equal(summary.dataStatus, "real");
    assert.equal(summary.siteId, realSite.id);
    assert.equal(summary.algorithmVersion, snapshot.algorithmVersion);
    assert.deepEqual(summary.months, snapshot.months.map((month) => ({
      month: month.month,
      score: month.stargazingTrip,
      confidenceLevel: month.confidenceLevel,
    })));
  }

  const manifest = readJson<Manifest>("public/data/stargazing/manifest.json");
  assert.equal(manifest.counts.realScoreSites, snapshots.size);
  assert.equal(manifest.counts.seedScoreSites, sites.length - snapshots.size);
});
