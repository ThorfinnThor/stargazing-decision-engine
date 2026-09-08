import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const stays = read("data-config/sources/stay-areas.json");
const imageAudit = read("data-config/sources/destination-image-audit-2026-09-08.json");

const splitSentences = (value) => value.match(/[^.!?]+[.!?]+(?:[”'"])?|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [];
const joinSentences = (sentences) => sentences.join(" ").replace(/\s+/g, " ").trim();

function removeSharedOpening(canonical, targets, prefixes = []) {
  for (const locale of ["en", "de"]) {
    const sentenceLists = [canonical[locale], ...targets.map((target) => target[locale])].map(splitSentences);
    let sharedCount = 0;
    while (sentenceLists.every((sentences) => sentences[sharedCount] === sentenceLists[0][sharedCount])) sharedCount += 1;
    if (sharedCount === 0) throw new Error(`No shared sentence opening found for ${canonical[locale].slice(0, 60)}`);
    targets.forEach((target, index) => {
      const remainder = joinSentences(sentenceLists[index + 1].slice(sharedCount));
      if (!remainder) throw new Error("Editorial remediation would create an empty text unit");
      target[locale] = joinSentences([prefixes[index]?.[locale], remainder].filter(Boolean));
    });
  }
}

for (const { destinationSlug } of imageAudit.candidates) {
  const destination = destinations.find((item) => item.slug === destinationSlug);
  const guide = guides.find((item) => item.slug === destinationSlug);
  const tour = tours.find((item) => item.destinationId === destination.id);
  const primary = sites.find((item) => item.id === destination.observationSiteIds[0]);
  const secondary = sites.find((item) => item.id === destination.observationSiteIds[1]);
  const stay = stays.find((item) => item.destinationId === destination.id);
  if (!destination || !guide || !tour || !primary || !secondary || !stay) throw new Error(`${destinationSlug}: editorial context is incomplete`);
  const section = (suffix) => guide.sections.find((item) => item.id === `${destinationSlug}-${suffix}`);
  const block = (suffix) => tour.blocks.find((item) => item.id === `${destinationSlug}-${suffix}`);
  const placeChoice = section("place-choice");
  const limitingCondition = section("limiting-condition");
  const fieldRhythm = section("field-rhythm");
  const weatherNote = guide.fieldNotes.find((item) => item.id === `${destinationSlug}-weather-note`);
  const fallbackNote = guide.fieldNotes.find((item) => item.id === `${destinationSlug}-fallback-note`);
  const tourGround = block("tour-ground");
  const tourVeto = block("tour-veto");
  const tourChoices = block("tour-choices");
  if (!placeChoice || !limitingCondition || !fieldRhythm || !weatherNote || !fallbackNote || !tourGround || !tourVeto || !tourChoices) {
    throw new Error(`${destinationSlug}: generated editorial sections are incomplete`);
  }

  // Arrays cannot be mutated through temporary objects, so use a small assignment helper for all groups below.
  const mutateGroup = (canonical, entries, prefixes = []) => {
    const proxies = entries.map((entry) => ({ en: entry.get("en"), de: entry.get("de") }));
    removeSharedOpening(canonical, proxies, prefixes);
    proxies.forEach((proxy, index) => {
      entries[index].set("en", proxy.en);
      entries[index].set("de", proxy.de);
    });
  };
  const paragraphEntry = (paragraphs, index) => ({ get: (locale) => paragraphs[locale][index], set: (locale, value) => { paragraphs[locale][index] = value; } });
  const localizedEntry = (holder, key) => ({ get: (locale) => holder[key][locale], set: (locale, value) => { holder[key][locale] = value; } });

  mutateGroup(guide.standfirst, [paragraphEntry(placeChoice.paragraphs, 0), paragraphEntry(tourGround.paragraphs, 0)]);

  mutateGroup(guide.editorialAngle, [
    paragraphEntry(fieldRhythm.paragraphs, 0),
    localizedEntry(guide.tour, "summary"),
    localizedEntry(tour, "standfirst"),
  ], [
    { en: `At ${primary.name}, the useful part of the evening begins before sunset.`, de: `Am ${primary.name} beginnt der praktische Teil des Abends vor Sonnenuntergang.` },
  ]);
  mutateGroup({ en: limitingCondition.paragraphs.en[0], de: limitingCondition.paragraphs.de[0] }, [
    localizedEntry(weatherNote, "body"),
    localizedEntry(tourVeto, "body"),
  ], [
    { en: `For ${destination.name}, current evidence belongs beside the historical month ranking.`, de: `Für ${destination.name} gehören aktuelle Hinweise neben die historische Monatsrangliste.` },
    { en: `At ${primary.name}, decide whether to cancel before unloading.`, de: `Am ${primary.name} fällt die Absageentscheidung vor dem Ausladen.` },
  ]);
  mutateGroup({ en: fieldRhythm.paragraphs.en[1], de: fieldRhythm.paragraphs.de[1] }, [
    paragraphEntry(tourGround.paragraphs, 1),
  ], [
    { en: `At ${primary.name}, practical courtesy starts with a compact footprint.`, de: `Am ${primary.name} beginnt Rücksicht mit einer kompakten Aufstellfläche.` },
  ]);
  mutateGroup(fallbackNote.body, [
    localizedEntry(tourChoices.items[1], "body"),
  ], [
    { en: `If ${primary.name} fails as a plan, return to ${stay.name}.`, de: `Wenn der Plan am ${primary.name} scheitert, kehre nach ${stay.name} zurück.` },
  ]);

  guide.lastReviewedAt = "2026-09-08";
  tour.lastReviewedAt = "2026-09-08";
}

write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
console.log(`Reworked repeated passages across ${imageAudit.candidates.length} destination guides and their location tours.`);
