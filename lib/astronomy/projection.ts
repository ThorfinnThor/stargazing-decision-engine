import type { HorizontalPosition } from "./types";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeAzimuth(value: number) {
  return ((value % 360) + 360) % 360;
}

export function projectFullSky(altitudeDeg: number, azimuthDeg: number) {
  if (!Number.isFinite(altitudeDeg) || !Number.isFinite(azimuthDeg) || altitudeDeg < 0 || altitudeDeg > 90) return null;
  const radial = (90 - altitudeDeg) / 90;
  const azimuth = azimuthDeg * DEG;
  return { xNormalized: -radial * Math.sin(azimuth), yNormalized: -radial * Math.cos(azimuth) };
}

export function horizontalVector(position: Pick<HorizontalPosition, "altitudeDeg" | "azimuthDeg">) {
  const altitude = position.altitudeDeg * DEG;
  const azimuth = position.azimuthDeg * DEG;
  const cosAltitude = Math.cos(altitude);
  return {
    x: cosAltitude * Math.cos(azimuth),
    y: -cosAltitude * Math.sin(azimuth),
    z: Math.sin(altitude),
  };
}

export function horizontalFromVector(vector: { x: number; y: number; z: number }): HorizontalPosition {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (!Number.isFinite(length) || length === 0) throw new Error("Cannot convert a zero horizontal vector");
  const altitudeDeg = Math.asin(clamp(vector.z / length, -1, 1)) * RAD;
  const azimuthDeg = normalizeAzimuth(Math.atan2(-vector.y, vector.x) * RAD);
  return { altitudeDeg, azimuthDeg, aboveHorizon: altitudeDeg > 0 };
}

export function phaseIlluminatedFraction(phaseDeg: number) {
  if (!Number.isFinite(phaseDeg)) throw new Error("Moon phase must be finite");
  return clamp((1 - Math.cos(phaseDeg * DEG)) / 2, 0, 1);
}

export function brightLimbScreenAngle(moon: HorizontalPosition, sun: HorizontalPosition) {
  const m = horizontalVector(moon);
  const s = horizontalVector(sun);
  const dot = m.x * s.x + m.y * s.y + m.z * s.z;
  const tangent = { x: s.x - dot * m.x, y: s.y - dot * m.y, z: s.z - dot * m.z };
  const length = Math.hypot(tangent.x, tangent.y, tangent.z);
  if (length < 1e-8) return null;
  tangent.x /= length;
  tangent.y /= length;
  tangent.z /= length;
  const epsilon = 1e-4;
  const nextLength = Math.hypot(m.x + epsilon * tangent.x, m.y + epsilon * tangent.y, m.z + epsilon * tangent.z);
  const next = horizontalFromVector({
    x: (m.x + epsilon * tangent.x) / nextLength,
    y: (m.y + epsilon * tangent.y) / nextLength,
    z: (m.z + epsilon * tangent.z) / nextLength,
  });
  const p1 = projectFullSky(moon.altitudeDeg, moon.azimuthDeg);
  const p2 = projectFullSky(next.altitudeDeg, next.azimuthDeg);
  if (!p1 || !p2) return null;
  const dx = p2.xNormalized - p1.xNormalized;
  const dy = p2.yNormalized - p1.yNormalized;
  return Math.hypot(dx, dy) < 1e-10 ? null : Math.atan2(dy, dx);
}
