import type { Destination, DestinationEditorialGuide, LocationTour, ObservationSite } from "../data/types.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const bannedPhrases = [
  "first understand what you need",
  "first you should consider",
  "in the next step",
  "but before we get to that",
  "it is important to note",
  "in today's world",
  "ultimately, it comes down to",
  "in summary",
  "zuerst solltest du dir überlegen",
  "im nächsten schritt",
  "doch bevor wir dazu kommen",
  "es ist wichtig zu beachten",
  "in der heutigen zeit",
  "letztendlich kommt es darauf an",
  "zusammenfassend lässt sich sagen",
];

function words(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function normalize(value: string) {
  return value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function localizedValues(tour: LocationTour, locale: "en" | "de") {
  const values = [tour.title[locale], tour.seoDescription[locale], tour.standfirst[locale]];
  for (const fact of tour.facts) values.push(fact.label[locale], fact.value[locale]);
  for (const block of tour.blocks) {
    values.push(block.heading[locale]);
    if (block.kind === "prose") values.push(...block.paragraphs[locale]);
    if (block.kind === "note") values.push(block.body[locale]);
    if (block.kind === "schedule") {
      if (block.introduction) values.push(block.introduction[locale]);
      for (const item of block.items) values.push(item.time[locale], item.title[locale], item.body[locale]);
    }
    if (block.kind === "decisions") {
      if (block.introduction) values.push(block.introduction[locale]);
      for (const item of block.items) values.push(item.label[locale], item.body[locale]);
    }
  }
  return values;
}

export function locationTourWordCount(tour: LocationTour, locale: "en" | "de") {
  return words(localizedValues(tour, locale).join(" "));
}

export function validateLocationTours(options: {
  tours: LocationTour[];
  destinations: Destination[];
  sites: ObservationSite[];
  guides: DestinationEditorialGuide[];
}) {
  const { tours, destinations, sites, guides } = options;
  if (tours.length < 10) throw new Error("Location-tour catalog requires at least ten reviewed tours");
  const destinationById = new Map(destinations.map((item) => [item.id, item]));
  const siteById = new Map(sites.map((item) => [item.id, item]));
  const guideByDestinationId = new Map(guides.map((item) => [item.destinationId, item]));
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const headings = new Set<string>();
  const standfirsts = new Set<string>();

  for (const tour of tours) {
    if (tour.version !== 1 || !slugPattern.test(tour.id) || !slugPattern.test(tour.slug)) throw new Error(`${tour.slug}: invalid identity`);
    if (ids.has(tour.id) || slugs.has(tour.slug)) throw new Error(`${tour.slug}: duplicate identity`);
    ids.add(tour.id);
    slugs.add(tour.slug);
    if (!datePattern.test(tour.lastReviewedAt)) throw new Error(`${tour.slug}: invalid review date`);
    const destination = destinationById.get(tour.destinationId);
    const site = siteById.get(tour.recommendedSiteId);
    const guide = guideByDestinationId.get(tour.destinationId);
    if (!destination || !guide) throw new Error(`${tour.slug}: destination guide does not resolve`);
    if (!site || site.destinationId !== destination.id) throw new Error(`${tour.slug}: recommended site does not belong to the destination`);
    if (tour.facts.length < 4 || tour.blocks.length < 3) throw new Error(`${tour.slug}: decision facts or editorial blocks are incomplete`);
    if (new Set(tour.blocks.map((block) => block.kind)).size < 3) throw new Error(`${tour.slug}: page structure is not varied enough`);
    const guideSourceIds = new Set(guide.sources.map((source) => source.id));
    const declaredSourceIds = new Set(tour.sourceIds);
    if (declaredSourceIds.size !== tour.sourceIds.length || declaredSourceIds.size < 3) throw new Error(`${tour.slug}: source list is incomplete`);
    for (const sourceId of declaredSourceIds) if (!guideSourceIds.has(sourceId)) throw new Error(`${tour.slug}: unknown official source ${sourceId}`);
    const verify = (sourceIds: string[], label: string) => {
      if (sourceIds.length === 0) throw new Error(`${tour.slug}: ${label} has no source`);
      for (const sourceId of sourceIds) if (!declaredSourceIds.has(sourceId)) throw new Error(`${tour.slug}: ${label} uses undeclared source ${sourceId}`);
    };
    for (const fact of tour.facts) verify(fact.sourceIds, `fact ${fact.label.en}`);
    for (const block of tour.blocks) {
      if (block.kind === "prose" || block.kind === "note") verify(block.sourceIds, `block ${block.id}`);
      if (block.kind === "schedule" || block.kind === "decisions") {
        if (block.items.length < 2) throw new Error(`${tour.slug}: block ${block.id} needs at least two useful items`);
        for (const item of block.items) verify(item.sourceIds, `block ${block.id} item`);
      }
    }
    for (const locale of ["en", "de"] as const) {
      if (locationTourWordCount(tour, locale) < 300) throw new Error(`${tour.slug}: ${locale} tour lacks editorial depth`);
      const standfirst = normalize(tour.standfirst[locale]);
      if (standfirsts.has(`${locale}:${standfirst}`)) throw new Error(`${tour.slug}: repeated ${locale} opening`);
      standfirsts.add(`${locale}:${standfirst}`);
      for (const block of tour.blocks) {
        const heading = normalize(block.heading[locale]);
        if (headings.has(`${locale}:${heading}`)) throw new Error(`${tour.slug}: repeated ${locale} heading`);
        headings.add(`${locale}:${heading}`);
      }
      const copy = localizedValues(tour, locale).join(" ").toLocaleLowerCase(locale);
      for (const phrase of bannedPhrases) if (copy.includes(phrase)) throw new Error(`${tour.slug}: banned editorial phrase '${phrase}'`);
    }
  }
}
