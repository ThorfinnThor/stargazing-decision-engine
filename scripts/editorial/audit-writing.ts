import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { DestinationEditorialGuide, GearGuide, LocationTour } from "../../lib/data/types.js";
import { readJson, root } from "../pipeline/io.js";

type Locale = "en" | "de";
type Corpus = "destination" | "location-tour" | "gear";
interface TextUnit { corpus: Corpus; slug: string; locale: Locale; field: string; value: string }

const bannedPhrases = [
  "first understand what you need", "first you should consider", "in the next step", "but before we get to that",
  "it is important to note", "in today's world", "ultimately, it comes down to", "in summary",
  "zuerst solltest du dir überlegen", "im nächsten schritt", "doch bevor wir dazu kommen", "es ist wichtig zu beachten",
  "in der heutigen zeit", "letztendlich kommt es darauf an", "zusammenfassend lässt sich sagen",
];
const normalize = (value: string) => value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const prefix = (value: string, count = 12) => normalize(value).split(" ").slice(0, count).join(" ");
const units: TextUnit[] = [];
const add = (corpus: Corpus, slug: string, locale: Locale, field: string, value: string) => units.push({ corpus, slug, locale, field, value });

const destinations = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
for (const guide of destinations) for (const locale of ["en", "de"] as const) {
  add("destination", guide.slug, locale, "standfirst", guide.standfirst[locale]);
  add("destination", guide.slug, locale, "editorialAngle", guide.editorialAngle[locale]);
  for (const section of guide.sections) {
    add("destination", guide.slug, locale, `heading:${section.id}`, section.heading[locale]);
    section.paragraphs[locale].forEach((value, index) => add("destination", guide.slug, locale, `paragraph:${section.id}:${index}`, value));
  }
  add("destination", guide.slug, locale, "tour:title", guide.tour.title[locale]);
  add("destination", guide.slug, locale, "tour:summary", guide.tour.summary[locale]);
  for (const step of guide.tour.steps) add("destination", guide.slug, locale, `tour-step:${step.id}`, step.body[locale]);
  for (const note of guide.fieldNotes) add("destination", guide.slug, locale, `field-note:${note.id}`, note.body[locale]);
  for (const item of guide.faq) add("destination", guide.slug, locale, `faq:${item.question.en}`, item.answer[locale]);
}

const tours = readJson<LocationTour[]>(resolve(root, "data-config/editorial/location-tours.json"));
for (const tour of tours) for (const locale of ["en", "de"] as const) {
  add("location-tour", tour.slug, locale, "standfirst", tour.standfirst[locale]);
  for (const block of tour.blocks) {
    add("location-tour", tour.slug, locale, `heading:${block.id}`, block.heading[locale]);
    if (block.kind === "prose") block.paragraphs[locale].forEach((value, index) => add("location-tour", tour.slug, locale, `paragraph:${block.id}:${index}`, value));
    if (block.kind === "note") add("location-tour", tour.slug, locale, `note:${block.id}`, block.body[locale]);
    if (block.kind === "schedule" || block.kind === "decisions") for (const [index, item] of block.items.entries()) add("location-tour", tour.slug, locale, `item:${block.id}:${index}`, item.body[locale]);
  }
}

const gear = readJson<GearGuide[]>(resolve(root, "data-config/gear/guides.json"));
for (const guide of gear) for (const locale of ["en", "de"] as const) {
  add("gear", guide.slug, locale, "summary", guide.summary[locale]);
  add("gear", guide.slug, locale, "decisionSummary", guide.decisionSummary[locale]);
  add("gear", guide.slug, locale, "audience", guide.audience[locale]);
  guide.buyingCriteria.forEach((value, index) => add("gear", guide.slug, locale, `buyingCriteria:${index}`, value[locale]));
  guide.tradeoffs[locale].forEach((value, index) => add("gear", guide.slug, locale, `tradeoff:${index}`, value));
  for (const item of guide.items) {
    add("gear", guide.slug, locale, `item:${item.name.en}:why`, item.whyItMatters[locale]);
    item.pros[locale].forEach((value, index) => add("gear", guide.slug, locale, `item:${item.name.en}:pro:${index}`, value));
    item.cons[locale].forEach((value, index) => add("gear", guide.slug, locale, `item:${item.name.en}:con:${index}`, value));
  }
  for (const item of guide.faq) add("gear", guide.slug, locale, `faq:${item.question.en}`, item.answer[locale]);
}

