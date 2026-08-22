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
    lede: "A static, data-driven guide to stargazing conditions—built from reproducible climate and astronomy snapshots, never live guesswork.",
    explore: "Explore the catalog",
    catalogEyebrow: "Static destination index",
    catalogTitle: "Ten places to start with.",
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
    lede: "Ein statischer, datenbasierter Wegweiser für Sternbeobachtung—mit reproduzierbaren Klima- und Astronomie-Snapshots statt Live-Schätzungen.",
    explore: "Katalog öffnen",
    catalogEyebrow: "Statischer Zielindex",
    catalogTitle: "Zehn Orte zum Start.",
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
