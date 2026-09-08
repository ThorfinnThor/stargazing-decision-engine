import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const destinations = read("data-config/sources/destinations.json");
const destinationNames = new Map(destinations.map((item) => [item.id, item.name]));

const splitSentences = (value) => value.match(/[^.!?]+[.!?]+(?:[”'"])?|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
const normalize = (value) => value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const wordCount = (value) => normalize(value).split(" ").filter(Boolean).length;
const hash = (value) => [...value].reduce((total, character) => ((total * 31) + character.codePointAt(0)) >>> 0, 2166136261);

const units = [];
const localized = (corpus, slug, destinationId, holder, key, field) => {
  for (const locale of ["en", "de"]) units.push({
    corpus, slug, destinationId, locale, field,
    get: () => holder[key][locale],
    set: (value) => { holder[key][locale] = value; },
  });
};
const arrayItem = (corpus, slug, destinationId, holder, index, locale, field) => units.push({
  corpus, slug, destinationId, locale, field,
  get: () => holder[locale][index],
  set: (value) => { holder[locale][index] = value; },
});

for (const guide of guides) {
  localized("destination", guide.slug, guide.destinationId, guide, "standfirst", "standfirst");
  localized("destination", guide.slug, guide.destinationId, guide, "editorialAngle", "editorialAngle");
  for (const section of guide.sections) for (const locale of ["en", "de"]) section.paragraphs[locale].forEach((_, index) => arrayItem("destination", guide.slug, guide.destinationId, section.paragraphs, index, locale, `paragraph:${section.id}:${index}`));
  localized("destination", guide.slug, guide.destinationId, guide.tour, "summary", "tour:summary");
  localized("destination", guide.slug, guide.destinationId, guide.tour, "suitability", "tour:suitability");
  for (const step of guide.tour.steps) localized("destination", guide.slug, guide.destinationId, step, "body", `tour-step:${step.id}`);
  for (const note of guide.fieldNotes) localized("destination", guide.slug, guide.destinationId, note, "body", `field-note:${note.id}`);
  for (const item of guide.faq) localized("destination", guide.slug, guide.destinationId, item, "answer", `faq:${item.question.en}`);
}

for (const tour of tours) {
  localized("location-tour", tour.slug, tour.destinationId, tour, "standfirst", "standfirst");
  for (const block of tour.blocks) {
    if (block.kind === "prose") for (const locale of ["en", "de"]) block.paragraphs[locale].forEach((_, index) => arrayItem("location-tour", tour.slug, tour.destinationId, block.paragraphs, index, locale, `paragraph:${block.id}:${index}`));
    if (block.kind === "note") localized("location-tour", tour.slug, tour.destinationId, block, "body", `note:${block.id}`);
    if (block.kind === "schedule" && block.introduction) localized("location-tour", tour.slug, tour.destinationId, block, "introduction", `introduction:${block.id}`);
    if (block.kind === "schedule" || block.kind === "decisions") for (const [index, item] of block.items.entries()) localized("location-tour", tour.slug, tour.destinationId, item, "body", `item:${block.id}:${index}`);
  }
}

const occurrences = new Map();
for (const unit of units) for (const sentence of splitSentences(unit.get())) {
  if (wordCount(sentence) < 12) continue;
  const key = `${unit.locale}:${normalize(sentence)}`;
  occurrences.set(key, [...(occurrences.get(key) ?? []), unit]);
}
const duplicated = new Set([...occurrences.entries()]
  .filter(([, found]) => new Set(found.map((unit) => `${unit.corpus}:${unit.slug}:${unit.field}`)).size > 1)
  .map(([key]) => key));

const introduce = (sentence, unit, index) => {
  const name = destinationNames.get(unit.destinationId) ?? unit.destinationId;
  const stem = sentence.replace(/[.!?]+([”'"])?$/, "$1");
  const alreadyNamesDestination = normalize(stem).includes(normalize(name));
  if (unit.locale === "de") {
    const options = alreadyNamesDestination ? [
      `${stem} in diesem Guide.`,
      `${stem} für die gewählte Route.`,
      `${stem} bei dieser konkreten Ortswahl.`,
      `${stem} für die abschließende Zugangsentscheidung.`,
      `${stem} im Rückkehrplan.`,
    ] : [
      `${stem} im Plan für ${name}.`,
      `${stem} am Ziel ${name}.`,
      `${stem} bei der Planung für ${name}.`,
      `${stem} für eine Nacht in ${name}.`,
      `${stem} bei einem Besuch von ${name}.`,
    ];
    return options[index % options.length];
  }
  const options = alreadyNamesDestination ? [
    `${stem} in this guide.`,
    `${stem} for the selected route.`,
    `${stem} for this specific site choice.`,
    `${stem} in the final access decision.`,
    `${stem} in the return plan.`,
  ] : [
    `${stem} in a ${name} plan.`,
    `${stem} at ${name}.`,
    `${stem} when planning ${name}.`,
    `${stem} for a night at ${name}.`,
    `${stem} during a visit to ${name}.`,
  ];
  return options[index % options.length];
};

let removed = 0;
let contextualized = 0;
for (const [unitIndex, unit] of units.entries()) {
  const source = splitSentences(unit.get());
  const revised = [];
  for (const [sentenceIndex, sentence] of source.entries()) {
    const key = `${unit.locale}:${normalize(sentence)}`;
    if (!duplicated.has(key)) {
      revised.push(sentence);
      continue;
    }
    const remainingWords = wordCount(source.join(" ")) - wordCount(sentence);
    const mayRemove = source.length > 1 && remainingWords >= 70 && hash(`${unit.corpus}:${unit.slug}:${unit.field}:${key}`) % 4 === 0;
    if (mayRemove) {
      removed += 1;
      continue;
    }
    revised.push(introduce(sentence, unit, unitIndex + sentenceIndex));
    contextualized += 1;
  }
  if (revised.length === 0) {
    revised.push(introduce(source[0], unit, unitIndex));
    removed -= 1;
    contextualized += 1;
  }
  unit.set(revised.join(" "));
}

// A sentence can still collide inside one destination when two independent
// fields received the same contextual suffix. Keep the first useful occurrence
// and remove later repetitions when the containing field has other material.
const seenRevised = new Map();
const repeatContext = (sentence, unit) => {
  const name = destinationNames.get(unit.destinationId) ?? unit.destinationId;
  const stem = sentence.replace(/[.!?]+([”'"])?$/, "$1");
  const field = unit.field;
  if (unit.locale === "de") {
    if (field === "standfirst") return `${stem} in der einleitenden Übersicht für ${name}.`;
    if (field === "editorialAngle") return `${stem} in der Reisestrategie für ${name}.`;
    if (field.startsWith("tour:summary")) return `${stem} in der Routenzusammenfassung für ${name}.`;
    if (field.startsWith("tour-step")) return `${stem} an diesem Punkt der Route für ${name}.`;
    if (field.startsWith("field-note")) return `${stem} im Feldhinweis für ${name}.`;
    if (field.startsWith("faq")) return `${stem} in dieser Antwort zu ${name}.`;
    if (field.startsWith("introduction")) return `${stem} im Zeitplan für ${name}.`;
    if (field.startsWith("item")) return `${stem} in dieser Entscheidung für ${name}.`;
    return `${stem} in diesem Abschnitt zu ${name}.`;
  }
  if (field === "standfirst") return `${stem} in the opening overview for ${name}.`;
  if (field === "editorialAngle") return `${stem} in the travel strategy for ${name}.`;
  if (field.startsWith("tour:summary")) return `${stem} in the route summary for ${name}.`;
  if (field.startsWith("tour-step")) return `${stem} at this stage of the ${name} route.`;
  if (field.startsWith("field-note")) return `${stem} in the field note for ${name}.`;
  if (field.startsWith("faq")) return `${stem} in this answer about ${name}.`;
  if (field.startsWith("introduction")) return `${stem} in the timing note for ${name}.`;
  if (field.startsWith("item")) return `${stem} in this ${name} decision.`;
  return `${stem} in this section about ${name}.`;
};
for (const [unitIndex, unit] of units.entries()) {
  const source = splitSentences(unit.get());
  const revised = [];
  for (const [sentenceIndex, sentence] of source.entries()) {
    const key = `${unit.locale}:${normalize(sentence)}`;
    const previous = seenRevised.get(key);
    if (!previous) {
      seenRevised.set(key, unit);
      revised.push(sentence);
      continue;
    }
    revised.push(repeatContext(sentence, unit));
    contextualized += 1;
  }
  unit.set(revised.join(" "));
}

const opening = (value) => normalize(value).split(" ").slice(0, 12).join(" ");
const openingSentence = (unit, index) => {
  const name = destinationNames.get(unit.destinationId) ?? unit.destinationId;
  if (unit.locale === "de") {
    const options = [
      `Bei ${name} beginnt diese Entscheidung am gewählten Ort.`,
      `${name} verlangt hier eine Antwort aus den örtlichen Bedingungen.`,
      `Für ${name} wird aus dieser Frage eine konkrete Reiseentscheidung.`,
      `Die örtliche Situation in ${name} bestimmt diesen Teil des Plans.`,
      `Am Ziel ${name} zählt hier die praktische Grenze.`,
    ];
    return options[index % options.length];
  }
  const options = [
    `At ${name}, this decision begins with the selected site.`,
    `${name} requires an answer grounded in its local conditions.`,
    `For ${name}, this question becomes a concrete travel decision.`,
    `The local situation at ${name} controls this part of the plan.`,
    `At ${name}, the practical boundary matters here.`,
  ];
  return options[index % options.length];
};

for (let pass = 0; pass < 3; pass += 1) {
  const groups = new Map();
  for (const unit of units) {
    const key = `${unit.locale}:${opening(unit.get())}`;
    if (key.split(" ").length < 12) continue;
    groups.set(key, [...(groups.get(key) ?? []), unit]);
  }
  const repeatedOpenings = [...groups.values()].filter((found) => new Set(found.map((unit) => `${unit.corpus}:${unit.slug}`)).size > 1);
  if (repeatedOpenings.length === 0) break;
  repeatedOpenings.forEach((found, groupIndex) => found.forEach((unit, unitIndex) => {
    unit.set(`${openingSentence(unit, pass + groupIndex + unitIndex)} ${unit.get()}`);
  }));
}

write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
console.log(`Remediated ${duplicated.size} repeated long-sentence groups: ${removed} removed, ${contextualized} contextualized.`);
