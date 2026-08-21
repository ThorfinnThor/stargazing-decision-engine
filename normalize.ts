import type { Destination, ObservationSite, StayArea } from "../../lib/data/types.js";
import { generatedPath, readJson, writeJson } from "../pipeline/io.js";

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

const input = readJson<SeedData>(generatedPath("seed.raw.json"));
const sortById = <T extends { id: string }>(items: T[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));

const normalized: SeedData = {
  ...input,
  destinations: sortById(input.destinations).map((item) => ({ ...item, slug: item.slug.trim().toLowerCase() })),
  sites: sortById(input.sites).map((item) => ({ ...item, slug: item.slug.trim().toLowerCase() })),
  stayAreas: sortById(input.stayAreas),
  origins: sortById(input.origins).map((item) => ({ ...item, slug: item.slug.trim().toLowerCase() })),
};

writeJson(generatedPath("seed.normalized.json"), normalized);
console.log(`Normalized seed input at ${normalized.generatedAt}.`);