const banned = units.flatMap((unit) => bannedPhrases.filter((phrase) => unit.value.toLocaleLowerCase(unit.locale).includes(phrase)).map((phrase) => ({ ...unit, phrase })));
const punctuation = units.map((unit) => ({ ...unit, emDashes: (unit.value.match(/—/g) ?? []).length, colons: (unit.value.match(/:/g) ?? []).length })).filter((item) => item.emDashes > 0 || item.colons > 0);
const repeated = (selector: (unit: TextUnit) => string, minimumLength: number) => {
  const groups = new Map<string, TextUnit[]>();
  for (const unit of units) {
    const key = `${unit.locale}:${selector(unit)}`;
    if (key.length < minimumLength) continue;
    groups.set(key, [...(groups.get(key) ?? []), unit]);
  }
  return [...groups.entries()].filter(([, values]) => new Set(values.map((value) => value.slug)).size > 1).map(([fingerprint, values]) => ({ fingerprint, occurrences: values }));
};
const duplicateExact = repeated((unit) => normalize(unit.value), 80);
const repeatedOpenings = repeated((unit) => prefix(unit.value), 45).filter((group) => group.occurrences.every((item) => !item.field.startsWith("heading")));
const destinationSignatures = new Map<string, string[]>();
for (const guide of destinations) {
  const signature = guide.sections.map((section) => section.id).join(" > ");
  destinationSignatures.set(signature, [...(destinationSignatures.get(signature) ?? []), guide.slug]);
}
const repeatedStructures = [...destinationSignatures.entries()].filter(([, slugs]) => slugs.length > 1).sort((a, b) => b[1].length - a[1].length);
const destinationHardFailures = banned.some((item) => item.corpus === "destination")
  || duplicateExact.some((group) => group.occurrences.some((item) => item.corpus === "destination"))
  || repeatedStructures.length > 0;
const corpusSummary = (["destination", "location-tour", "gear"] as const).map((corpus) => ({
  corpus,
  pages: new Set(units.filter((unit) => unit.corpus === corpus).map((unit) => unit.slug)).size,
  textUnits: units.filter((unit) => unit.corpus === corpus).length,
  bannedPhrases: banned.filter((item) => item.corpus === corpus).length,
  emDashes: punctuation.filter((item) => item.corpus === corpus).reduce((sum, item) => sum + item.emDashes, 0),
  colons: punctuation.filter((item) => item.corpus === corpus).reduce((sum, item) => sum + item.colons, 0),
}));

const lines = [
  "# Editorial writing audit",
  "",
  "This report checks source copy against `docs/editorial-writing-standard.md`. It is diagnostic. A dash or colon is not automatically an error, but concentrations identify pages that need a human rhythm and structure review.",
  "",
  "## Corpus summary",
  "",
  "| Corpus | Pages | Text units | Banned phrases | Em dashes | Colons |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...corpusSummary.map((item) => `| ${item.corpus} | ${item.pages} | ${item.textUnits} | ${item.bannedPhrases} | ${item.emDashes} | ${item.colons} |`),
  "",
  "## Findings",
  "",
  `- Exact cross-page duplicate passages: ${duplicateExact.length}`,
  `- Repeated twelve-word openings across pages: ${repeatedOpenings.length}`,
  `- The repeated openings are ${repeatedOpenings.every((group) => group.occurrences.every((item) => item.corpus === "gear" && /published|veröffentlicht/.test(item.value))) ? "limited to factual published-specification labels in gear comparison bullets" : "not limited to factual gear labels and require prose review"}.`,
  `- Repeated destination section-ID sequences: ${repeatedStructures.length}`,
  `- The new location-tour corpus ${banned.some((item) => item.corpus === "location-tour") || duplicateExact.some((group) => group.occurrences.some((item) => item.corpus === "location-tour")) ? "needs correction" : "passes the hard phrase and exact-duplication checks"}.`,
  "",
  "## Highest-priority existing patterns",
  "",
  ...repeatedStructures.slice(0, 10).map(([signature, slugs]) => `- ${slugs.length} destination guides share the section-ID sequence \`${signature}\`: ${slugs.join(", ")}.`),
  ...banned.slice(0, 20).map((item) => `- ${item.corpus}/${item.slug} (${item.locale}, ${item.field}) contains \`${item.phrase}\`.`),
  "",
  "## Editorial decision",
  "",
  destinationHardFailures
    ? "The destination corpus still has hard phrase, duplicate-copy, or repeated-structure findings. Revisions should continue in subject-based batches, preserving the cited facts while changing information order and voice where needed."
    : "The destination corpus passes the hard phrase, exact-duplication, and repeated-structure checks. Publication still depends on source, schema, build, SEO, and visual verification; this text audit does not replace those gates.",
];
writeFileSync(resolve(root, "docs/editorial-writing-audit.md"), `${lines.join("\n")}\n`, "utf8");
console.log(`Editorial audit: ${units.length} text units, ${banned.length} banned phrases, ${duplicateExact.length} exact duplicate groups, ${repeatedOpenings.length} repeated openings.`);
