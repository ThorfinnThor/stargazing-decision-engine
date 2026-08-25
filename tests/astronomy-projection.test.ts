import assert from "node:assert/strict";
import test from "node:test";

import { AstroTime, HorizonFromVector, Observer, RotateVector, Rotation_EQJ_HOR, Vector } from "astronomy-engine";

import { brightLimbScreenAngle, phaseIlluminatedFraction, projectFullSky } from "../lib/astronomy/projection.js";
import { transformCatalogStar } from "../lib/astronomy/compute-sky.js";
import type { CatalogStar } from "../lib/astronomy/types.js";

test("full-sky projection keeps zenith centered and cardinal directions oriented", () => {
  const zenith = projectFullSky(90, 127)!;
  assert.ok(Math.abs(zenith.xNormalized) < 1e-12 && Math.abs(zenith.yNormalized) < 1e-12);
  const north = projectFullSky(0, 0)!;
  const east = projectFullSky(0, 90)!;
  const south = projectFullSky(0, 180)!;
  const west = projectFullSky(0, 270)!;
  assert.ok(Math.abs(north.xNormalized) < 1e-12 && Math.abs(north.yNormalized + 1) < 1e-12);
  assert.ok(Math.abs(east.xNormalized + 1) < 1e-12 && Math.abs(east.yNormalized) < 1e-12);
  assert.ok(Math.abs(south.xNormalized) < 1e-12 && Math.abs(south.yNormalized - 1) < 1e-12);
  assert.ok(Math.abs(west.xNormalized - 1) < 1e-12 && Math.abs(west.yNormalized) < 1e-12);
  const midAltitude = projectFullSky(45, 90)!;
  assert.ok(Math.abs(midAltitude.xNormalized + 0.5) < 1e-12);
  assert.ok(Math.hypot(midAltitude.xNormalized, midAltitude.yNormalized) <= 1);
  assert.equal(projectFullSky(-0.01, 0), null);
  assert.equal(projectFullSky(Number.NaN, 0), null);
});

test("Moon phase illumination follows Astronomy Engine phase convention", () => {
  assert.equal(phaseIlluminatedFraction(0), 0);
  assert.ok(Math.abs(phaseIlluminatedFraction(90) - 0.5) < 1e-12);
  assert.equal(phaseIlluminatedFraction(180), 1);
  assert.ok(Math.abs(phaseIlluminatedFraction(270) - 0.5) < 1e-12);
  assert.ok(phaseIlluminatedFraction(720) >= 0 && phaseIlluminatedFraction(720) <= 1);
  assert.throws(() => phaseIlluminatedFraction(Number.NaN));
});

test("bright-limb direction remains finite and points toward projected Sun tangent", () => {
  const moon = { altitudeDeg: 45, azimuthDeg: 180, aboveHorizon: true };
  const sun = { altitudeDeg: 20, azimuthDeg: 120, aboveHorizon: true };
  const angle = brightLimbScreenAngle(moon, sun);
  assert.notEqual(angle, null);
  assert.ok(Number.isFinite(angle));
  const moonPoint = projectFullSky(moon.altitudeDeg, moon.azimuthDeg)!;
  const sunPoint = projectFullSky(sun.altitudeDeg, sun.azimuthDeg)!;
  const towardSunX = sunPoint.xNormalized - moonPoint.xNormalized;
  const towardSunY = sunPoint.yNormalized - moonPoint.yNormalized;
  assert.ok(Math.cos(angle!) * towardSunX + Math.sin(angle!) * towardSunY > 0);
  assert.equal(brightLimbScreenAngle(moon, moon), null);
});

test("optimized EQJ to horizontal transform matches Astronomy Engine reference", () => {
  const instant = new Date("2027-01-01T00:00:00.000Z");
  const observer = new Observer(52.72, 12.28, 45);
  const rotation = Rotation_EQJ_HOR(instant, observer);
  const vectors = [[0.321, -0.4, 0.858], [-0.73, 0.21, 0.65], [0.1, 0.98, -0.17]];
  for (const [index, vector] of vectors.entries()) {
    const star: CatalogStar = { id: index + 1, xEqj: vector[0], yEqj: vector[1], zEqj: vector[2], magnitude: 1, colorIndex: null };
    const length = Math.hypot(star.xEqj, star.yEqj, star.zEqj);
    star.xEqj /= length; star.yEqj /= length; star.zEqj /= length;
    const optimized = transformCatalogStar(star, rotation);
    const referenceVector = RotateVector(rotation, new Vector(star.xEqj, star.yEqj, star.zEqj, new AstroTime(instant)));
    const reference = HorizonFromVector(referenceVector, null as unknown as string);
    assert.ok(Math.abs(optimized.altitudeDeg - reference.lat) < 1e-10);
    assert.ok(Math.abs(optimized.azimuthDeg - reference.lon) < 1e-10);
  }
});

test("Polaris is above Westhavelland and below a southern desert horizon", () => {
  const ra = 2.530301028 * 15 * Math.PI / 180;
  const dec = 89.264109444 * Math.PI / 180;
  const polaris: CatalogStar = { id: 11767, xEqj: Math.cos(dec) * Math.cos(ra), yEqj: Math.cos(dec) * Math.sin(ra), zEqj: Math.sin(dec), magnitude: 1.98, colorIndex: 0.6 };
  const instant = new Date("2027-01-01T00:00:00.000Z");
  const north = transformCatalogStar(polaris, Rotation_EQJ_HOR(instant, new Observer(52.72, 12.28, 45)));
  const south = transformCatalogStar(polaris, Rotation_EQJ_HOR(instant, new Observer(-24.95, 15.89, 1000)));
  assert.ok(north.altitudeDeg > 50);
  assert.ok(south.altitudeDeg < -20);
});
