import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { calibrateDarkness } from "../../lib/darkness/calibration/calibration.js";
import type {
  DarknessAnchorConfig,
  DarknessAnchorSnapshot,
} from "../../lib/darkness/calibration/types.js";
import { readJson, root, writeJson } from "../pipeline/io.js";

const anchorPath = resolve(root, "data-config/calibration/darkness-anchors.json");
const snapshotDirectory = resolve(root, "data-snapshots/black-marble/anchors");
const outputPath = resolve(root, "data-config/scoring/darkness.json");

const anchorConfig = readJson<DarknessAnchorConfig>(anchorPath);
if (!existsSync(snapshotDirectory)) {
  throw new Error(`Darkness calibration snapshots are missing: ${snapshotDirectory}`);
}
const snapshots = readdirSync(snapshotDirectory)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => readJson<DarknessAnchorSnapshot>(resolve(snapshotDirectory, file)));
const calibration = calibrateDarkness({ anchorConfig, snapshots });
writeJson(outputPath, calibration);
console.log(`Calibrated a fixed darkness curve from ${calibration.anchorCount} reviewed anchors.`);
