export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const localeCopy = {
  en: {
    htmlLang: "en",
    eyebrow: "A decision engine for dark-sky travel",
    titleLead: "Know when the night",
    titleAccent: "is worth the journey.",
    lede: "A data-driven guide to stargazing conditions—built from reproducible climate and astronomy snapshots with transparent assumptions.",
    explore: "Open the finder",
    catalogEyebrow: "Destination index",
    catalogTitle: "Every reviewed destination.",
    catalogNote: "This first catalog is synthetic seed data for the engine preview. Every score is marked low confidence until real source snapshots are ingested and reviewed.",
    mixedCatalogNote: "Reviewed real scores are published where complete source snapshots exist. Remaining destinations stay visibly marked as seed previews.",
    realCatalogNote: "Every destination score is built from reviewed climate, darkness, elevation, and access snapshots.",
    realScore: "historical trip score",
    seedScore: "seed trip score",
    bestMonth: "best month",
    dataset: "Dataset",
    destinations: "destinations",
    climateNormal: "climate normal",
  },
  de: {
    htmlLang: "de",
    eyebrow: "Eine Entscheidungsmaschine für dunkle Himmel",
    titleLead: "Wissen, wann sich",
    titleAccent: "die Reise lohnt.",
    lede: "Ein datenbasierter Wegweiser für Sternbeobachtung—mit reproduzierbaren Klima- und Astronomie-Snapshots und transparenten Annahmen.",
    explore: "Finder öffnen",
    catalogEyebrow: "Zielübersicht",
    catalogTitle: "Alle geprüften Ziele.",
    catalogNote: "Dieser erste Katalog besteht aus synthetischen Seed-Daten für die Vorschau. Alle Werte bleiben mit niedriger Konfidenz markiert, bis echte Quellen-Snapshots geprüft sind.",
    mixedCatalogNote: "Geprüfte Realwerte werden veröffentlicht, sobald alle Quellen-Snapshots vollständig sind. Übrige Ziele bleiben sichtbar als Seed-Vorschau markiert.",
    realCatalogNote: "Alle Zielwerte basieren auf geprüften Klima-, Dunkelheits-, Höhen- und Zugangs-Snapshots.",
    realScore: "historischer Reisewert",
    seedScore: "Seed-Reisewert",
    bestMonth: "bester Monat",
    dataset: "Datensatz",
    destinations: "Ziele",
    climateNormal: "Klima-Normalperiode",
  },
} as const;
