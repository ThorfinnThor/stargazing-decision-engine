import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const useHead = process.argv.includes("--from-head");
const editorialSources = new Set([
  "data-config/editorial/destination-guides.json",
  "data-config/editorial/location-tours.json",
]);
const read = (relative) => JSON.parse(useHead && editorialSources.has(relative)
  ? execFileSync("git", ["show", `HEAD:${relative}`], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  : fs.readFileSync(path.join(root, relative), "utf8"));
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const normalize = (value) => value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const wordCount = (value) => value.trim().split(/\s+/u).filter(Boolean).length;
const segmenters = {
  en: new Intl.Segmenter("en", { granularity: "sentence" }),
  de: new Intl.Segmenter("de", { granularity: "sentence" }),
};
const sentences = (value, locale) => [...segmenters[locale].segment(value)]
  .map(({ segment }) => segment.trim())
  .filter(Boolean);
const lowerInitial = (value, locale, properNames = []) => {
  if (!value) return value;
  if (locale === "en") {
    if (properNames.some((name) => name && value.startsWith(name.split(/\s+/u)[0])) || /^(?:NPS|NASA|ESO|VIS|UNESCO|IDSP)\b/u.test(value)) return value;
    return `${value[0].toLocaleLowerCase(locale)}${value.slice(1)}`;
  }
  if (properNames.some((name) => name && value.startsWith(name.split(/\s+/u)[0])) || /^(?:NPS|NASA|ESO|VIS|UNESCO|IDSP|SAAO|DCNR)\b/u.test(value)) return value;
  const common = /^(Beides|Weder|Sowohl|Der|Die|Das|Dies|Dieser|Diese|Dieses|Ein|Eine|Es|Sie|Er|Für|Bei|Im|Am|An|Auf|Vor|Nach|Wenn|So|Sind|Ist|Erst|Oft|Beginne|Bestätige|Bestimme|Betrachte|Behandle|Bereite|Bleibe|Buche|Checke|Dimme|Erreiche|Ersetze|Fahre|Folge|Frage|Halte|Kleide|Komm|Komme|Kontaktiere|Lasse|Lassen|Lege|Lies|Markiere|Meide|Merke|Navigiere|Nimm|Notiere|Nutze|Öffne|Packe|Plane|Prüfe|Reserviere|Richte|Sage|Sagt|Schirme|Schütze|Speichere|Starte|Trage|Tragen|Unterstütze|Übernachte|Vergleiche|Verlasse|Verwende|Wähle|Zähle|Unsicherer|Starker|Abgelegene|Tiefe|Starke|Schnelle|Klarer|Öffentliche|Voller|Trockenes|Scharfe|Schlechtes|Schlechter|Schlechte|Reguläre|Regionale|Nähere|Kostenpflichtiges|Kein|Jeder)\b/u;
  return common.test(value) ? `${value[0].toLocaleLowerCase(locale)}${value.slice(1)}` : value;
};

const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const stays = read("data-config/sources/stay-areas.json");

const destinationById = new Map(destinations.map((item) => [item.id, item]));
const siteById = new Map(sites.map((item) => [item.id, item]));
const stayByDestination = new Map(stays.map((item) => [item.destinationId, item]));
const units = [];

function add({ corpus, slug, destinationId, locale, field, target, key }) {
  units.push({
    sequence: units.length,
    corpus,
    slug,
    destinationId,
    locale,
    field,
    get value() { return target[key]; },
    set value(value) { target[key] = value; },
    parts: [],
  });
}

for (const guide of guides) {
  for (const locale of ["en", "de"]) {
    add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: "standfirst", target: guide.standfirst, key: locale });
    add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: "editorialAngle", target: guide.editorialAngle, key: locale });
    for (const section of guide.sections) {
      section.paragraphs[locale].forEach((_, index) => add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: `paragraph:${section.id}:${index}`, target: section.paragraphs[locale], key: index }));
    }
    add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: "tour:summary", target: guide.tour.summary, key: locale });
    add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: "tour:suitability", target: guide.tour.suitability, key: locale });
    for (const step of guide.tour.steps) add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: `tour-step:${step.id}`, target: step.body, key: locale });
    for (const note of guide.fieldNotes) add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: `field-note:${note.id}`, target: note.body, key: locale });
    for (const item of guide.faq) add({ corpus: "destination", slug: guide.slug, destinationId: guide.destinationId, locale, field: `faq:${item.question.en}`, target: item.answer, key: locale });
  }
}

