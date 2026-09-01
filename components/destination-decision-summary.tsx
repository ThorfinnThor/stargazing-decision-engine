import type { DestinationEditorialGuide, ObservationSite, PublicAccess } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import { formatMonth } from "@/lib/i18n/months";
import { localizedLinks } from "@/lib/i18n/links";
import type { DestinationSiteView } from "@/components/sky/destination-site-explorer";
import { recommendedSiteView } from "@/lib/destination/site-recommendation";

const confidenceRank = { high: 0, moderate: 1, low: 2 } as const;

function accessLabel(access: PublicAccess, locale: Locale) {
  const labels = locale === "de"
    ? { yes: "Öffentlicher Nachtzugang", limited: "Eingeschränkt oder nur mit Buchung", no: "Kein öffentlicher Nachtzugang", unknown: "Zugang noch nicht verifiziert" }
    : { yes: "Public nighttime access", limited: "Limited or booking-only access", no: "No public nighttime access", unknown: "Access not yet verified" };
  return labels[access];
}

function confidenceLabel(confidence: "high" | "moderate" | "low", locale: Locale) {
  if (locale === "de") return confidence === "high" ? "hohe Konfidenz" : confidence === "moderate" ? "mittlere Konfidenz" : "niedrige Konfidenz";
  return `${confidence} confidence`;
}

function siteTypeLabel(value: string, locale: Locale) {
  const readable = value.replaceAll("-", " ");
  if (locale === "en") return readable;
  const translations: Record<string, string> = {
    mountain: "Bergstandort",
    "volcanic viewpoint": "vulkanischer Aussichtspunkt",
    viewpoint: "Aussichtspunkt",
    observatory: "Observatorium",
    "dark sky park": "Sternenpark",
    desert: "Wüstenstandort",
    "observation site": "Beobachtungsort",
  };
  return translations[readable] ?? readable;
}

export function DestinationDecisionSummary({
  sites,
  siteViews,
  guide,
  locale,
  hasRealScores,
}: {
  sites: ObservationSite[];
  siteViews: DestinationSiteView[];
  guide: DestinationEditorialGuide | null;
  locale: Locale;
  hasRealScores: boolean;
}) {
  const isGerman = locale === "de";
  const recommended = recommendedSiteView(siteViews);
  if (!recommended) return null;
  const recommendedSite = sites.find((site) => site.id === recommended.site.id) ?? null;
  const bestMonth = [...recommended.monthly.months].sort((left, right) =>
    right.score - left.score || confidenceRank[left.confidenceLevel] - confidenceRank[right.confidenceLevel] || left.month - right.month,
  )[0];
  if (!bestMonth) return null;
  const unavailableSites = sites.filter((site) => site.id !== recommended.site.id && site.publicAccess === "no");
  const arrivalHint = guide?.tour.steps[1]?.timeHint[locale] ?? null;
  const planningTopics = guide?.fieldNotes.slice(0, 3).map((note) => note.title[locale]) ?? [];

  return <section className="destination-decision" id="destination-decision" aria-labelledby="destination-decision-title">
    <div className="destination-decision-heading">
      <div>
        <p className="eyebrow">{isGerman ? "Die Entscheidung" : "The decision"}</p>
        <h2 id="destination-decision-title">{isGerman ? "Das Wichtigste in 30 Sekunden." : "What matters in 30 seconds."}</h2>
      </div>
      <p>{hasRealScores
        ? isGerman ? "Die Monatsbewertung nutzt die Klimanormalperiode 1991–2020. Sie beschreibt die Reisechance, nicht das Wetter heute Abend." : "The monthly score uses the 1991–2020 climate normal. It describes trip potential, not tonight’s weather."
        : isGerman ? "Die Monatsbewertung basiert noch auf Seed-Daten mit niedriger Konfidenz und ist keine Wettervorhersage." : "The monthly score still uses low-confidence seed data and is not a weather forecast."}</p>
    </div>

    <div className="destination-decision-grid">
      <div className="destination-score-card">
        <span>{isGerman ? "Bestes Klimafenster" : "Best climatological window"}</span>
        <strong>{bestMonth.score}<small>/100</small></strong>
        <p>{formatMonth(bestMonth.month, locale)} · {confidenceLabel(bestMonth.confidenceLevel, locale)}</p>
      </div>

      <div className="destination-site-card">
        <span>{isGerman ? "Empfohlener Beobachtungsort" : "Recommended observation site"}</span>
        <h3>{recommended.site.name}</h3>
        <ul className="destination-fact-list">
          <li className={recommended.site.publicAccess === "yes" ? "is-positive" : undefined}>{accessLabel(recommended.site.publicAccess, locale)}</li>
          {recommended.location.elevationM !== null && <li>{isGerman ? "Höhe" : "Elevation"}: {Math.round(recommended.location.elevationM).toLocaleString(locale === "de" ? "de-DE" : "en-US")} m</li>}
          <li>{siteTypeLabel(recommendedSite?.siteType ?? "observation site", locale)}</li>
        </ul>
        {recommendedSite?.accessNotes && <p>{recommendedSite.accessNotes[locale]}</p>}
        {recommendedSite?.notesSourceUrl && <a href={recommendedSite.notesSourceUrl} rel="noreferrer">{isGerman ? "Offizielle Zugangsinformation ↗" : "Official access information ↗"}</a>}
      </div>

      <div className="destination-plan-card">
        <span>{isGerman ? "Plan für die Nacht" : "Plan the night"}</span>
        {arrivalHint && <p><strong>{isGerman ? "Ankommen:" : "Arrive:"}</strong> {arrivalHint}</p>}
        {planningTopics.length > 0 && <p><strong>{isGerman ? "Einplanen:" : "Plan for:"}</strong> {planningTopics.join(" · ")}</p>}
        {unavailableSites.map((site) => <p className="destination-access-warning" key={site.id}><strong>{site.name}:</strong> {accessLabel(site.publicAccess, locale)}</p>)}
      </div>
    </div>

    <nav className="destination-decision-actions" aria-label={isGerman ? "Planungslinks" : "Planning links"}>
      <a href="#destination-months">{isGerman ? "Monate vergleichen" : "Compare months"}</a>
      <a href="#destination-site-selector-title">{isGerman ? "Standorte vergleichen" : "Compare sites"}</a>
      <a href={localizedLinks.methodology(locale)}>{isGerman ? "Wie entsteht der Wert?" : "How is the score built?"}</a>
    </nav>
  </section>;
}
