import { resolve } from "node:path";

import type { DarknessAnchorConfig, DarknessCurveConfig } from "../../lib/darkness/calibration/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

export function validateDarknessConfiguration(anchorConfig: DarknessAnchorConfig, curve: DarknessCurveConfig) {
  const errors: string[] = [];
  const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/darkness-calibration.json");
  if (!validate?.(curve)) errors.push(JSON.stringify(validate?.errors ?? "darkness calibration schema missing"));

  const ids = new Set<string>();
  for (const anchor of anchorConfig.anchors) {
    if (ids.has(anchor.id)) errors.push(`duplicate anchor id: ${anchor.id}`);
    ids.add(anchor.id);
    if (anchor.lat < -90 || anchor.lat > 90) errors.push(`${anchor.id}: invalid latitude`);
    if (anchor.lon < -180 || anchor.lon > 180) errors.push(`${anchor.id}: invalid longitude`);
    if (!anchor.source.trim() || !anchor.notes.trim()) errors.push(`${anchor.id}: source and notes are required`);
  }
  const minimums = anchorConfig.minimumClassCounts;
  if (minimums.dark_reference < 30 || minimums.mid_reference < 20 || minimums.urban_control < 20) {
    errors.push("production class minimums must be at least 30 dark, 20 intermediate, and 20 urban anchors");
  }
  if (curve.status === "calibrated" && anchorConfig.status !== "approved") errors.push("calibrated curve requires an approved anchor configuration");
  if (curve.status === "calibrated" && anchorConfig.anchors.some((anchor) => !anchor.operatorApproved)) {
    errors.push("calibrated curve cannot reference an unapproved anchor");
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const anchors = readJson<DarknessAnchorConfig>(resolve(root, "data-config/calibration/darkness-anchors.json"));
  const curve = readJson<DarknessCurveConfig>(resolve(root, "data-config/scoring/darkness.json"));
  const errors = validateDarknessConfiguration(anchors, curve);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated darkness calibration configuration (${curve.status}, ${anchors.anchors.length} candidate anchors).`);
  }
}
