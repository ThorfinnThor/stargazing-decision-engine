import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

import type { Destination, ObservationSite } from "../../lib/data/types.js";
import { computeSky } from "../../lib/astronomy/compute-sky.js";
import { constellationCopyById } from "../../lib/astronomy/constellation-copy.js";
import { createSkyLocation, resolvePrimaryObservationSite } from "../../lib/astronomy/primary-site.js";
import { validateNightPlannerConfig, type NightPlannerConfig } from "../../lib/astronomy/night-planner.js";
import type { BrightStarCatalog, ConstellationDatasetFile, FaintStarCatalog, NightPreviewFile } from "../../lib/astronomy/types.js";
import { isValidInstantIso } from "../../lib/astronomy/validation.js";
import { darkestSky, referenceCities, type CitySkyFile } from "../../lib/astronomy/light-pollution.js";
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
const faintPath = resolve(publicDataDir, "astronomy/faint-stars.json");
const faintCatalog = readJson<FaintStarCatalog>(faintPath);
if (faintCatalog.version !== 1 || faintCatalog.source.upstreamSha256 !== catalog.source.upstreamSha256 || faintCatalog.source.magnitudeFloor !== 6 || faintCatalog.source.magnitudeCutoff !== 6.5 || faintCatalog.stars.length !== 3829) errors.push("faint star catalog contract or count drifted");
const faintBytes = readFileSync(faintPath);
if (gzipSync(faintBytes).byteLength > 100_000) errors.push("faint star catalog exceeds the 100 KB gzip guardrail");
const brightIds = new Set(catalog.stars.map((star) => star[0]));
for (const star of faintCatalog.stars) {
  if (star[4] <= 6 || star[4] > 6.5) errors.push(`faint star ${star[0]} is outside magnitude 6–6.5`);
  if (brightIds.has(star[0])) errors.push(`faint star ${star[0]} duplicates a bright catalog star`);
}
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

// The city estimates only exist once the Black Marble city fetch has run; until then the
// comparison page falls back to its reference cities.
const citySkyPath = resolve(publicDataDir, "astronomy/city-sky.json");
let citySkySummary = "no city sky estimates yet";
if (existsSync(citySkyPath)) {
  const citySky = readJson<CitySkyFile>(citySkyPath);
  const configured = readJson<{ cities: { id: string }[] }>(resolve(process.cwd(), "data-config/astronomy/comparison-cities.json")).cities;
  const ids = new Set(citySky.cities.map((row) => row[0]));
  if (citySky.version !== 1) errors.push("city sky file version drifted");
  if (ids.size !== citySky.cities.length) errors.push("city sky ids are not unique");
  if (citySky.cities.length < configured.length * 0.9) errors.push(`city sky covers only ${citySky.cities.length} of ${configured.length} configured cities`);
  for (const city of referenceCities) if (!ids.has(city.id)) errors.push(`city sky is missing reference city ${city.id} (shared links use it)`);
  for (const [id, en, , country, lat, lon, timeZone, magnitude] of citySky.cities) {
    if (!en || !/^[A-Z]{2}$/.test(country) || Math.abs(lat) > 90 || Math.abs(lon) > 180) errors.push(`${id}: city sky row is malformed`);
    if (!(magnitude >= 4 && magnitude <= darkestSky.limitingMagnitude)) errors.push(`${id}: limiting magnitude ${magnitude} is outside 4–${darkestSky.limitingMagnitude}`);
    try { new Intl.DateTimeFormat("en", { timeZone }).format(0); } catch { errors.push(`${id}: unknown time zone ${timeZone}`); }
  }
  if (gzipSync(readFileSync(citySkyPath)).byteLength > 80_000) errors.push("city sky file exceeds the 80 KB gzip guardrail");
  citySkySummary = `${citySky.cities.length} city sky estimates`;
}

if (errors.length) { errors.forEach((error) => console.error(error)); process.exitCode = 1; }
else console.log(`Validated ${catalog.stars.length} licensed HIP stars, ${constellationFile.constellations.length} Western constellations, ${previewFile.previews.length} deterministic night previews, and ${citySkySummary}.`);
