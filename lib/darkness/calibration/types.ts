import type { BlackMarbleSnapshot } from "../black-marble/types.js";

export type DarknessAnchorClass = "dark_reference" | "mid_reference" | "urban_control";

export interface DarknessAnchor {
  id: string;
  lat: number;
  lon: number;
  class: DarknessAnchorClass;
  source: string;
  notes: string;
  operatorApproved: boolean;
}

export interface DarknessAnchorConfig {
  version: number;
  status: "operator_review_pending" | "approved";
  minimumClassCounts: Record<DarknessAnchorClass, number>;
  anchors: DarknessAnchor[];
}

export interface DarknessDistribution {
  count: number;
  minimum: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  maximum: number;
  mad: number;
}

export interface DarknessCurvePoint {
  alanExposure: number;
  darknessScore: number;
}

export interface DarknessLabelBand {
  minimumScore: number;
  label: "Very dark" | "Dark" | "Moderate artificial light" | "Bright surroundings";
}

export interface PendingDarknessCurve {
  version: number;
  status: "awaiting_calibration";
  reason: string;
  curve: [];
  labels: DarknessLabelBand[];
}

export interface CalibratedDarknessCurve {
  version: number;
  status: "calibrated";
  method: "robust-anchor-median-piecewise-linear-v1";
  calibratedAt: string;
  blackMarbleYears: number[];
  anchorConfigVersion: number;
  anchorCount: number;
  distributions: Record<DarknessAnchorClass, DarknessDistribution>;
  curve: DarknessCurvePoint[];
  labels: DarknessLabelBand[];
}

export type DarknessCurveConfig = PendingDarknessCurve | CalibratedDarknessCurve;

export type DarknessAnchorSnapshot = BlackMarbleSnapshot;