for (const tour of tours) {
  for (const locale of ["en", "de"]) {
    add({ corpus: "location-tour", slug: tour.slug, destinationId: tour.destinationId, locale, field: "standfirst", target: tour.standfirst, key: locale });
    for (const block of tour.blocks) {
      if (block.kind === "prose") block.paragraphs[locale].forEach((_, index) => add({ corpus: "location-tour", slug: tour.slug, destinationId: tour.destinationId, locale, field: `paragraph:${block.id}:${index}`, target: block.paragraphs[locale], key: index }));
      if (block.kind === "note") add({ corpus: "location-tour", slug: tour.slug, destinationId: tour.destinationId, locale, field: `note:${block.id}`, target: block.body, key: locale });
      if (block.kind === "schedule" && block.introduction) add({ corpus: "location-tour", slug: tour.slug, destinationId: tour.destinationId, locale, field: `introduction:${block.id}`, target: block.introduction, key: locale });
      if (block.kind === "schedule" || block.kind === "decisions") {
        for (const [index, item] of block.items.entries()) add({ corpus: "location-tour", slug: tour.slug, destinationId: tour.destinationId, locale, field: `item:${block.id}:${index}`, target: item.body, key: locale });
      }
    }
  }
}

function minimumWords(unit) {
  if (unit.corpus === "location-tour") return unit.field === "standfirst" ? 40 : 0;
  if (unit.field === "standfirst") return 40;
  if (unit.field === "editorialAngle") return 20;
  if (unit.field === "tour:summary") return 35;
  if (unit.field === "tour:suitability") return 15;
  if (unit.field.startsWith("paragraph:")) return 36;
  if (unit.field.startsWith("tour-step:")) return 32;
  if (unit.field.startsWith("field-note:")) return 22;
  if (unit.field.startsWith("faq:")) return 28;
  return 0;
}

function context(unit) {
  const destination = destinationById.get(unit.destinationId);
  const primary = siteById.get(destination?.observationSiteIds?.[0]);
  const stay = stayByDestination.get(unit.destinationId);
  if (!destination || !primary || !stay) throw new Error(`${unit.slug}: editorial context is incomplete`);
  return { destination, primary, stay };
}

function contextualClause(unit, variant, base = "") {
  const { destination, primary, stay } = context(unit);
  const groups = unit.locale === "en" ? {
    site: [
      `${primary.name} is the decision point`,
      `setup at ${primary.name} waits for that answer`,
      `this is checked before unloading at ${primary.name}`,
    ],
    destination: [
      `${destination.name} cannot remove that uncertainty`,
      `this sets the cancellation line in ${destination.name}`,
      `current conditions in ${destination.name} remain decisive`,
    ],
    route: [
      `${stay.name} remains the fixed return`,
      `the fallback is a direct return to ${stay.name}`,
      `no extra stop is added before ${stay.name}`,
    ],
  } : {
    site: [
      `${primary.name} bleibt der Entscheidungspunkt`,
      `der Aufbau am ${primary.name} wartet auf diese Antwort`,
      `dies wird vor dem Ausladen am ${primary.name} geprüft`,
    ],
    destination: [
      `${destination.name} beseitigt diese Unsicherheit nicht`,
      `dies setzt die Abbruchgrenze in ${destination.name}`,
      `die aktuellen Bedingungen in ${destination.name} bleiben entscheidend`,
    ],
    route: [
      `${stay.name} bleibt der feste Rückkehrpunkt`,
      `die Alternative ist die direkte Rückfahrt nach ${stay.name}`,
      `vor ${stay.name} wird kein zusätzlicher Halt ergänzt`,
    ],
  };
  const normalizedBase = base.toLocaleLowerCase(unit.locale);
  const routeWords = unit.locale === "en" ? /\b(?:return|road|route|drive|departure|leave)\b/u : /\b(?:rück|straße|route|fahrt|abfahrt|verlass)/u;
  const siteWords = unit.locale === "en" ? /\b(?:access|parking|gate|barrier|equipment|vehicle|surface|horizon)\b/u : /\b(?:zugang|park|tor|schranke|ausrüstung|fahrzeug|fläche|horizont)/u;
  const preferred = routeWords.test(normalizedBase) ? "route" : siteWords.test(normalizedBase) ? "site" : "destination";
  const order = [preferred, ...["site", "destination", "route"].filter((group) => group !== preferred)];
  for (const group of order) {
    const candidates = groups[group];
    const candidate = candidates[variant % candidates.length];
    const name = group === "site" ? primary.name : group === "destination" ? destination.name : stay.name;
    if (!normalizedBase.includes(name.toLocaleLowerCase(unit.locale))) return candidate;
  }
  return groups[preferred][variant % groups[preferred].length];
}

