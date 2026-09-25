import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const write = (file, value) => writeFileSync(resolve(root, file), `${JSON.stringify(value, null, 2)}\n`);

const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const reviews = read("data-config/sources/staged-factual-reviews.json");
const readiness = read("docs/staged-destination-readiness.json");
const cohortIds = new Set(reviews.records.map((record) => record.destinationId));

if (cohortIds.size !== 50) throw new Error(`Expected a 50-destination expansion cohort, found ${cohortIds.size}`);
const readinessById = new Map(readiness.records.map((record) => [record.destinationId, record]));
const notReady = [...cohortIds].filter((id) => !readinessById.get(id)?.readyForActivation);
if (notReady.length > 0) throw new Error(`Refusing activation; readiness blockers remain for: ${notReady.join(", ")}`);
const missingDestinations = [...cohortIds].filter((id) => !destinations.some((destination) => destination.id === id));
if (missingDestinations.length > 0) throw new Error(`Expansion destinations are missing: ${missingDestinations.join(", ")}`);

let activatedDestinations = 0;
let activatedSites = 0;
for (const destination of destinations) {
  if (!cohortIds.has(destination.id)) continue;
  if (!destination.active) activatedDestinations += 1;
  destination.active = true;
}
for (const site of sites) {
  if (!cohortIds.has(site.destinationId)) continue;
  if (!site.active) activatedSites += 1;
  site.active = true;
}

const cohortSites = sites.filter((site) => cohortIds.has(site.destinationId));
if (cohortSites.length !== 100) throw new Error(`Expected 100 expansion sites, found ${cohortSites.length}`);
write("data-config/sources/destinations.json", destinations);
write("data-config/sources/observation-sites.json", sites);
console.log(`Activated ${activatedDestinations} destination(s) and ${activatedSites} observation-site record(s) from the expansion cohort.`);
