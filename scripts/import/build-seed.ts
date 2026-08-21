import { resolve } from "node:path";

import type { Destination, ObservationSite, StayArea } from "../../lib/data/types.js";
import { generatedPath, readJson, seedGeneratedAt, writeJson } from "../pipeline/io.js";

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

interface SeedData {
  seed: true;
  generatedAt: string;
  destinations: Destination[];
  sites: ObservationSite[];
  stayAreas: StayArea[];
  origins: OriginCity[];
}

const configDir = resolve(process.cwd(), "data-config/sources");
const readConfig = <T>(fileName: string) => readJson<T>(resolve(configDir, fileName));

const seed: SeedData = {
  seed: true,
  generatedAt: seedGeneratedAt,
  destinations: readConfig<Destination[]>("destinations.json"),
  sites: readConfig<ObservationSite[]>("observation-sites.json"),
  stayAreas: readConfig<StayArea[]>("stay-areas.json"),
  origins: readJson<OriginCity[]>(resolve(process.cwd(), "data-config/trips/origins.json")),
};

writeJson(generatedPath("seed.raw.json"), seed);
console.log(`Built seed input: ${seed.destinations.length} destinations, ${seed.sites.length} sites.`);
