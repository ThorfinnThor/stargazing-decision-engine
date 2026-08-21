import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const root = process.cwd();
export const generatedDir = resolve(root, "generated/intermediate");
export const publicDataDir = resolve(root, "public/data/stargazing");
export const seedGeneratedAt = "2026-08-20T00:00:00.000Z";

export function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, value: unknown) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function generatedPath(fileName: string) {
  return resolve(generatedDir, fileName);
}

export function publicPath(relativePath: string) {
  return resolve(publicDataDir, relativePath);
}

export function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
