import { resolve } from "node:path";

import type { SiteScoreConfig } from "../../lib/scoring/types.js";
import { readJson, root } from "../pipeline/io.js";

export function loadSiteScoreConfig(): SiteScoreConfig {
  const directory = resolve(root, "data-config/scoring");
  return {
    weights: readJson(resolve(directory, "weights.json")),
    cloud: readJson(resolve(directory, "cloud.json")),
    dew: readJson(resolve(directory, "dew.json")),
    elevation: readJson(resolve(directory, "elevation.json")),
    temperature: readJson(resolve(directory, "temperature.json")),
    wind: readJson(resolve(directory, "wind.json")),
    rain: readJson(resolve(directory, "rain.json")),
    confidence: readJson(resolve(directory, "confidence.json")),
  };
}
