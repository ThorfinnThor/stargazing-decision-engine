import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { evaluateIndexability, type IndexabilityRequirements } from "../../lib/seo/indexability.js";
import type { Destination, DestinationMonthlySummary, GearGuide, MeteorShowerEvent, OriginCity, ShortTripFile } from "../../lib/data/types.js";
import { generatedDir, generatedPath, publicPath, readJson, root, writeJson } from "../pipeline/io.js";

interface PageDefinition extends IndexabilityRequirements {
  pageType: string;
  keywordIntent: string;
  cluster: string;
  canonicalPattern: string;
}

interface SeoConfig {
  version: 1;
  siteUrl: string;
  siteName: string;
  locales: Array<"en" | "de">;
}

interface SeedData {
  destinations: Destination[];
  origins: OriginCity[];
}

interface MeteorOutput { events: MeteorShowerEvent[] }

interface SeoPage {
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

const configFile = readJson<SeoConfig>(resolve(root, "data-config/seo/project-seo-config.json"));
const config: SeoConfig = { ...configFile, siteUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || configFile.siteUrl };
const definitions = readJson<PageDefinition[]>(resolve(root, "data-config/seo/page-definitions.json"));
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const meteorOutputs = readdirSync(generatedDir).filter((file) => /^meteor-showers-\d{4}\.json$/.test(file)).map((file) => readJson<MeteorOutput>(generatedPath(file)));
const events = meteorOutputs.flatMap((output) => output.events);
const shortTrips = readdirSync(generatedDir).filter((file) => /^short-trips-[a-z0-9-]+\.json$/.test(file)).map((file) => readJson<ShortTripFile>(generatedPath(file)));
const gearGuides = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));

function definition(pageType: string) {
  const found = definitions.find((item) => item.pageType === pageType);
  if (!found) throw new Error(`Missing SEO page definition: ${pageType}`);
  return found;
}

function canonical(path: string) {
  return `${config.siteUrl.replace(/\/$/, "")}${path}`;
}

function makePage(options: {
  id: string;
  pageType: string;
  locale: "en" | "de";
  path: string;
  alternatePaths: Record<string, string>;
  title: string;
  h1: string;
  description: string;
  resultCount: number;
  confidence: "high" | "moderate" | "low";
  uniqueInsightCount: number;
  internalLinkCount: number;
  sourceFreshness?: boolean;
}) {
  const requirements = definition(options.pageType);
  const gate = evaluateIndexability({
    resultCount: options.resultCount,
    dataCompleteness: 1,
    confidence: options.confidence,
    uniqueInsightCount: options.uniqueInsightCount,
    hasUniqueTitle: options.title.trim().length > 0,
    hasUniqueH1: options.h1.trim().length > 0,
    hasCanonical: true,
    internalLinkCount: options.internalLinkCount,
    createsCannibalization: false,
    containsUnsupportedClaims: false,
    isFutureRelevant: true,
    sourceFreshness: options.sourceFreshness ?? true,
  }, requirements);
  return {
    id: options.id,
    pageType: options.pageType,
    locale: options.locale,
    path: options.path,
    canonical: canonical(options.path),
    alternatePaths: options.alternatePaths,
    title: options.title,
    h1: options.h1,
    description: options.description,
    indexable: gate.indexable,
    reasons: gate.reasons,
    structuredDataType: "WebPage" as const,
  } satisfies SeoPage;
}

