import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { AffiliateConfig } from "../data/types.js";

export function loadAffiliateConfig(): AffiliateConfig {
  return JSON.parse(readFileSync(resolve(process.cwd(), "data-config/sources/affiliate-partners.json"), "utf8")) as AffiliateConfig;
}
