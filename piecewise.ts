import type { CurvePoint } from "./types.js";

export function assertCurve(curve: CurvePoint[], name = "curve") {
  if (curve.length < 2) throw new Error(`${name} requires at least two points`);
  for (let index = 0; index < curve.length; index += 1) {
    const [input, score] = curve[index];
    if (!Number.isFinite(input) || !Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error(`${name} contains an invalid point`);
    }
    if (index > 0 && input <= curve[index - 1][0]) throw new Error(`${name} inputs must be strictly increasing`);
  }
}

export function piecewiseScore(input: number, curve: CurvePoint[]) {
  if (!Number.isFinite(input)) throw new Error("Piecewise score input must be finite");
  assertCurve(curve);
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
  throw new Error("Piecewise interpolation failed");
}