const pages: SeoPage[] = [];
for (const locale of config.locales) {
  const homePath = `/${locale}/`;
  pages.push(makePage({
    id: `home-${locale}`, pageType: "home", locale, path: homePath, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/`])),
    title: locale === "de" ? "Stargazing für dunkle Himmel" : "Stargazing for dark skies",
    h1: locale === "de" ? "Wissen, wann sich die Reise lohnt." : "Know when the night is worth the journey.",
    description: locale === "de" ? "Statische, datenbasierte Entscheidungshilfe für Sternbeobachtung." : "A static, data-driven decision engine for stargazing travel.",
    resultCount: seed.destinations.length, confidence: "low", uniqueInsightCount: 3, internalLinkCount: seed.destinations.length + shortTrips.length,
  }));
  pages.push(makePage({
    id: `gear-${locale}`, pageType: "gear", locale, path: `/${locale}/gear/`, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/gear/`])),
    title: locale === "de" ? "Ausrüstung für Sternbeobachtung" : "Stargazing gear guides", h1: locale === "de" ? "Ausrüstung für klare Nächte." : "Gear for clear nights.", description: locale === "de" ? "Statische, technische Gear-Guides ohne Preis- oder Verfügbarkeitsversprechen." : "Static, specification-based gear guides without price or availability claims.", resultCount: gearGuides.length, confidence: "high", uniqueInsightCount: 3, internalLinkCount: gearGuides.length + seed.destinations.length,
  }));
  for (const destination of seed.destinations) {
    const path = `/${locale}/stargazing-destinations/${destination.slug}/`;
    const published = readJson<DestinationMonthlySummary>(publicPath(`monthly/destinations/${destination.slug}.json`));
    const destinationScores = published.months;
    const confidence = destinationScores.some((score) => score.confidenceLevel === "low") ? "low" : destinationScores.some((score) => score.confidenceLevel === "moderate") ? "moderate" : "high";
    pages.push(makePage({
      id: `destination-${destination.slug}-${locale}`, pageType: "destination", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/stargazing-destinations/${destination.slug}/`])),
      title: locale === "de" ? `${destination.name} · Sternbeobachtung` : `${destination.name} · Stargazing destination`, h1: destination.name,
      description: locale === "de" ? `Statischer Himmelsführer für ${destination.name}.` : `Static dark-sky guide for ${destination.name}.`, resultCount: destinationScores.length, confidence, uniqueInsightCount: destinationScores.length >= 3 ? 3 : destinationScores.length, internalLinkCount: seed.destinations.length + shortTrips.length,
    }));
  }
  for (const event of events) {
    const path = `/${locale}/meteor-showers/${event.year}/${event.slug}/`;
    pages.push(makePage({
      id: `meteor-${event.year}-${event.slug}-${locale}`, pageType: "meteor-shower", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/meteor-showers/${event.year}/${event.slug}/`])),
      title: `${event.name[locale]} ${event.year}`, h1: `${event.name[locale]} ${event.year}`,
      description: locale === "de" ? `Statischer Beobachtungsleitfaden für ${event.name[locale]}.` : `Static viewing guide for ${event.name[locale]}.`, resultCount: event.topSites.length, confidence: event.confidenceLevel, uniqueInsightCount: event.topSites.length >= 2 ? 3 : event.topSites.length, internalLinkCount: event.topDestinations.length + 2,
    }));
  }
  for (const trip of shortTrips) {
    const path = `/${locale}/short-trips/${trip.originSlug}/`;
    pages.push(makePage({
      id: `short-trip-${trip.originSlug}-${locale}`, pageType: "short-trip", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/short-trips/${trip.originSlug}/`])),
      title: locale === "de" ? `Kurze Sternreisen ab ${trip.originName}` : `Short stargazing trips from ${trip.originName}`, h1: locale === "de" ? `Ab ${trip.originName}` : `From ${trip.originName}`,
      description: locale === "de" ? `Statisches Ranking dunkler Himmelsziele ab ${trip.originName}.` : `Static ranking of dark-sky destinations from ${trip.originName}.`, resultCount: trip.entries.length, confidence: trip.entries[0]?.confidenceLevel ?? "low", uniqueInsightCount: trip.entries.length >= 2 ? 3 : trip.entries.length, internalLinkCount: trip.entries.length + seed.destinations.length,
    }));
  }
  for (const guide of gearGuides) {
    const path = `/${locale}/gear/${guide.slug}/`;
    pages.push(makePage({
      id: `gear-guide-${guide.slug}-${locale}`, pageType: "gear-guide", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/gear/${guide.slug}/`])),
      title: guide.title[locale], h1: guide.title[locale], description: guide.summary[locale], resultCount: guide.items.length, confidence: "high", uniqueInsightCount: guide.items.length >= 2 ? 3 : 2, internalLinkCount: gearGuides.length + seed.destinations.length,
    }));
  }
}

writeJson(publicPath("seo/registry.json"), { version: 1, siteUrl: config.siteUrl, pages });
console.log(`Built SEO registry for ${pages.length} localized static pages (${pages.filter((page) => page.indexable).length} indexable).`);