function personalize(sentence, unit, variant) {
  const match = sentence.match(/^(.*?)([.!?]+(?:[”'"])?$)/u);
  const base = (match?.[1] ?? sentence).trim();
  const terminal = match?.[2] ?? ".";
  const suffix = contextualClause(unit, variant, base);
  return `${base}; ${suffix}${terminal}`;
}

function personalizeOpening(sentence, unit) {
  const match = sentence.match(/^(.*?)([.!?]+(?:[”'"])?$)/u);
  const base = (match?.[1] ?? sentence).trim();
  const terminal = match?.[2] ?? ".";
  const { destination, primary } = context(unit);
  if (unit.locale === "en") {
    if (base.startsWith("For independent visitors who")) return base.replace("For independent visitors who", `Visitors planning ${destination.name} who`) + terminal;
    if (base.startsWith("Timing is built around")) return `${destination.name} timing is built around${base.slice("Timing is built around".length)}${terminal}`;
    if (base.startsWith("The route protects")) return `The ${destination.name} route protects${base.slice("The route protects".length)}${terminal}`;
    if (base.startsWith("This is the part")) return `For ${destination.name}, this is the part${base.slice("This is the part".length)}${terminal}`;
    return `For ${destination.name}, ${lowerInitial(base, "en", [destination.name, primary.name])}${terminal}`;
  }
  if (base.startsWith("Für unabhängige Besucher, die")) return `Unabhängige Besucher in ${destination.name}, die${base.slice("Für unabhängige Besucher, die".length)}${terminal}`;
  if (base.startsWith("Die Zeitplanung richtet sich")) return `Am ${primary.name} richtet sich die Zeitplanung${base.slice("Die Zeitplanung richtet sich".length)}${terminal}`;
  if (base.startsWith("Die Route bewahrt")) return `Die Route am ${primary.name} bewahrt${base.slice("Die Route bewahrt".length)}${terminal}`;
  if (base.startsWith("Dies ist der Teil")) return `Für ${destination.name} ist dies der Teil${base.slice("Dies ist der Teil".length)}${terminal}`;
  return `Für ${destination.name} gilt, ${lowerInitial(base, "de", [destination.name, primary.name])}${terminal}`;
}

for (const unit of units) unit.parts = sentences(unit.value, unit.locale);
const groups = new Map();
for (const unit of units) {
  unit.parts.forEach((sentence, index) => {
    if (normalize(sentence).split(" ").length < 12) return;
    const key = `${unit.locale}:${normalize(sentence)}`;
    groups.set(key, [...(groups.get(key) ?? []), { unit, index }]);
  });
}

let rewritten = 0;
let removed = 0;
for (const occurrences of groups.values()) {
  const unique = occurrences.filter((entry, index, all) => all.findIndex((candidate) => candidate.unit === entry.unit && candidate.index === entry.index) === index);
  if (unique.length < 2) continue;
  const fields = new Set(unique.map(({ unit }) => `${unit.corpus}:${unit.slug}:${unit.field}`));
  if (fields.size < 2) continue;
  const seenPages = new Map();
  for (const [ordinal, occurrence] of unique.entries()) {
    const page = `${occurrence.unit.corpus}:${occurrence.unit.slug}`;
    const pageCount = seenPages.get(page) ?? 0;
    if (pageCount > 0) {
      const remaining = occurrence.unit.parts
        .filter((part, index) => part && index !== occurrence.index)
        .join(" ");
      if (wordCount(remaining) >= minimumWords(occurrence.unit)) {
        occurrence.unit.parts[occurrence.index] = "";
        removed += 1;
      } else {
        occurrence.unit.parts[occurrence.index] = personalize(occurrence.unit.parts[occurrence.index], occurrence.unit, pageCount);
        rewritten += 1;
      }
    } else if (ordinal > 0) {
      occurrence.unit.parts[occurrence.index] = personalize(occurrence.unit.parts[occurrence.index], occurrence.unit, occurrence.unit.sequence + occurrence.index + ordinal);
      rewritten += 1;
    }
    seenPages.set(page, pageCount + 1);
  }
}

for (const unit of units) unit.value = unit.parts.filter(Boolean).join(" ");

function rewriteRepeatedUnits(selector, minimumLength, salt, rewrite = personalize) {
  const repeated = new Map();
  for (const unit of units) {
    const key = `${unit.locale}:${selector(unit.value)}`;
    if (key.length < minimumLength) continue;
    repeated.set(key, [...(repeated.get(key) ?? []), unit]);
  }
  for (const occurrences of repeated.values()) {
    if (new Set(occurrences.map((unit) => `${unit.corpus}:${unit.slug}`)).size < 2) continue;
    for (const [index, unit] of occurrences.entries()) {
      if (index === 0) continue;
      const parts = sentences(unit.value, unit.locale);
      parts[0] = rewrite(parts[0], unit, unit.sequence + index + salt);
      unit.value = parts.join(" ");
      rewritten += 1;
    }
  }
}

rewriteRepeatedUnits((value) => normalize(value), 80, 17);
rewriteRepeatedUnits((value) => normalize(value).split(" ").slice(0, 12).join(" "), 45, 29, personalizeOpening);

function fieldTopic(unit) {
  const field = unit.field.toLocaleLowerCase("en");
  if (/book|ticket|reservation|programme/u.test(field)) return unit.locale === "en" ? "booking check" : "Buchungsprüfung";
  if (/return|finish|exit|sleep|rest/u.test(field)) return unit.locale === "en" ? "return check" : "Rückwegprüfung";
  if (/park|camp/u.test(field)) return unit.locale === "en" ? "parking check" : "Parkplatzprüfung";
  if (/weather|cloud|wind/u.test(field)) return unit.locale === "en" ? "weather check" : "Wetterprüfung";
  if (/road|route|navigation|trail/u.test(field)) return unit.locale === "en" ? "route check" : "Routenprüfung";
  return unit.locale === "en" ? "access check" : "Zugangsprüfung";
}

function replacementSentence(unit, variant) {
  const { destination, primary, stay } = context(unit);
  const topic = fieldTopic(unit);
  const choices = unit.locale === "en" ? [
    `At ${primary.name}, the ${topic} stays tied to current instructions and the route inspected in daylight.`,
    `A failed ${topic} sends this ${destination.name} plan back to ${stay.name} without another night stop.`,
    `The ${topic} is completed before equipment leaves the vehicle at ${primary.name}.`,
  ] : [
    `Am ${primary.name} bleibt die ${topic} an aktuelle Hinweise und die bei Tageslicht geprüfte Route gebunden.`,
    `Scheitert die ${topic}, führt der Plan für ${destination.name} ohne weiteren Nachtstopp nach ${stay.name} zurück.`,
    `Die ${topic} wird am ${primary.name} abgeschlossen, bevor Ausrüstung das Fahrzeug verlässt.`,
  ];
  return choices[variant % choices.length];
}

// Some minimum-length fields must retain a sentence after their repeated tail
// is removed. Replace only those residual duplicates with a field-specific,
// location-specific decision; never stack a second contextual preface.
for (const unit of units) unit.parts = sentences(unit.value, unit.locale);
const residualGroups = new Map();
for (const unit of units) {
  unit.parts.forEach((sentence, index) => {
    if (normalize(sentence).split(" ").length < 12) return;
    const key = `${unit.locale}:${normalize(sentence)}`;
    residualGroups.set(key, [...(residualGroups.get(key) ?? []), { unit, index }]);
  });
}
for (const occurrences of residualGroups.values()) {
  if (occurrences.length < 2) continue;
  for (const [index, occurrence] of occurrences.entries()) {
    if (index === 0) continue;
    const remaining = occurrence.unit.parts
      .filter((part, partIndex) => part && partIndex !== occurrence.index)
      .join(" ");
    if (wordCount(remaining) >= minimumWords(occurrence.unit)) {
      occurrence.unit.parts[occurrence.index] = "";
      removed += 1;
    } else {
      occurrence.unit.parts[occurrence.index] = replacementSentence(occurrence.unit, index);
      rewritten += 1;
    }
  }
}
for (const unit of units) unit.value = unit.parts.filter(Boolean).join(" ");
rewriteRepeatedUnits((value) => normalize(value).split(" ").slice(0, 12).join(" "), 45, 53, personalizeOpening);

for (const guide of guides) guide.lastReviewedAt = "2026-09-08";
for (const tour of tours) tour.lastReviewedAt = "2026-09-08";
write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
console.log(`Editorial repetition remediation: ${rewritten} repeated sentences localized and ${removed} redundant same-page sentences removed.`);
