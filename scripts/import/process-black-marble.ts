import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { buildBlackMarbleSnapshot } from "../../lib/darkness/black-marble/snapshot.js";
import { applyDarknessCurve } from "../../lib/darkness/calibration/calibration.js";
import type { BlackMarbleConfig, BlackMarbleExtractedYear } from "../../lib/darkness/black-marble/types.js";
import type { DarknessAnchorConfig, DarknessCurveConfig } from "../../lib/darkness/calibration/types.js";
import type { ObservationSite } from "../../lib/data/types.js";
import { readJson, root, writeJson } from "../pipeline/io.js";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const siteSlug = argument("--site");
const anchorId = argument("--anchor");
if ((!siteSlug && !anchorId) || (siteSlug && anchorId)) {
  throw new Error("Usage: pnpm data:black-marble:process -- (--site <site-slug> | --anchor <anchor-id>)");
}

const config = readJson<BlackMarbleConfig>(resolve(root, "data-config/sources/black-marble.json"));
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const anchorConfig = readJson<DarknessAnchorConfig>(resolve(root, "data-config/calibration/darkness-anchors.json"));
const site = siteSlug
  ? sites.find((item) => item.slug === siteSlug)
  : anchorConfig.anchors.find((item) => item.id === anchorId);
const targetId = siteSlug ?? anchorId as string;
const targetKind = siteSlug ? "site" : "anchor";
if (!site) throw new Error(`Unknown ${targetKind}: ${targetId}`);
const coverageOverride = siteSlug
  ? config.coverageOverrides.find((item) => item.siteId === site.id)
  : undefined;
if (process.argv.includes("--allow-low-coverage") && !coverageOverride) {
  throw new Error(`${targetId}: ad-hoc low-coverage overrides are forbidden; add a reviewed site override to black-marble.json`);
}
const rawDirectory = resolve(root, "raw-downloads/black-marble", targetId);
if (!existsSync(rawDirectory)) throw new Error(`No Black Marble cache for ${siteSlug}`);
const years = readdirSync(rawDirectory)
  .filter((file) => /^pixels-\d{4}\.json$/.test(file))
  .map((file) => readJson<BlackMarbleExtractedYear>(resolve(rawDirectory, file)))
  .sort((a, b) => b.year - a.year)
  .slice(0, config.baselineYearCount);
const metadata = readJson<{ retrievedAt: string; siteId: string; targetKind?: string; requestedPoint: [number, number] }>(resolve(rawDirectory, "metadata.json"));
if (metadata.siteId !== site.id) throw new Error(`Black Marble cache identity mismatch for ${targetId}`);
if (metadata.requestedPoint[0] !== site.lat || metadata.requestedPoint[1] !== site.lon) throw new Error(`Black Marble cache coordinates changed for ${targetId}`);
let snapshot = buildBlackMarbleSnapshot({
  site: { id: site.id, lat: site.lat, lon: site.lon },
  years,
  config,
  retrievedAt: metadata.retrievedAt,
  allowIncompleteYears: process.argv.includes("--allow-incomplete-years"),
  allowLowCoverage: Boolean(coverageOverride),
});
if (snapshot.coverageOverrideUsed) {
  if (!coverageOverride) throw new Error(`${targetId}: low coverage has no reviewed override`);
  if (snapshot.coverage < coverageOverride.minimumCoverage) {
    throw new Error(
      `${targetId}: Black Marble coverage ${snapshot.coverage} is below reviewed floor ${coverageOverride.minimumCoverage}`,
    );
  }
  snapshot.warnings.push(
    `Reviewed ${coverageOverride.reviewedAt}: ${coverageOverride.reason}`,
  );
}
if (targetKind === "site") {
  const curve = readJson<DarknessCurveConfig>(resolve(root, "data-config/scoring/darkness.json"));
  if (curve.status === "calibrated") snapshot = applyDarknessCurve(snapshot, curve);
}
const outputDirectory = anchorId
  ? resolve(root, "data-snapshots/black-marble/anchors")
  : resolve(root, "data-snapshots/black-marble");
writeJson(resolve(outputDirectory, `${targetId}.json`), snapshot);
console.log(`Processed Black Marble snapshot for ${targetId}: ${snapshot.blackMarbleYears.join(", ")}.`);
