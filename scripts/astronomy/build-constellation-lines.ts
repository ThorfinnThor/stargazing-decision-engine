import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ConstellationDatasetFile, ConstellationLinePath } from "../../lib/astronomy/types.js";
import { readJson, root } from "../pipeline/io.js";

type ConstellationConfig = {
  version: 1;
  skyCulture: "western";
  sourceName: string;
  sourceUrl: string;
  sourceCommit: string;
  upstreamSha256: string;
  license: "CC BY-SA 4.0";
  licenseUrl: string;
  generatedAt: string;
  includedConstellations: Array<{
    iau: string;
    id: string;
    nameEn: string;
    nameDe: string;
  }>;
};

type StellariumConstellation = {
  id: string;
  iau: string;
  lines: Array<Array<number | "thin" | "bold">>;
};

type StellariumSkyCulture = {
  constellations: StellariumConstellation[];
};

const inputArg = process.argv.find((value) => value.startsWith("--input="));
if (!inputArg) {
  throw new Error("Usage: pnpm data:astronomy:constellations --input=/absolute/path/to/western/index.json");
}

const inputPath = resolve(inputArg.slice("--input=".length));
const config = readJson<ConstellationConfig>(resolve(root, "data-config/astronomy/constellations.json"));
const bytes = readFileSync(inputPath);
const checksum = createHash("sha256").update(bytes).digest("hex");
if (checksum !== config.upstreamSha256) {
  throw new Error(`Stellarium sky-culture checksum mismatch: ${checksum}`);
}

const source = JSON.parse(bytes.toString("utf8")) as StellariumSkyCulture;
const sourceByIau = new Map(source.constellations.map((constellation) => [constellation.iau, constellation]));
const constellations = config.includedConstellations.map((included) => {
  const upstream = sourceByIau.get(included.iau);
  if (!upstream) throw new Error(`Configured constellation ${included.iau} is missing from the pinned sky culture`);
  const linePaths = upstream.lines.map((rawPath) => {
    const weight: ConstellationLinePath["weight"] = typeof rawPath[0] === "string" ? rawPath[0] : "normal";
    const path = typeof rawPath[0] === "string" ? rawPath.slice(1) : rawPath;
    if (!Array.isArray(path) || path.some((starId) => !Number.isInteger(starId) || Number(starId) <= 0)) {
      throw new Error(`${included.iau} has an invalid HIP line path`);
    }
    const starIds = (path as number[]).filter((starId, index) => index === 0 || starId !== path[index - 1]);
    if (starIds.length < 2) throw new Error(`${included.iau} has a line path with fewer than two distinct anchors`);
    return { starIds, weight };
  });
  if (linePaths.length === 0) throw new Error(`${included.iau} has no line paths`);
  return {
    id: included.id,
    skyCulture: config.skyCulture,
    iauAbbreviation: included.iau,
    names: { de: included.nameDe, en: included.nameEn },
    linePaths,
    explanationId: included.id,
  };
});

const output: ConstellationDatasetFile = {
  version: 1,
  skyCulture: config.skyCulture,
  source: {
    name: config.sourceName,
    url: config.sourceUrl,
    sourceCommit: config.sourceCommit,
    license: config.license,
    licenseUrl: config.licenseUrl,
    upstreamSha256: config.upstreamSha256,
    generatedAt: config.generatedAt,
  },
  constellations,
};

const outputPath = resolve(root, "public/data/stargazing/astronomy/constellation-lines-western.json");
writeFileSync(outputPath, `${JSON.stringify(output)}\n`);
console.log(`Built ${constellations.length} Western constellations from the pinned Stellarium sky culture.`);
