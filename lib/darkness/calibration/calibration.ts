import type {
  CalibratedDarknessCurve,
  DarknessAnchor,
  DarknessAnchorClass,
  DarknessAnchorConfig,
  DarknessAnchorSnapshot,
  DarknessCurveConfig,
  DarknessCurvePoint,
  DarknessDistribution,
  DarknessLabelBand,
} from "./types.js";
import type { BlackMarbleSnapshot } from "../black-marble/types.js";

const CLASSES: DarknessAnchorClass[] = ["dark_reference", "mid_reference", "urban_control"];

export const DARKNESS_LABELS: DarknessLabelBand[] = [
  { minimumScore: 85, label: "Very dark" },
  { minimumScore: 65, label: "Dark" },
  { minimumScore: 35, label: "Moderate artificial light" },
  { minimumScore: 0, label: "Bright surroundings" },
];

function round(value: number, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) throw new Error("Cannot calculate a percentile of an empty sample");
  if (percentileValue < 0 || percentileValue > 1) throw new Error("Percentile must be between zero and one");
  const sorted = [...values].sort((a, b) => a - b);
  const rank = percentileValue * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower);
}

export function summarizeDistribution(values: number[]): DarknessDistribution {
  const median = percentile(values, 0.5);
  const deviations = values.map((value) => Math.abs(value - median));
  return {
    count: values.length,
    minimum: round(Math.min(...values)),
    p10: round(percentile(values, 0.1)),
    p25: round(percentile(values, 0.25)),
    median: round(median),
    p75: round(percentile(values, 0.75)),
    p90: round(percentile(values, 0.9)),
    maximum: round(Math.max(...values)),
    mad: round(percentile(deviations, 0.5)),
  };
}

function validateAnchorConfig(config: DarknessAnchorConfig) {
  if (config.status !== "approved") throw new Error("Darkness anchor configuration requires operator approval");
  const ids = new Set<string>();
  for (const anchor of config.anchors) {
    if (ids.has(anchor.id)) throw new Error(`Duplicate darkness anchor id: ${anchor.id}`);
    ids.add(anchor.id);
    if (!anchor.operatorApproved) throw new Error(`Darkness anchor ${anchor.id} is not operator-approved`);
    if (!Number.isFinite(anchor.lat) || anchor.lat < -90 || anchor.lat > 90) throw new Error(`Invalid latitude for ${anchor.id}`);
    if (!Number.isFinite(anchor.lon) || anchor.lon < -180 || anchor.lon > 180) throw new Error(`Invalid longitude for ${anchor.id}`);
  }
  for (const group of CLASSES) {
    const actual = config.anchors.filter((anchor) => anchor.class === group).length;
    const minimum = config.minimumClassCounts[group];
    if (actual < minimum) throw new Error(`${group} requires at least ${minimum} anchors; received ${actual}`);
  }
}

function validateSnapshot(anchor: DarknessAnchor, snapshot: DarknessAnchorSnapshot) {
  if (snapshot.siteId !== anchor.id) throw new Error(`Snapshot identity mismatch for ${anchor.id}`);
  if (snapshot.source !== "VNP46A4" || snapshot.collectionVersion !== "2") {
    throw new Error(`Unsupported Black Marble source for ${anchor.id}`);
  }
  if (snapshot.alanExposure === null || !Number.isFinite(snapshot.alanExposure) || snapshot.alanExposure < 0) {
    throw new Error(`Missing valid ALAN exposure for ${anchor.id}`);
  }
  if (snapshot.baselineOverrideUsed || snapshot.blackMarbleYears.length !== 3) {
    throw new Error(`Incomplete Black Marble baseline for ${anchor.id}`);
  }
  if (snapshot.coverageOverrideUsed || snapshot.coverage < 0.7) {
    throw new Error(`Insufficient Black Marble coverage for ${anchor.id}`);
  }
  return snapshot.alanExposure;
}

function assertStrictlyIncreasing(points: DarknessCurvePoint[]) {
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].alanExposure <= points[index - 1].alanExposure) {
      throw new Error("Anchor distributions do not produce a strictly increasing ALAN curve");
    }
    if (points[index].darknessScore >= points[index - 1].darknessScore) {
      throw new Error("Darkness curve must be strictly decreasing");
    }
  }
}

