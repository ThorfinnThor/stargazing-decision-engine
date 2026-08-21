import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { Era5ClimateSnapshot } from "../../lib/climate/era5/types.js";
import type { ObservationSite } from "../../lib/data/types.js";
import type { BlackMarbleSnapshot } from "../../lib/darkness/black-marble/types.js";
import type { DemSnapshot } from "../../lib/elevation/dem/types.js";
import { scoreSite } from "../../lib/scoring/site-score.js";
import { readJson, root, writeJson } from "../pipeline/io.js";
import { loadSiteScoreConfig } from "./score-config.js";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const siteSlug = argument("--site");
if (!siteSlug) throw new Error("Usage: pnpm data:score:real -- --site <site-slug>");
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const site = sites.find((item) => item.slug === siteSlug);
if (!site) throw new Error(`Unknown site slug: ${siteSlug}`);

const climate = readJson<Era5ClimateSnapshot>(resolve(root, "data-snapshots/climate", `${siteSlug}.json`));
const darkness = readJson<BlackMarbleSnapshot>(resolve(root, "data-snapshots/black-marble", `${siteSlug}.json`));
const demPath = resolve(root, "data-snapshots/dem", `${siteSlug}.json`);
const dem = existsSync(demPath) ? readJson<DemSnapshot>(demPath) : null;
const months = scoreSite({ site, climate, darkness, dem, config: loadSiteScoreConfig() });
const generatedAt = [climate.retrievedAt, darkness.retrievedAt, dem?.retrievedAt ?? ""].sort().at(-1) as string;
writeJson(resolve(root, "data-snapshots/scores", `${siteSlug}.json`), {
  siteId: site.id,
  algorithmVersion: "site-score-1.0.0",
  generatedAt,
  months,
});
console.log(`Scored 12 real-data months for ${siteSlug}.`);
