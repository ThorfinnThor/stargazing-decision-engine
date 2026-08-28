import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { evaluateIndexability, type IndexabilityRequirements } from "../../lib/seo/indexability.js";
import type { Destination, DestinationMonthlySummary, GearGuide, Manifest, MeteorShowerEvent, ObservationSite, OriginCity, ShortTripFile } from "../../lib/data/types.js";
import { generatedDir, generatedPath, publicPath, readJson, root, writeJson } from "../pipeline/io.js";
import { isTravelEligibleSite } from "../../lib/access/travel.js";

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
  contentLastModified: string;
  locales: Array<"en" | "de">;
}

interface SeedData {
  destinations: Destination[];
  sites: ObservationSite[];
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
  lastModified: string;
  indexable: boolean;
  reasons: string[];
  structuredDataType: "WebPage";
}

const configFile = readJson<SeoConfig>(resolve(root, "data-config/seo/project-seo-config.json"));
const config: SeoConfig = { ...configFile, siteUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || configFile.siteUrl };
const definitions = readJson<PageDefinition[]>(resolve(root, "data-config/seo/page-definitions.json"));
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const manifest = readJson<Manifest>(publicPath("manifest.json"));
const meteorOutputs = readdirSync(generatedDir).filter((file) => /^meteor-showers-\d{4}\.json$/.test(file)).map((file) => readJson<MeteorOutput>(generatedPath(file)));
const events = meteorOutputs.flatMap((output) => output.events);
const shortTrips = readdirSync(generatedDir).filter((file) => /^short-trips-[a-z0-9-]+\.json$/.test(file)).map((file) => readJson<ShortTripFile>(generatedPath(file)));
const gearGuides = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));

function normalizedTimestamp(value: string) {
  const timestamp = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(timestamp.valueOf())) throw new Error(`Invalid SEO last-modified timestamp: ${value}`);
  return timestamp.toISOString();
}

function latestTimestamp(...values: string[]) {
  return normalizedTimestamp(values.reduce((latest, value) => Date.parse(value) > Date.parse(latest) ? value : latest));
}

