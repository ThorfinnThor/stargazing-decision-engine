import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, DestinationMonthlySummary, GearCategory, GearGuide, GearProductMetadata, ImageManifest, Manifest, MeteorShowerEvent, ObservationSite, ShortTripFile } from "./types.js";
import type { NightPreviewFile } from "../astronomy/types.js";

export interface SeoPageRecord {
  id: string;
  pageType: string;
  locale: "en" | "de";
  path: string;
  canonical: string;
  alternatePaths: Record<string, string>;
  title: string;
  h1: string;
  description: string;
  indexable: boolean;
  reasons: string[];
  structuredDataType: "WebPage";
}

export interface SeoRegistry {
  version: 1;
  siteUrl: string;
  pages: SeoPageRecord[];
}

const publicDataRoot = resolve(process.cwd(), "public/data/stargazing");

function readPublished<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(publicDataRoot, relativePath), "utf8")) as T;
}

export function loadManifest(): Manifest {
  return readPublished<Manifest>("manifest.json");
}

export function loadDestinations(): Destination[] {
  return readPublished<Destination[]>("destinations/index.json");
}

export function loadDestination(slug: string): Destination {
  const destination = loadDestinations().find((item) => item.slug === slug);
  if (!destination) throw new Error(`Unknown destination: ${slug}`);
  return destination;
}

export function loadSites(): ObservationSite[] {
  return readPublished<ObservationSite[]>("sites/index.json");
}

export function loadImageManifest(): ImageManifest {
  return readPublished<ImageManifest>("images/manifest.json");
}

export function loadNightPreviews(): NightPreviewFile {
  return readPublished<NightPreviewFile>("astronomy/night-previews.json");
}

export function loadDestinationMonthly(slug: string): DestinationMonthlySummary {
  return readPublished<DestinationMonthlySummary>(`monthly/destinations/${slug}.json`);
}

export function listMeteorShowerEvents(year = 2027) {
  const directory = resolve(publicDataRoot, `events/meteor-showers/${year}`);
  if (!existsSync(directory)) return [] as Array<{ year: number; slug: string }>;
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ year, slug: file.replace(/\.json$/, "") }));
}

export function loadMeteorShowerEvent(year: number, slug: string): MeteorShowerEvent {
  return readPublished<MeteorShowerEvent>(`events/meteor-showers/${year}/${slug}.json`);
}

export function listShortTripOrigins() {
  const directory = resolve(publicDataRoot, "short-trips");
  if (!existsSync(directory)) return [] as string[];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort((left, right) => left.localeCompare(right));
}

export function loadShortTrip(originSlug: string): ShortTripFile {
  return readPublished<ShortTripFile>(`short-trips/${originSlug}.json`);
}

export function loadSeoRegistry(): SeoRegistry {
  return readPublished<SeoRegistry>("seo/registry.json");
}

export function loadSeoPage(path: string) {
  return loadSeoRegistry().pages.find((page) => page.path === path) ?? null;
}

export function loadGearCategories(): GearCategory[] {
  return readPublished<GearCategory[]>("gear/categories.json");
}

export function loadGearProducts(): GearProductMetadata[] {
  return readPublished<GearProductMetadata[]>("gear/products.json");
}

export function listGearGuides() {
  const directory = resolve(publicDataRoot, "gear/guides");
  if (!existsSync(directory)) return [] as string[];
  return readdirSync(directory).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
}

export function loadGearGuide(slug: string): GearGuide {
  return readPublished<GearGuide>(`gear/guides/${slug}.json`);
}
