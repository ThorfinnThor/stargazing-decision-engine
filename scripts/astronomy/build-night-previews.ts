import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, ObservationSite } from "../../lib/data/types.js";
import { computeSky, computeSunHorizontal } from "../../lib/astronomy/compute-sky.js";
import { createSkyLocation, resolvePrimaryObservationSite } from "../../lib/astronomy/primary-site.js";
import type { NightPreview, NightPreviewFile } from "../../lib/astronomy/types.js";
import { publicDataDir, readJson } from "../pipeline/io.js";

const generatedAt = "2026-08-25T00:00:00.000Z";
const generatorVersion = "night-preview-1.0.0";
const destinations = readJson<Destination[]>(resolve(publicDataDir, "destinations/index.json"));
const sites = readJson<ObservationSite[]>(resolve(publicDataDir, "sites/index.json"));
const previews: NightPreview[] = [];
const start = Date.parse("2027-01-01T00:00:00.000Z");
const end = Date.parse("2028-01-01T00:00:00.000Z");

for (const destination of destinations.filter((item) => item.active).sort((a, b) => a.slug.localeCompare(b.slug))) {
  const site = resolvePrimaryObservationSite(destination, sites);
  if (!site) continue;
  const location = createSkyLocation(destination, site);
  if (!location) continue;
  let preview: NightPreview | null = null;
  for (let instantMs = start; instantMs < end; instantMs += 60 * 60 * 1000) {
    const instantIso = new Date(instantMs).toISOString();
    const sun = computeSunHorizontal(location, instantIso);
    if (sun.altitudeDeg > -18) continue;
    const snapshot = computeSky(location, instantIso);
    if (snapshot.stars.length < 500) continue;
    preview = {
      id: `${destination.slug}-night-2027`,
      destinationId: destination.id,
      destinationSlug: destination.slug,
      siteId: site.id,
      instantIso,
      sunAltitudeDeg: Number(sun.altitudeDeg.toFixed(6)),
      minimumVisibleStarCount: snapshot.stars.length,
      generatedAt,
      generatorVersion,
    };
    break;
  }
  if (!preview) throw new Error(`No validated night preview found for ${destination.slug}`);
  previews.push(preview);
}

const output: NightPreviewFile = { version: 1, generatedAt, generatorVersion, previews };
writeFileSync(resolve(publicDataDir, "astronomy/night-previews.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${previews.length} deterministic night previews.`);
