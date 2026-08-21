import { Observer, RotateVector, Rotation_EQJ_HOR, SphereFromVector, Spherical, VectorFromSphere } from "astronomy-engine";
import type { CurvePoint } from "../scoring/types.js";

export interface MilkyWayConfig {
  coordinateVersion: number;
  frame: "J2000";
  raHours: number;
  decDeg: number;
  minimumUsefulAltitudeDeg: number;
  strongAltitudeDeg: number;
  durationCurve: CurvePoint[];
  altitudeCurve: CurvePoint[];
  referenceStatus: "pending_sol_review" | "approved";
  referenceSource: string;
  referenceNotes: string;
}

export interface MilkyWayMetrics {
  usefulHours: number;
  strongHours: number;
  maximumAltitudeDeg: number | null;
  opportunityScore: number | null;
}

function scoreCurve(input: number, curve: CurvePoint[]) {
  if (input <= curve[0][0]) return curve[0][1];
  if (input >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
  for (let index = 1; index < curve.length; index += 1) {
    const [rightInput, rightScore] = curve[index];
    const [leftInput, leftScore] = curve[index - 1];
    if (input <= rightInput) {
      const fraction = (input - leftInput) / (rightInput - leftInput);
      return leftScore + fraction * (rightScore - leftScore);
    }
  }
  throw new Error("Milky Way score interpolation failed");
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function validateMilkyWayConfig(config: MilkyWayConfig) {
  if (!Number.isInteger(config.coordinateVersion) || config.coordinateVersion < 1) throw new Error("Milky Way coordinate version is invalid");
  if (config.frame !== "J2000") throw new Error("Milky Way V1 requires a J2000 coordinate frame");
  if (!Number.isFinite(config.raHours) || config.raHours < 0 || config.raHours >= 24) throw new Error("Milky Way right ascension must be in [0, 24) hours");
  if (!Number.isFinite(config.decDeg) || config.decDeg < -90 || config.decDeg > 90) throw new Error("Milky Way declination is invalid");
  if (!(config.minimumUsefulAltitudeDeg >= 0 && config.strongAltitudeDeg > config.minimumUsefulAltitudeDeg && config.strongAltitudeDeg <= 90)) {
    throw new Error("Milky Way altitude thresholds are invalid");
  }
  for (const [name, curve] of [["duration", config.durationCurve], ["altitude", config.altitudeCurve]] as const) {
    if (curve.length < 2) throw new Error(`Milky Way ${name} curve requires at least two points`);
    for (let index = 0; index < curve.length; index += 1) {
      const [input, score] = curve[index];
      if (!Number.isFinite(input) || !Number.isFinite(score) || input < 0 || score < 0 || score > 100) throw new Error(`Milky Way ${name} curve contains an invalid point`);
      if (index > 0 && (input <= curve[index - 1][0] || score < curve[index - 1][1])) throw new Error(`Milky Way ${name} curve must be increasing`);
    }
  }
  if (config.referenceStatus !== "pending_sol_review" && config.referenceStatus !== "approved") throw new Error("Milky Way reference status is invalid");
  if (!config.referenceSource.trim() || !config.referenceNotes.trim()) throw new Error("Milky Way reference provenance is required");
  try {
    if (new URL(config.referenceSource).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("Milky Way reference source must be an HTTPS URL");
  }
}

export function j2000AltitudeDeg(date: Date, observer: Observer, raHours: number, decDeg: number) {
  // Fixed EQJ (J2000) angles must be converted explicitly to the observer's
  // horizon; Horizon() expects equator-of-date angular coordinates.
  const equatorialJ2000 = VectorFromSphere(new Spherical(decDeg, raHours * 15, 1), date);
  const horizontal = RotateVector(Rotation_EQJ_HOR(date, observer), equatorialJ2000);
  return SphereFromVector(horizontal).lat;
}

export function galacticCenterAltitudeDeg(date: Date, observer: Observer, config: MilkyWayConfig) {
  return j2000AltitudeDeg(date, observer, config.raHours, config.decDeg);
}

export function buildMilkyWayMetrics(options: {
  intervals: Array<{ durationHours: number; astronomicalDark: boolean; moonless: boolean; galacticCenterAltitudeDeg: number }>;
  config: MilkyWayConfig;
}): MilkyWayMetrics {
  validateMilkyWayConfig(options.config);
  for (const interval of options.intervals) {
    if (!Number.isFinite(interval.durationHours) || interval.durationHours <= 0) throw new Error("Milky Way interval duration must be positive");
    if (!Number.isFinite(interval.galacticCenterAltitudeDeg) || interval.galacticCenterAltitudeDeg < -90 || interval.galacticCenterAltitudeDeg > 90) {
      throw new Error("Milky Way interval altitude is outside physical bounds");
    }
  }
  const dark = options.intervals.filter((interval) => interval.astronomicalDark);
  if (dark.length === 0) return { usefulHours: 0, strongHours: 0, maximumAltitudeDeg: null, opportunityScore: 0 };
  const useful = dark.filter((interval) => interval.moonless && interval.galacticCenterAltitudeDeg >= options.config.minimumUsefulAltitudeDeg);
  const strong = dark.filter((interval) => interval.moonless && interval.galacticCenterAltitudeDeg >= options.config.strongAltitudeDeg);
  const usefulHours = useful.reduce((sum, interval) => sum + interval.durationHours, 0);
  const strongHours = strong.reduce((sum, interval) => sum + interval.durationHours, 0);
  const maximumAltitudeDeg = Math.max(...dark.map((interval) => interval.galacticCenterAltitudeDeg));
  const opportunityScore = round(0.6 * scoreCurve(usefulHours, options.config.durationCurve) + 0.4 * scoreCurve(maximumAltitudeDeg, options.config.altitudeCurve));
  return { usefulHours: round(usefulHours), strongHours: round(strongHours), maximumAltitudeDeg: round(maximumAltitudeDeg), opportunityScore };
}
