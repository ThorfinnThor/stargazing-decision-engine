import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { MonthlySiteScore, ObservationSite, SiteScoreSnapshot } from "../../lib/data/types.js";
import { readJson, root } from "./io.js";

export interface RequiredRealScores {
  generatedAt: string;
  scores: MonthlySiteScore[];
  snapshots: SiteScoreSnapshot[];
}

export function selectRequiredRealScores(sites: ObservationSite[], snapshots: SiteScoreSnapshot[]): RequiredRealScores {
  const activeSites = sites.filter((site) => site.active);
  const knownSiteIds = new Set(sites.map((site) => site.id));
  const activeSiteIds = new Set(activeSites.map((site) => site.id));
  const unexpected = snapshots.filter((snapshot) => !knownSiteIds.has(snapshot.siteId)).map((snapshot) => snapshot.siteId);
  if (unexpected.length > 0) throw new Error(`Real score snapshots do not match catalog sites: ${unexpected.join(", ")}`);

  const activeSnapshots = snapshots.filter((snapshot) => activeSiteIds.has(snapshot.siteId));
  const bySite = new Map(activeSnapshots.map((snapshot) => [snapshot.siteId, snapshot]));
  const missing = activeSites.filter((site) => !bySite.has(site.id)).map((site) => site.id);
  if (missing.length > 0) throw new Error(`Real scores are required for every active site; missing: ${missing.join(", ")}`);

  for (const snapshot of activeSnapshots) {
    if (snapshot.algorithmVersion !== "site-score-1.1.0") throw new Error(`${snapshot.siteId}: unsupported real score algorithm`);
    if (snapshot.months.length !== 12 || new Set(snapshot.months.map((month) => month.month)).size !== 12) {
      throw new Error(`${snapshot.siteId}: real score snapshot must contain 12 unique months`);
    }
    if (snapshot.months.some((month) => month.siteId !== snapshot.siteId)) throw new Error(`${snapshot.siteId}: real score identity mismatch`);
  }

  const generatedAt = activeSnapshots.map((snapshot) => snapshot.generatedAt).sort().at(-1);
  if (!generatedAt) throw new Error("No real score snapshots are available");
  return { generatedAt, scores: activeSnapshots.flatMap((snapshot) => snapshot.months), snapshots: activeSnapshots };
}

export function loadRequiredRealScores(sites: ObservationSite[]): RequiredRealScores {
  const directory = resolve(root, "data-snapshots/scores");
  if (!existsSync(directory)) throw new Error("Real score snapshot directory is missing");
  const snapshots = readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => readJson<SiteScoreSnapshot>(resolve(directory, file)));
  return selectRequiredRealScores(sites, snapshots);
}
