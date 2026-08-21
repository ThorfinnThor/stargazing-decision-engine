import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { validateDemSnapshot } from "../scripts/validate/validate-dem-snapshots.js";
import type { DemSnapshot } from "../lib/elevation/dem/types.js";

const root = process.cwd();

test("committed DEM fixture satisfies schema and NoData invariants", () => {
  const snapshot = JSON.parse(readFileSync(resolve(root, "tests/fixtures/dem/snapshot.json"), "utf8")) as DemSnapshot;
  assert.deepEqual(validateDemSnapshot(snapshot), []);
});

test("DEM validator rejects a null neighborhood with a positive valid count", () => {
  const snapshot = JSON.parse(readFileSync(resolve(root, "tests/fixtures/dem/snapshot.json"), "utf8")) as DemSnapshot;
  snapshot.neighborhoods[0].elevationM = null;
  assert.match(validateDemSnapshot(snapshot).join("\n"), /null median/);
});