export function calibrateDarkness(options: {
  anchorConfig: DarknessAnchorConfig;
  snapshots: DarknessAnchorSnapshot[];
}): CalibratedDarknessCurve {
  validateAnchorConfig(options.anchorConfig);
  const snapshots = new Map(options.snapshots.map((snapshot) => [snapshot.siteId, snapshot]));
  if (snapshots.size !== options.snapshots.length) throw new Error("Duplicate darkness anchor snapshot");

  const values: Record<DarknessAnchorClass, number[]> = {
    dark_reference: [],
    mid_reference: [],
    urban_control: [],
  };
  let commonYears: string | undefined;
  let calibratedAt = "";
  for (const anchor of options.anchorConfig.anchors) {
    const snapshot = snapshots.get(anchor.id);
    if (!snapshot) throw new Error(`Missing Black Marble snapshot for ${anchor.id}`);
    values[anchor.class].push(validateSnapshot(anchor, snapshot));
    const years = [...snapshot.blackMarbleYears].sort((a, b) => a - b).join(",");
    if (commonYears !== undefined && years !== commonYears) throw new Error("All calibration snapshots must use the same baseline years");
    commonYears = years;
    if (snapshot.retrievedAt > calibratedAt) calibratedAt = snapshot.retrievedAt;
  }
  if (snapshots.size !== options.anchorConfig.anchors.length) throw new Error("Unexpected Black Marble snapshot outside the anchor configuration");

  const distributions = Object.fromEntries(
    CLASSES.map((group) => [group, summarizeDistribution(values[group])]),
  ) as Record<DarknessAnchorClass, DarknessDistribution>;
  const dark = distributions.dark_reference;
  const mid = distributions.mid_reference;
  const urban = distributions.urban_control;
  if (!(dark.median < mid.median && mid.median < urban.median)) {
    throw new Error("Anchor group medians must increase from dark to intermediate to urban");
  }

  const curve: DarknessCurvePoint[] = [
    { alanExposure: dark.p10, darknessScore: 100 },
    { alanExposure: dark.median, darknessScore: 90 },
    { alanExposure: mid.median, darknessScore: 50 },
    { alanExposure: urban.median, darknessScore: 10 },
    { alanExposure: urban.p90, darknessScore: 0 },
  ];
  assertStrictlyIncreasing(curve);

  return {
    version: 1,
    status: "calibrated",
    method: "robust-anchor-median-piecewise-linear-v1",
    calibratedAt,
    blackMarbleYears: (commonYears ?? "").split(",").filter(Boolean).map(Number),
    anchorConfigVersion: options.anchorConfig.version,
    anchorCount: options.anchorConfig.anchors.length,
    distributions,
    curve,
    labels: DARKNESS_LABELS,
  };
}

export function darknessScoreForExposure(alanExposure: number, config: DarknessCurveConfig) {
  if (config.status !== "calibrated") throw new Error("Darkness calibration is not available");
  if (!Number.isFinite(alanExposure) || alanExposure < 0) throw new Error("ALAN exposure must be a non-negative finite number");
  const points = config.curve;
  if (alanExposure <= points[0].alanExposure) return points[0].darknessScore;
  if (alanExposure >= points[points.length - 1].alanExposure) return points[points.length - 1].darknessScore;
  for (let index = 1; index < points.length; index += 1) {
    const right = points[index];
    const left = points[index - 1];
    if (alanExposure <= right.alanExposure) {
      const fraction = (alanExposure - left.alanExposure) / (right.alanExposure - left.alanExposure);
      return round(left.darknessScore + fraction * (right.darknessScore - left.darknessScore), 2);
    }
  }
  throw new Error("Darkness curve interpolation failed");
}

export function applyDarknessCurve(snapshot: BlackMarbleSnapshot, config: DarknessCurveConfig): BlackMarbleSnapshot {
  if (config.status !== "calibrated") throw new Error("Darkness calibration is not available");
  if (snapshot.alanExposure === null) throw new Error(`${snapshot.siteId}: ALAN exposure is required for darkness scoring`);
  if (config.blackMarbleYears.join(",") !== snapshot.blackMarbleYears.join(",")) {
    throw new Error(`Darkness curve baseline years do not match ${snapshot.siteId}`);
  }
  return {
    ...snapshot,
    darknessScore: darknessScoreForExposure(snapshot.alanExposure, config),
  };
}

export function darknessLabelForScore(score: number, config: DarknessCurveConfig) {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("Darkness score must be between zero and 100");
  return config.labels.find((band) => score >= band.minimumScore)?.label ?? "Bright surroundings";
}
