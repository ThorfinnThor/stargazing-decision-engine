import { clamp, horizontalFromVector, projectFullSky } from "./projection";
import type { ConstellationDefinition, ProjectedConstellationPoint, VisibleConstellation } from "./types";

export type Vec3 = { x: number; y: number; z: number };

export type TransformedCatalogStar = {
  horizontalVector: Vec3;
  altitudeDeg: number;
  azimuthDeg: number;
  projected: ProjectedConstellationPoint | null;
  likelyVisible: boolean;
  magnitude: number;
};

export const constellationVisibilityThresholds = {
  minimumLikelyVisibleAnchors: 3,
  minimumVisibleAnchorRatio: 0.35,
  minimumMaximumAnchorAltitudeDeg: 15,
  maximumSunAltitudeDeg: -6,
} as const;

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (!Number.isFinite(length) || length < 1e-12) throw new Error("Cannot normalize constellation vector");
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function slerp(a: Vec3, b: Vec3, amount: number): Vec3 {
  const start = normalize(a);
  const end = normalize(b);
  const cosine = clamp(start.x * end.x + start.y * end.y + start.z * end.z, -1, 1);
  const angle = Math.acos(cosine);
  if (angle < 1e-7) return normalize({ x: start.x + (end.x - start.x) * amount, y: start.y + (end.y - start.y) * amount, z: start.z + (end.z - start.z) * amount });
  const denominator = Math.sin(angle);
  const left = Math.sin((1 - amount) * angle) / denominator;
  const right = Math.sin(amount * angle) / denominator;
  return normalize({ x: left * start.x + right * end.x, y: left * start.y + right * end.y, z: left * start.z + right * end.z });
}

function sampledSegment(a: Vec3, b: Vec3) {
  const cosine = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1);
  const angleDeg = Math.acos(cosine) * 180 / Math.PI;
  const steps = Math.max(2, Math.ceil(angleDeg / 6));
  return Array.from({ length: steps + 1 }, (_, index) => slerp(a, b, index / steps));
}

function horizonIntersection(a: Vec3, b: Vec3) {
  let below = a.z <= 0 ? a : b;
  let above = a.z > 0 ? a : b;
  for (let index = 0; index < 32; index += 1) {
    const midpoint = slerp(below, above, 0.5);
    if (midpoint.z > 0) above = midpoint;
    else below = midpoint;
  }
  return normalize({ ...above, z: Math.max(0, above.z) });
}

function clipSampledSegment(samples: Vec3[]) {
  const points: Vec3[] = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const first = samples[index];
    const second = samples[index + 1];
    if (first.z > 0 && points.length === 0) points.push(first);
    if ((first.z > 0) !== (second.z > 0)) points.push(horizonIntersection(first, second));
    if (second.z > 0) points.push(second);
  }
  return points;
}

export function projectConstellations(
  definitions: readonly ConstellationDefinition[],
  transformedByStarId: ReadonlyMap<number, TransformedCatalogStar>,
  sunAltitudeDeg: number,
): VisibleConstellation[] {
  if (sunAltitudeDeg >= constellationVisibilityThresholds.maximumSunAltitudeDeg) return [];
  const visible: VisibleConstellation[] = [];
  for (const definition of definitions) {
    const anchorIds = [...new Set(definition.linePaths.flatMap((path) => path.starIds))];
    const anchors = anchorIds.flatMap((starId) => {
      const star = transformedByStarId.get(starId);
      return star ? [star] : [];
    });
    if (anchors.length !== anchorIds.length) continue;
    const aboveHorizon = anchors.filter((star) => star.altitudeDeg > 0);
    const likelyVisible = aboveHorizon.filter((star) => star.likelyVisible);
    const projectedPaths = [];
    let visibleSegmentWeight = 0;
    let totalSegmentWeight = 0;
    for (const path of definition.linePaths) {
      for (let index = 0; index < path.starIds.length - 1; index += 1) {
        const first = transformedByStarId.get(path.starIds[index]);
        const second = transformedByStarId.get(path.starIds[index + 1]);
        if (!first || !second) continue;
        const samples = sampledSegment(first.horizontalVector, second.horizontalVector);
        totalSegmentWeight += samples.length - 1;
        visibleSegmentWeight += samples.slice(0, -1).filter((sample, sampleIndex) => sample.z > 0 || samples[sampleIndex + 1].z > 0).length;
        const clipped = clipSampledSegment(samples);
        const points = clipped.flatMap((vector) => {
          const horizontal = horizontalFromVector(vector);
          const point = projectFullSky(horizontal.altitudeDeg, horizontal.azimuthDeg);
          return point ? [point] : [];
        });
        if (points.length >= 2) projectedPaths.push({ constellationId: definition.id, points, weight: path.weight });
      }
    }
    if (projectedPaths.length === 0 || aboveHorizon.length === 0) continue;
    const centerVector = normalize(aboveHorizon.reduce((sum, star) => ({
      x: sum.x + star.horizontalVector.x,
      y: sum.y + star.horizontalVector.y,
      z: sum.z + star.horizontalVector.z,
    }), { x: 0, y: 0, z: 0 }));
    const center = horizontalFromVector(centerVector);
    const label = projectFullSky(center.altitudeDeg, center.azimuthDeg);
    const visibleAnchorRatio = likelyVisible.length / anchorIds.length;
    const visibleSegmentFraction = totalSegmentWeight === 0 ? 0 : clamp(visibleSegmentWeight / totalSegmentWeight, 0, 1);
    const maxVisibleAnchorAltitudeDeg = Math.max(...likelyVisible.map((star) => star.altitudeDeg), -90);
    const recognizable = likelyVisible.length >= constellationVisibilityThresholds.minimumLikelyVisibleAnchors
      && visibleAnchorRatio >= constellationVisibilityThresholds.minimumVisibleAnchorRatio
      && maxVisibleAnchorAltitudeDeg >= constellationVisibilityThresholds.minimumMaximumAnchorAltitudeDeg;
    const altitudeScore = clamp(center.altitudeDeg / 75, 0, 1);
    const brightestMagnitude = Math.min(...likelyVisible.map((star) => star.magnitude), 6.5);
    const brightnessScore = clamp((6.5 - brightestMagnitude) / 8, 0, 1);
    const score = clamp(0.35 * visibleAnchorRatio + 0.25 * altitudeScore + 0.2 * brightnessScore + 0.2 * visibleSegmentFraction, 0, 1);
    visible.push({
      id: definition.id,
      iauAbbreviation: definition.iauAbbreviation,
      visibilityState: recognizable ? "recognizable" : "partly-visible",
      score,
      visibleAnchorCount: likelyVisible.length,
      totalAnchorCount: anchorIds.length,
      visibleAnchorRatio,
      visibleSegmentFraction,
      centerAltitudeDeg: center.altitudeDeg,
      centerAzimuthDeg: center.azimuthDeg,
      labelXNormalized: label?.xNormalized ?? null,
      labelYNormalized: label?.yNormalized ?? null,
      projectedPaths,
    });
  }
  return visible.sort((left, right) => right.score - left.score || left.iauAbbreviation.localeCompare(right.iauAbbreviation));
}

