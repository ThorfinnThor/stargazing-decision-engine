import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

import type { Destination, ObservationSite } from "../../lib/data/types.js";
import { computeSky } from "../../lib/astronomy/compute-sky.js";
import { constellationCopyById } from "../../lib/astronomy/constellation-copy.js";
import { createSkyLocation, resolvePrimaryObservationSite } from "../../lib/astronomy/primary-site.js";
import { validateNightPlannerConfig, type NightPlannerConfig } from "../../lib/astronomy/night-planner.js";
import type { BrightStarCatalog, ConstellationDatasetFile, NightPreviewFile } from "../../lib/astronomy/types.js";
import { isValidInstantIso } from "../../lib/astronomy/validation.js";
import { publicDataDir, readJson } from "../pipeline/io.js";

const catalogPath = resolve(publicDataDir, "astronomy/bright-stars.json");
const catalog = readJson<BrightStarCatalog>(catalogPath);
const constellationFile = readJson<ConstellationDatasetFile>(resolve(publicDataDir, "astronomy/constellation-lines-western.json"));
const previewFile = readJson<NightPreviewFile>(resolve(publicDataDir, "astronomy/night-previews.json"));
const destinations = readJson<Destination[]>(resolve(publicDataDir, "destinations/index.json"));
const sites = readJson<ObservationSite[]>(resolve(publicDataDir, "sites/index.json"));
const nightPlannerConfig = readJson<NightPlannerConfig>(resolve(process.cwd(), "data-config/astronomy/night-planner.json"));
const errors: string[] = [];

try { validateNightPlannerConfig(nightPlannerConfig); } catch (error) { errors.push(error instanceof Error ? error.message : "night planner config is invalid"); }

if (catalog.source.license !== "CC BY-SA 4.0"
  || catalog.source.sourceCommit !== "ba2dec4eb0f6768914c7fc1051258100214ddf84"
  || catalog.source.upstreamSha256 !== "d9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd") errors.push("star catalog provenance mismatch");
if (catalog.version !== 2 || catalog.source.idSystem !== "HIP" || catalog.source.magnitudeCutoff !== 6 || catalog.source.constellationAnchorMagnitudeCeiling !== 6.5 || catalog.stars.length !== 5041) errors.push("star catalog contract or count drifted");
if (constellationFile.source.license !== "CC BY-SA 4.0"
  || constellationFile.source.sourceCommit !== "014fbb5e59233d133c22f9811af96b67d05a95c9"
  || constellationFile.source.upstreamSha256 !== "a861accd345249a185a5ecfc2a516f34291c0aa52f4bb8d8337ffc53e9cef6b9") errors.push("constellation provenance mismatch");
if (constellationFile.skyCulture !== "western" || constellationFile.constellations.length !== 18) errors.push("constellation dataset contract drifted");
const catalogBytes = readFileSync(catalogPath);
if (catalogBytes.byteLength > 300_000) errors.push("star catalog exceeds the 300 KB uncompressed guardrail");
if (gzipSync(catalogBytes).byteLength > 150_000) errors.push("star catalog exceeds the 150 KB gzip guardrail");
for (const [index, star] of catalog.stars.entries()) {
  if (star.length !== 6 || star.some((value, field) => field !== 5 && !Number.isFinite(value))) errors.push(`catalog star ${index} is invalid`);
  const length = Math.hypot(star[1], star[2], star[3]);
  if (Math.abs(length - 1) > 2e-7) errors.push(`catalog star ${star[0]} vector is not normalized`);
  if (star[4] > catalog.source.constellationAnchorMagnitudeCeiling) errors.push(`catalog star ${star[0]} exceeds magnitude ceiling`);
}
if (new Set(catalog.stars.map((star) => star[0])).size !== catalog.stars.length) errors.push("catalog IDs are not unique");
const starIds = new Set(catalog.stars.map((star) => star[0]));
const constellationIds = new Set<string>();
for (const constellation of constellationFile.constellations) {
  if (constellationIds.has(constellation.id)) errors.push(`constellation ID ${constellation.id} is duplicated`);
  constellationIds.add(constellation.id);
  if (!constellationCopyById.has(constellation.explanationId)) errors.push(`${constellation.id}: curated copy missing`);
  if (constellation.linePaths.length === 0) errors.push(`${constellation.id}: line paths missing`);
  for (const path of constellation.linePaths) {
    if (path.starIds.length < 2) errors.push(`${constellation.id}: invalid line path`);
    for (const anchorId of path.starIds) if (!starIds.has(anchorId)) errors.push(`${constellation.id}: HIP ${anchorId} missing from star catalog`);
  }
}
if (previewFile.previews.length !== destinations.filter((item) => item.active).length) errors.push("preview coverage does not match active destinations");
if (new Set(previewFile.previews.map((preview) => preview.id)).size !== previewFile.previews.length) errors.push("preview IDs are not unique");
for (const preview of previewFile.previews) {
  const destination = destinations.find((item) => item.id === preview.destinationId && item.slug === preview.destinationSlug);
  if (!destination) { errors.push(`${preview.id}: destination missing`); continue; }
  const site = resolvePrimaryObservationSite(destination, sites);
  if (!site || site.id !== preview.siteId) { errors.push(`${preview.id}: primary site mismatch`); continue; }
  const location = createSkyLocation(destination, site);
  if (!location || !isValidInstantIso(preview.instantIso)) { errors.push(`${preview.id}: location or instant invalid`); continue; }
  try { new Intl.DateTimeFormat("en", { timeZone: location.timeZone }).format(new Date(preview.instantIso)); } catch { errors.push(`${preview.id}: timezone formatting failed`); }
  const snapshot = computeSky(location, preview.instantIso);
  if (snapshot.sun.altitudeDeg > -18 || Math.abs(snapshot.sun.altitudeDeg - preview.sunAltitudeDeg) > 1e-5) errors.push(`${preview.id}: Sun altitude is not a validated astronomical night`);
  if (snapshot.stars.length < 500 || snapshot.stars.length !== preview.minimumVisibleStarCount) errors.push(`${preview.id}: visible star count mismatch`);
  if (snapshot.stars.some((star) => !Number.isFinite(star.xNormalized) || !Number.isFinite(star.yNormalized))) errors.push(`${preview.id}: non-finite projected star`);
}

if (errors.length) { errors.forEach((error) => console.error(error)); process.exitCode = 1; }
else console.log(`Validated ${catalog.stars.length} licensed HIP stars, ${constellationFile.constellations.length} Western constellations, and ${previewFile.previews.length} deterministic night previews.`);
