import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, ObservationSite, StayArea } from "../../lib/data/types.js";

interface OriginCity {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  active: boolean;
  maxShortTripKm: number;
}

const root = process.cwd();
const read = <T>(fileName: string): T => JSON.parse(
  readFileSync(resolve(root, "data-config/sources", fileName), "utf8"),
) as T;

const unique = (values: string[], label: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} IDs must be unique`);
};

const assertCoordinate = (lat: number, lon: number, label: string) => {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error(`${label} has invalid coordinates`);
};

const destinations = read<Destination[]>("destinations.json");
const sites = read<ObservationSite[]>("observation-sites.json");
const stayAreas = read<StayArea[]>("stay-areas.json");
const origins = JSON.parse(readFileSync(resolve(root, "data-config/trips/origins.json"), "utf8")) as OriginCity[];

unique(destinations.map((item) => item.id), "Destination");
unique(destinations.map((item) => item.slug), "Destination slug");
unique(sites.map((item) => item.id), "Observation site");
unique(stayAreas.map((item) => item.id), "Stay area");
unique(origins.map((item) => item.id), "Origin city");

const destinationIds = new Set(destinations.map((item) => item.id));
const siteIds = new Set(sites.map((item) => item.id));
const stayAreaIds = new Set(stayAreas.map((item) => item.id));

for (const destination of destinations) {
  if (!destinationIds.has(destination.id)) throw new Error(`Destination ${destination.id} is missing its own ID`);
  if (!destination.observationSiteIds.some((id) => siteIds.has(id))) throw new Error(`Destination ${destination.id} has no resolvable observation site`);
  if (destination.observationSiteIds.some((id) => !siteIds.has(id))) throw new Error(`Destination ${destination.id} references an unknown site`);
  if (destination.stayAreaIds.some((id) => !stayAreaIds.has(id))) throw new Error(`Destination ${destination.id} references an unknown stay area`);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: destination.timezone }).format();
  } catch {
    throw new Error(`Destination ${destination.id} has an invalid IANA timezone`);
  }
}

for (const site of sites) {
  assertCoordinate(site.lat, site.lon, `Site ${site.id}`);
  if (!destinationIds.has(site.destinationId)) throw new Error(`Site ${site.id} references an unknown destination`);
  if (site.publicAccess === "no" && site.accessScore !== 0) throw new Error(`Closed site ${site.id} must have accessScore 0`);
  if (site.publicAccess === "no" && (!site.notesSourceUrl || !site.accessNotes)) throw new Error(`Closed site ${site.id} requires sourced access notes`);
  if (site.notesSourceUrl && !site.notesSourceUrl.startsWith("https://")) throw new Error(`Site ${site.id} access source must use HTTPS`);
  if (site.accessNotes && (!site.accessNotes.en.trim() || !site.accessNotes.de.trim())) throw new Error(`Site ${site.id} access notes require English and German text`);
}

for (const area of stayAreas) {
  assertCoordinate(area.lat, area.lon, `Stay area ${area.id}`);
  if (!destinationIds.has(area.destinationId)) throw new Error(`Stay area ${area.id} references an unknown destination`);
  if (area.observationSiteIds.some((id) => !siteIds.has(id))) throw new Error(`Stay area ${area.id} references an unknown site`);
}

for (const origin of origins) assertCoordinate(origin.lat, origin.lon, `Origin ${origin.id}`);

console.log(`Validated seed config: ${destinations.length} destinations, ${sites.length} sites, ${stayAreas.length} stay areas, ${origins.length} origins.`);
