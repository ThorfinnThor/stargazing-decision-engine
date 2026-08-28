import type { Destination, DestinationEditorialGuide } from "../data/types.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function requireWords(value: string, minimum: number, label: string) {
  if (wordCount(value) < minimum) throw new Error(`${label} requires at least ${minimum} words`);
}

function normalized(value: string) {
  return value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function validateDestinationEditorialGuides(guides: DestinationEditorialGuide[], destinations: Destination[]) {
  if (guides.length === 0) throw new Error("Destination editorial catalog cannot be empty");
  const destinationsById = new Map(destinations.map((destination) => [destination.id, destination]));
  const slugs = new Set<string>();
  const globalHeadings = new Set<string>();
  const globalParagraphs = new Set<string>();

  for (const guide of guides) {
    const destination = destinationsById.get(guide.destinationId);
    if (!destination || destination.slug !== guide.slug) throw new Error(`${guide.slug}: destination identity does not resolve`);
    if (!slugPattern.test(guide.slug) || slugs.has(guide.slug)) throw new Error(`${guide.slug}: invalid or duplicate editorial slug`);
    slugs.add(guide.slug);
    if (!datePattern.test(guide.lastReviewedAt)) throw new Error(`${guide.slug}: lastReviewedAt must be an ISO date`);
    if (guide.sections.length < 3 || guide.sections.length > 7) throw new Error(`${guide.slug}: requires 3–7 editorial sections`);
    if (guide.tour.steps.length < 4 || guide.tour.steps.length > 6) throw new Error(`${guide.slug}: tour requires 4–6 specific steps`);
    if (guide.fieldNotes.length < 3 || guide.faq.length < 2 || guide.sources.length < 3) throw new Error(`${guide.slug}: practical notes, FAQ, or sources are incomplete`);

    const sourceIds = new Set(guide.sources.map((source) => source.id));
    if (sourceIds.size !== guide.sources.length) throw new Error(`${guide.slug}: source IDs must be unique`);
    for (const source of guide.sources) {
      if (!slugPattern.test(source.id) || !source.url.startsWith("https://") || !datePattern.test(source.checkedAt)) throw new Error(`${guide.slug}: source ${source.id} is incomplete`);
    }
    const usedSourceIds = new Set<string>();
    const verifySources = (ids: string[], label: string) => {
      if (ids.length === 0) throw new Error(`${guide.slug}: ${label} requires a source`);
      for (const id of ids) {
        if (!sourceIds.has(id)) throw new Error(`${guide.slug}: ${label} references unknown source ${id}`);
        usedSourceIds.add(id);
      }
    };

    for (const locale of ["en", "de"] as const) {
      requireWords(guide.seoDescription[locale], 12, `${guide.slug} ${locale} SEO description`);
      requireWords(guide.standfirst[locale], 40, `${guide.slug} ${locale} standfirst`);
      requireWords(guide.editorialAngle[locale], 20, `${guide.slug} ${locale} editorial angle`);
      requireWords(guide.tour.summary[locale], 35, `${guide.slug} ${locale} tour summary`);
      requireWords(guide.tour.suitability[locale], 15, `${guide.slug} ${locale} tour suitability`);
      let editorialWords = wordCount(guide.standfirst[locale]) + wordCount(guide.editorialAngle[locale]) + wordCount(guide.tour.summary[locale]);

      for (const section of guide.sections) {
        const heading = normalized(section.heading[locale]);
        if (!heading || globalHeadings.has(`${locale}:${heading}`)) throw new Error(`${guide.slug}: repeated or empty ${locale} section heading`);
        globalHeadings.add(`${locale}:${heading}`);
        const body = section.paragraphs[locale].join(" ");
        requireWords(body, 70, `${guide.slug} ${locale} section ${section.id}`);
        editorialWords += wordCount(body);
        for (const paragraph of section.paragraphs[locale]) {
          requireWords(paragraph, 28, `${guide.slug} ${locale} paragraph ${section.id}`);
          const fingerprint = `${locale}:${normalized(paragraph)}`;
          if (globalParagraphs.has(fingerprint)) throw new Error(`${guide.slug}: duplicate ${locale} paragraph detected`);
          globalParagraphs.add(fingerprint);
        }
      }
      for (const step of guide.tour.steps) {
        requireWords(step.body[locale], 32, `${guide.slug} ${locale} tour step ${step.id}`);
        editorialWords += wordCount(step.body[locale]);
      }
      for (const note of guide.fieldNotes) {
        requireWords(note.body[locale], 22, `${guide.slug} ${locale} field note ${note.id}`);
        editorialWords += wordCount(note.body[locale]);
      }
      for (const item of guide.faq) {
        requireWords(item.answer[locale], 28, `${guide.slug} ${locale} FAQ answer`);
        editorialWords += wordCount(item.answer[locale]);
      }
      if (editorialWords < 650) throw new Error(`${guide.slug}: ${locale} editorial depth is only ${editorialWords} words`);
    }

    for (const section of guide.sections) verifySources(section.sourceIds, `section ${section.id}`);
    verifySources(guide.tour.sourceIds, "tour");
    for (const step of guide.tour.steps) verifySources(step.sourceIds, `tour step ${step.id}`);
    for (const note of guide.fieldNotes) verifySources(note.sourceIds, `field note ${note.id}`);
    for (const item of guide.faq) verifySources(item.sourceIds, `FAQ ${item.question.en}`);
    for (const sourceId of sourceIds) {
      if (!usedSourceIds.has(sourceId)) throw new Error(`${guide.slug}: unused source ${sourceId}`);
    }
  }
}

export function destinationGuideWordCount(guide: DestinationEditorialGuide, locale: "en" | "de") {
  const values = [
    guide.standfirst[locale], guide.editorialAngle[locale], guide.tour.summary[locale], guide.tour.suitability[locale],
    ...guide.sections.flatMap((section) => section.paragraphs[locale]),
    ...guide.tour.steps.map((step) => step.body[locale]),
    ...guide.fieldNotes.map((note) => note.body[locale]),
    ...guide.faq.map((item) => item.answer[locale]),
  ];
  return wordCount(values.join(" "));
}
