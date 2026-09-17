import assert from "node:assert/strict";
import test from "node:test";

import type { ObservationSite, SiteScoreSnapshot } from "../lib/data/types.js";
import { selectRequiredRealScores } from "../scripts/pipeline/real-scores.js";

const sites = [
  { id: "active-site", active: true },
  { id: "staged-site", active: false },
] as ObservationSite[];

const snapshot = (siteId: string) => ({
  siteId,
  algorithmVersion: "site-score-1.1.0",
  generatedAt: "2026-09-17T00:00:00Z",
  months: Array.from({ length: 12 }, (_, index) => ({ siteId, month: index + 1 })),
}) as SiteScoreSnapshot;

test("staged real-score snapshots are retained but excluded from production consumers", () => {
  const selected = selectRequiredRealScores(sites, [snapshot("active-site"), snapshot("staged-site")]);
  assert.deepEqual(selected.snapshots.map((item) => item.siteId), ["active-site"]);
  assert.equal(selected.scores.length, 12);
});

test("real-score snapshots for unknown sites still fail closed", () => {
  assert.throws(
    () => selectRequiredRealScores(sites, [snapshot("active-site"), snapshot("unknown-site")]),
    /do not match catalog sites: unknown-site/,
  );
});