const editorialLastModified = normalizedTimestamp(config.contentLastModified);
const dataLastModified = normalizedTimestamp(manifest.generatedAt);
const gearLastModified = latestTimestamp(config.contentLastModified, ...gearGuides.map((guide) => guide.lastReviewedAt));

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
  lastModified?: string;
  resultCount: number;
  confidence: "high" | "moderate" | "low";
  uniqueInsightCount: number;
  internalLinkCount: number;
  sourceFreshness?: boolean;
  travelEligible?: boolean;
  forceNoindexReason?: string;
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
    containsUnsupportedClaims: options.travelEligible === false,
    isFutureRelevant: true,
    sourceFreshness: options.sourceFreshness ?? true,
  }, requirements);
  return {
    id: options.id,
    pageType: options.pageType,
    locale: options.locale,
    path: options.path,
    canonical: canonical(options.path),
    alternatePaths: { ...options.alternatePaths, "x-default": options.alternatePaths.en },
    title: options.title,
    h1: options.h1,
    description: options.description,
    lastModified: normalizedTimestamp(options.lastModified ?? config.contentLastModified),
    indexable: options.forceNoindexReason ? false : gate.indexable,
    reasons: options.forceNoindexReason ? [...new Set([...gate.reasons, options.forceNoindexReason])] : gate.reasons,
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
    description: locale === "de" ? "Datenbasierte Entscheidungshilfe für Sternbeobachtung." : "A data-driven decision engine for stargazing travel.",
    lastModified: latestTimestamp(dataLastModified, gearLastModified),
    resultCount: seed.destinations.length, confidence: "low", uniqueInsightCount: 3, internalLinkCount: seed.destinations.length + shortTrips.length,
  }));
  pages.push(makePage({
    id: `finder-${locale}`, pageType: "finder", locale, path: `/${locale}/finder/`, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/finder/`])),
    title: locale === "de" ? "Stargazing-Finder · Ziele vergleichen" : "Stargazing finder · compare destinations",
    h1: locale === "de" ? "Finde die Nacht, die zu dir passt." : "Find the night that fits your trip.",
    description: locale === "de" ? "Clientseitiger Finder für geprüfte Sternbeobachtungsziele nach Monat, Region, Temperatur, Priorität und Zugang." : "Client-side finder for reviewed stargazing destinations by month, region, temperature, priority, and access.",
    lastModified: dataLastModified,
    resultCount: seed.destinations.length, confidence: "moderate", uniqueInsightCount: 3, internalLinkCount: seed.destinations.length + 1,
    forceNoindexReason: "interactive-query-surface",
  }));
  pages.push(makePage({
    id: `gear-${locale}`, pageType: "gear", locale, path: `/${locale}/gear/`, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/gear/`])),
    title: locale === "de" ? "Ausrüstung für Sternbeobachtung" : "Stargazing gear guides", h1: locale === "de" ? "Ausrüstung für klare Nächte." : "Gear for clear nights.", description: locale === "de" ? "Technische Gear-Guides ohne Preis- oder Verfügbarkeitsversprechen." : "Specification-based gear guides without price or availability claims.", lastModified: gearLastModified, resultCount: gearGuides.length, confidence: "high", uniqueInsightCount: 3, internalLinkCount: gearGuides.length + seed.destinations.length,
  }));
  pages.push(makePage({
    id: `methodology-${locale}`, pageType: "methodology", locale, path: `/${locale}/methodology/`, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/methodology/`])),
    title: locale === "de" ? "So bewerten wir Astronomie-Ausrüstung" : "How we evaluate astronomy gear", h1: locale === "de" ? "So bewerten wir Ausrüstung." : "How we evaluate gear.", description: locale === "de" ? "Transparente Methodik für technische Vergleiche, Nachweise, Aktualität und redaktionelle Unabhängigkeit." : "Transparent methodology for technical comparisons, evidence, freshness, and editorial independence.", lastModified: editorialLastModified, resultCount: 6, confidence: "high", uniqueInsightCount: 5, internalLinkCount: gearGuides.length + 1,
  }));
  pages.push(makePage({
    id: `about-${locale}`, pageType: "about", locale, path: `/${locale}/about/`, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/about/`])),
    title: locale === "de" ? "Über Stargazing Index" : "About Stargazing Index", h1: locale === "de" ? "Entscheidungen für bessere Nächte." : "Decisions for better nights.", description: locale === "de" ? "Mission, Arbeitsweise und redaktionelle Verantwortung von Stargazing Index." : "The mission, working principles, and editorial responsibility behind Stargazing Index.", lastModified: editorialLastModified, resultCount: 3, confidence: "high", uniqueInsightCount: 3, internalLinkCount: 3,
  }));
  for (const destination of seed.destinations) {
    const path = `/${locale}/stargazing-destinations/${destination.slug}/`;
    const published = readJson<DestinationMonthlySummary>(publicPath(`monthly/destinations/${destination.slug}.json`));
    const destinationScores = published.months;
    const confidence = destinationScores.some((score) => score.confidenceLevel === "low") ? "low" : destinationScores.some((score) => score.confidenceLevel === "moderate") ? "moderate" : "high";
    pages.push(makePage({
      id: `destination-${destination.slug}-${locale}`, pageType: "destination", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/stargazing-destinations/${destination.slug}/`])),
      title: locale === "de" ? `${destination.name} · Sternbeobachtung` : `${destination.name} · Stargazing destination`, h1: destination.name,
      description: locale === "de" ? `Himmelsführer für ${destination.name}.` : `Dark-sky guide for ${destination.name}.`, lastModified: dataLastModified, resultCount: destinationScores.length, confidence, uniqueInsightCount: destinationScores.length >= 3 ? 3 : destinationScores.length, internalLinkCount: seed.destinations.length + shortTrips.length,
      travelEligible: seed.sites.some((site) => site.destinationId === destination.id && isTravelEligibleSite(site)),
    }));
  }
  for (const event of events) {
    const path = `/${locale}/meteor-showers/${event.year}/${event.slug}/`;
    pages.push(makePage({
      id: `meteor-${event.year}-${event.slug}-${locale}`, pageType: "meteor-shower", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/meteor-showers/${event.year}/${event.slug}/`])),
      title: `${event.name[locale]} ${event.year}`, h1: `${event.name[locale]} ${event.year}`,
      description: locale === "de" ? `Beobachtungsleitfaden für ${event.name[locale]}.` : `Viewing guide for ${event.name[locale]}.`, resultCount: event.topSites.length, confidence: event.confidenceLevel, uniqueInsightCount: event.topSites.length >= 2 ? 3 : event.topSites.length, internalLinkCount: event.topDestinations.length + 2,
      lastModified: event.verifiedAt,
    }));
  }
  for (const trip of shortTrips) {
    const path = `/${locale}/short-trips/${trip.originSlug}/`;
    pages.push(makePage({
      id: `short-trip-${trip.originSlug}-${locale}`, pageType: "short-trip", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/short-trips/${trip.originSlug}/`])),
      title: locale === "de" ? `Kurze Sternreisen ab ${trip.originName}` : `Short stargazing trips from ${trip.originName}`, h1: locale === "de" ? `Ab ${trip.originName}` : `From ${trip.originName}`,
      description: locale === "de" ? `Ranking dunkler Himmelsziele ab ${trip.originName}.` : `Ranking of dark-sky destinations from ${trip.originName}.`, resultCount: trip.entries.length, confidence: trip.entries[0]?.confidenceLevel ?? "low", uniqueInsightCount: trip.entries.length >= 2 ? 3 : trip.entries.length, internalLinkCount: trip.entries.length + seed.destinations.length,
      lastModified: dataLastModified,
    }));
  }
  for (const guide of gearGuides) {
    const path = `/${locale}/gear/${guide.slug}/`;
    pages.push(makePage({
      id: `gear-guide-${guide.slug}-${locale}`, pageType: "gear-guide", locale, path, alternatePaths: Object.fromEntries(config.locales.map((item) => [item, `/${item}/gear/${guide.slug}/`])),
      title: guide.title[locale], h1: guide.title[locale], description: guide.summary[locale], lastModified: guide.lastReviewedAt, resultCount: guide.items.length, confidence: "high", uniqueInsightCount: guide.items.length >= 2 ? 3 : 2, internalLinkCount: gearGuides.length + seed.destinations.length,
    }));
  }
}

writeJson(publicPath("seo/registry.json"), { version: 1, siteUrl: config.siteUrl, pages });
console.log(`Built SEO registry for ${pages.length} localized static pages (${pages.filter((page) => page.indexable).length} indexable).`);
