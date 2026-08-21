import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { publicDataDir, readJson, root, writeJson } from "../pipeline/io.js";

interface DatasetManifest {
  counts: Record<string, number>;
  sourceVersions: Record<string, string>;
}

function countJsonFiles(directory: string): number {
  if (!existsSync(directory)) return 0;
  return readdirSync(directory).reduce((count, entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? count + countJsonFiles(path) : count + (entry.endsWith(".json") ? 1 : 0);
  }, 0);
}

const manifestPath = resolve(publicDataDir, "manifest.json");
const manifest = readJson<DatasetManifest>(manifestPath);
const calendarFiles = countJsonFiles(resolve(publicDataDir, "calendar"));
if (calendarFiles === 0) throw new Error("Cannot refresh manifest without static calendar files");

manifest.counts.calendarFiles = calendarFiles;
manifest.sourceVersions.calendar = "astronomy-calendar-real-1.0.0";
writeJson(manifestPath, manifest);
console.log(`Updated manifest calendarFiles=${calendarFiles}.`);
