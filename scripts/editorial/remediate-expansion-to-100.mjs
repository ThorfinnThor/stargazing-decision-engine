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

const expansionIds = new Set([
  "central-idaho", "cosmic-campground", "flagstaff", "watoga", "mesa-verde",
  "chaco-culture", "craters-of-the-moon", "antelope-island", "pic-du-midi", "cevennes",
  "alpes-azur-mercantour", "rhoen", "winklmoosalm", "lauwersmeer", "de-boschplaat",
  "mon-and-nyord", "bukk", "albanya", "iriomote-ishigaki", "kozushima",
  "om-dark-sky", "bulbjerg", "bisei", "minami-rokuroshi", "lapalala",
]);

const prefix = (localized, addition) => {
  localized.en = `${addition.en} ${localized.en}`;
  localized.de = `${addition.de} ${localized.de}`;
};

for (const destinationId of expansionIds) {
  const destination = destinations.find((item) => item.id === destinationId);
  const guide = guides.find((item) => item.destinationId === destinationId);
  const tour = tours.find((item) => item.destinationId === destinationId);
  const primary = sites.find((item) => item.id === destination?.observationSiteIds?.[0]);
  const secondary = sites.find((item) => item.id === destination?.observationSiteIds?.[1]);
  const stay = stays.find((item) => item.destinationId === destinationId);
  if (!destination || !guide || !tour || !primary || !secondary || !stay) {
    throw new Error(`${destinationId}: editorial context is incomplete`);
  }

  const section = (suffix) => guide.sections.find((item) => item.id === `${destinationId}-${suffix}`);
  const block = (suffix) => tour.blocks.find((item) => item.id === `${destinationId}-tour-${suffix}`);
  const place = section("place");
  const limit = section("limit");
  const field = section("field");
  const weather = guide.fieldNotes.find((item) => item.id === `${destinationId}-weather-note`);
  const light = guide.fieldNotes.find((item) => item.id === `${destinationId}-light-note`);
  const tourPlace = block("place");
  const timing = block("timing");
  const decisions = block("decisions");
  const warning = block("warning");
  if (!place || !limit || !field || !weather || !light || !tourPlace || !timing || !decisions || !warning) {
    throw new Error(`${destinationId}: generated editorial sections are incomplete`);
  }

  prefix(
    { get en() { return place.paragraphs.en[0]; }, set en(value) { place.paragraphs.en[0] = value; }, get de() { return place.paragraphs.de[0]; }, set de(value) { place.paragraphs.de[0] = value; } },
    { en: `For ${primary.name}, the regional designation becomes a specific arrival decision.`, de: `Am ${primary.name} wird die regionale Auszeichnung zu einer konkreten Ankunftsentscheidung.` },
  );
  prefix(
    { get en() { return tourPlace.paragraphs.en[0]; }, set en(value) { tourPlace.paragraphs.en[0] = value; }, get de() { return tourPlace.paragraphs.de[0]; }, set de(value) { tourPlace.paragraphs.de[0] = value; } },
    { en: `This route deliberately narrows ${destination.name} to one known place for the evening.`, de: `Diese Route begrenzt ${destination.name} bewusst auf einen bekannten Ort für den Abend.` },
  );

  prefix(
    { get en() { return field.paragraphs.en[0]; }, set en(value) { field.paragraphs.en[0] = value; }, get de() { return field.paragraphs.de[0]; }, set de(value) { field.paragraphs.de[0] = value; } },
    { en: `Daylight at ${primary.name} is working time for the route, not decorative scenery.`, de: `Tageslicht am ${primary.name} ist Arbeitszeit für die Route und keine bloße Kulisse.` },
  );
  prefix(guide.tour.summary, {
    en: `${destination.name}'s route is intentionally narrower than the two-site comparison above.`,
    de: `Die Route für ${destination.name} ist bewusst enger als der Vergleich der beiden Orte darüber.`,
  });
  prefix(tour.standfirst, {
    en: `The standalone route answers one practical question about an evening at ${primary.name}.`,
    de: `Die eigenständige Route beantwortet eine praktische Frage zum Abend am ${primary.name}.`,
  });
  prefix(timing.items[1].body, {
    en: `Arrival at ${primary.name} has one purpose before the sky becomes fully dark.`,
    de: `Die Ankunft am ${primary.name} hat vor vollständiger Dunkelheit einen klaren Zweck.`,
  });

  prefix(weather.body, {
    en: `For ${destination.name}, live conditions belong beside the historical month comparison.`,
    de: `Für ${destination.name} gehören aktuelle Bedingungen neben den historischen Monatsvergleich.`,
  });
  prefix(timing.items[0].body, {
    en: `The go or no-go decision for ${primary.name} is made back in ${stay.name}.`,
    de: `Die Entscheidung für oder gegen ${primary.name} fällt bereits in ${stay.name}.`,
  });
  prefix(warning.body, {
    en: `At ${primary.name}, the cancellation boundary is checked before anything is unloaded.`,
    de: `Am ${primary.name} wird die Absagegrenze geprüft, bevor etwas ausgeladen wird.`,
  });

  prefix(light.body, {
    en: `Light discipline at ${primary.name} protects the landscape described by the cited authorities.`,
    de: `Lichtdisziplin am ${primary.name} schützt die von den Quellen beschriebene Landschaft.`,
  });
  prefix(
    { get en() { return tourPlace.paragraphs.en[1]; }, set en(value) { tourPlace.paragraphs.en[1] = value; }, get de() { return tourPlace.paragraphs.de[1]; }, set de(value) { tourPlace.paragraphs.de[1] = value; } },
    { en: `A compact setup matters at ${primary.name} because the visitor footprint is shared.`, de: `Ein kompakter Aufbau zählt am ${primary.name}, weil die Besucherfläche geteilt wird.` },
  );
  prefix(timing.items[2].body, {
    en: `Once darkness reaches ${primary.name}, movement should become smaller rather than wider.`,
    de: `Wenn es am ${primary.name} dunkel wird, sollten die Bewegungen kleiner statt weiter werden.`,
  });

  if (guide.faq?.[0]) {
    prefix(guide.faq[0].answer, {
      en: `${primary.name} still requires a date-specific access decision despite its published status.`,
      de: `${primary.name} verlangt trotz seines veröffentlichten Status eine Zugangsentscheidung für das konkrete Datum.`,
    });
  }
  if (guide.faq?.[1]) {
    prefix(guide.faq[1].answer, {
      en: `The monthly ranking for ${destination.name} answers a seasonal question, not tonight's conditions.`,
      de: `Die Monatsrangliste für ${destination.name} beantwortet eine saisonale Frage und nicht die Bedingungen heute Nacht.`,
    });
  }
  prefix(decisions.items[0].body, {
    en: `A confirmed evening at ${primary.name} has a deliberately narrow shape.`,
    de: `Ein bestätigter Abend am ${primary.name} folgt bewusst einem engen Ablauf.`,
  });

  guide.lastReviewedAt = "2026-09-08";
  tour.lastReviewedAt = "2026-09-08";
}

write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
console.log(`Reworked repeated openings across ${expansionIds.size} newly added destination guides and location tours.`);
