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
    explore: "Explore the seed catalog",
    catalogEyebrow: "Static destination index",
    catalogTitle: "Ten places to start with.",
    catalogNote: "This first catalog is synthetic seed data for the engine preview. Every score is marked low confidence until real source snapshots are ingested and reviewed.",
    seedScore: "seed trip score",
    bestMonth: "best month",
    dataset: "Dataset",
    destinations: "destinations",
    climateNormal: "climate normal",
    architectureEyebrow: "Architecture baseline",
    architectureTitle: "Process offline. Publish static.",
  },
  de: {
    htmlLang: "de",
    eyebrow: "Eine Entscheidungsmaschine für dunkle Himmel",
    titleLead: "Wissen, wann sich",
    titleAccent: "die Reise lohnt.",
    lede: "Ein statischer, datenbasierter Wegweiser für Sternbeobachtung—mit reproduzierbaren Klima- und Astronomie-Snapshots statt Live-Schätzungen.",
    explore: "Seed-Katalog öffnen",
    catalogEyebrow: "Statischer Zielindex",
    catalogTitle: "Zehn Orte zum Start.",
    catalogNote: "Dieser erste Katalog besteht aus synthetischen Seed-Daten für die Vorschau. Alle Werte bleiben mit niedriger Konfidenz markiert, bis echte Quellen-Snapshots geprüft sind.",
    seedScore: "Seed-Reisewert",
    bestMonth: "bester Monat",
    dataset: "Datensatz",
    destinations: "Ziele",
    climateNormal: "Klima-Normalperiode",
    architectureEyebrow: "Architektur-Basis",
    architectureTitle: "Offline verarbeiten. Statisch publizieren.",
  },
} as const;
