import { Body, Equator, Horizon, MoonPhase, Observer, Rotation_EQJ_HOR } from "astronomy-engine";

import { brightStars } from "./catalog";
import { westernConstellations } from "./constellations";
import { projectConstellations, type TransformedCatalogStar } from "./constellation-transform";
import { assertValidInstant, assertValidSkyLocation } from "./validation";
import { brightLimbScreenAngle, clamp, horizontalFromVector, horizontalVector, phaseIlluminatedFraction, projectFullSky } from "./projection";
import { classifySkyCondition, getEffectiveLimitingMagnitude, starVisualStyle } from "./visibility";
import type { CatalogStar, HorizontalPosition, ProjectedStar, SkyLocation, SkySnapshot } from "./types";

function bodyHorizontal(body: Body, instant: Date, observer: Observer): HorizontalPosition {
  const eq = Equator(body, instant, observer, true, true);
  const horizontal = Horizon(instant, observer, eq.ra, eq.dec);
  return { altitudeDeg: horizontal.altitude, azimuthDeg: horizontal.azimuth, aboveHorizon: horizontal.altitude > 0 };
}

export function computeSunHorizontal(location: SkyLocation, instantIso: string) {
  assertValidSkyLocation(location);
  const instant = assertValidInstant(instantIso);
  return bodyHorizontal(Body.Sun, instant, new Observer(location.lat, location.lon, location.elevationM ?? 0));
}

export function transformCatalogStar(star: CatalogStar, rotation: { rot: number[][] }) {
  return horizontalFromVector(transformCatalogVector(star, rotation));
}

export function transformCatalogVector(star: CatalogStar, rotation: { rot: number[][] }) {
  const r = rotation.rot;
  return {
    x: r[0][0] * star.xEqj + r[1][0] * star.yEqj + r[2][0] * star.zEqj,
    y: r[0][1] * star.xEqj + r[1][1] * star.yEqj + r[2][1] * star.zEqj,
    z: r[0][2] * star.xEqj + r[1][2] * star.yEqj + r[2][2] * star.zEqj,
  };
}

export function computeSky(location: SkyLocation, instantIso: string, stars: readonly CatalogStar[] = brightStars): SkySnapshot {
  assertValidSkyLocation(location);
  const instant = assertValidInstant(instantIso);
  const observer = new Observer(location.lat, location.lon, location.elevationM ?? 0);
  const sun = bodyHorizontal(Body.Sun, instant, observer);
  const moonPosition = bodyHorizontal(Body.Moon, instant, observer);
  const baseLimitingMagnitude = clamp(location.limitingMagnitude ?? 6, -2, 6.5);
  const effectiveLimitingMagnitude = getEffectiveLimitingMagnitude({ baseLimitingMagnitude, sunAltitudeDeg: sun.altitudeDeg });
  const rotation = Rotation_EQJ_HOR(instant, observer);
  const projected: ProjectedStar[] = [];
  const transformedByStarId = new Map<number, TransformedCatalogStar>();
  for (const star of stars) {
    const vector = transformCatalogVector(star, rotation);
    const horizontal = horizontalFromVector(vector);
    const point = horizontal.aboveHorizon ? projectFullSky(horizontal.altitudeDeg, horizontal.azimuthDeg) : null;
    const likelyVisible = horizontal.aboveHorizon && star.magnitude <= effectiveLimitingMagnitude;
    transformedByStarId.set(star.id, {
      horizontalVector: horizontalVector(horizontal),
      altitudeDeg: horizontal.altitudeDeg,
      azimuthDeg: horizontal.azimuthDeg,
      projected: point,
      likelyVisible,
      magnitude: star.magnitude,
    });
    if (!likelyVisible || !point) continue;
    const style = starVisualStyle(star.magnitude, effectiveLimitingMagnitude);
    projected.push({ ...point, ...horizontal, id: star.id, magnitude: star.magnitude, colorIndex: star.colorIndex, ...style });
  }
  projected.sort((left, right) => right.magnitude - left.magnitude || left.id - right.id);
  const moonPoint = moonPosition.aboveHorizon ? projectFullSky(moonPosition.altitudeDeg, moonPosition.azimuthDeg) : null;
  const phaseDeg = MoonPhase(instant);
  return {
    locationId: location.id,
    instantIso,
    sun,
    moon: {
      ...moonPosition,
      phaseDeg,
      illuminatedFraction: phaseIlluminatedFraction(phaseDeg),
      brightLimbScreenAngleRad: moonPosition.aboveHorizon ? brightLimbScreenAngle(moonPosition, sun) : null,
      xNormalized: moonPoint?.xNormalized ?? null,
      yNormalized: moonPoint?.yNormalized ?? null,
    },
    stars: projected,
    constellations: projectConstellations(westernConstellations, transformedByStarId, sun.altitudeDeg),
    effectiveLimitingMagnitude,
    skyCondition: classifySkyCondition(sun.altitudeDeg),
  };
}
