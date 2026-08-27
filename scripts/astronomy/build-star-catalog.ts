import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";

import type { ConstellationDatasetFile } from "../../lib/astronomy/types.js";
import { root, readJson } from "../pipeline/io.js";

type SourceConfig = {
  sourceName: string; sourceVersion: string; sourceUrl: string; sourceCommit: string;
  license: "CC BY-SA 4.0"; licenseUrl: string; upstreamSha256: string;
  magnitudeCutoff: number; generatedAt: string;
};
type RawStar = { hip: string; proper: string; ra: string; dec: string; mag: string; ci: string };

const inputArg = process.argv.find((value) => value.startsWith("--input="));
if (!inputArg) throw new Error("Usage: pnpm data:astronomy:catalog --input=/absolute/path/to/hygdata_v41.csv");
const inputPath = resolve(inputArg.slice("--input=".length));
const config = readJson<SourceConfig>(resolve(root, "data-config/astronomy/star-catalog.json"));
const constellationData = readJson<ConstellationDatasetFile>(resolve(root, "public/data/stargazing/astronomy/constellation-lines-western.json"));
const anchorIds = new Set(constellationData.constellations.flatMap((constellation) => constellation.linePaths.flatMap((path) => path.starIds)));
const constellationAnchorMagnitudeCeiling = 6.5;
const bytes = readFileSync(inputPath);
const checksum = createHash("sha256").update(bytes).digest("hex");
if (checksum !== config.upstreamSha256) throw new Error(`HYG checksum mismatch: ${checksum}`);
const rows = parse(bytes, { columns: true, skip_empty_lines: true }) as RawStar[];
const stars: Array<[number, number, number, number, number, number | null]> = [];
for (const row of rows) {
  const id = Number(row.hip);
  const raHours = Number(row.ra);
  const decDeg = Number(row.dec);
  const magnitude = Number(row.mag);
  const colorIndex = row.ci.trim() === "" ? null : Number(row.ci);
  if (row.proper === "Sol" || row.hip.trim() === "" || !Number.isInteger(id) || id <= 0 || !Number.isFinite(raHours) || !Number.isFinite(decDeg) || !Number.isFinite(magnitude)) continue;
  if (raHours < 0 || raHours >= 24 || decDeg < -90 || decDeg > 90) continue;
  if (magnitude > config.magnitudeCutoff && !anchorIds.has(id)) continue;
  if (magnitude > constellationAnchorMagnitudeCeiling) throw new Error(`Constellation anchor HIP ${id} exceeds the approved magnitude ceiling`);
  if (colorIndex !== null && !Number.isFinite(colorIndex)) continue;
  const ra = raHours * 15 * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const cosDec = Math.cos(dec);
  const round = (value: number, digits: number) => Number(value.toFixed(digits));
  stars.push([id, round(cosDec * Math.cos(ra), 8), round(cosDec * Math.sin(ra), 8), round(Math.sin(dec), 8), round(magnitude, 2), colorIndex === null ? null : round(colorIndex, 3)]);
}
stars.sort((left, right) => left[4] - right[4] || left[0] - right[0]);
const output = {
  version: 2,
  source: {
    name: config.sourceName, version: config.sourceVersion, url: config.sourceUrl,
    sourceCommit: config.sourceCommit,
    license: config.license, licenseUrl: config.licenseUrl, upstreamSha256: config.upstreamSha256,
    magnitudeCutoff: config.magnitudeCutoff,
    constellationAnchorMagnitudeCeiling,
    idSystem: "HIP",
    generatedAt: config.generatedAt,
  },
  stars,
};
const outputPath = resolve(root, "public/data/stargazing/astronomy/bright-stars.json");
writeFileSync(outputPath, `${JSON.stringify(output)}\n`);
const missingAnchors = [...anchorIds].filter((anchorId) => !stars.some((star) => star[0] === anchorId));
if (missingAnchors.length > 0) throw new Error(`Missing constellation anchor HIP IDs: ${missingAnchors.join(", ")}`);
console.log(`Built ${stars.length} HYG ${config.sourceVersion} HIP stars, including ${anchorIds.size} constellation anchors.`);
