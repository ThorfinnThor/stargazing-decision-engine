import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { affiliateRel } from "@/lib/affiliate/affiliate";
import { loadAffiliateDestinationSearches } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateDestinationSearches({ destinationId, destinationName, locale }: { destinationId: string; destinationName: string; locale: Locale }) {
  const isGerman = locale === "de";
  const searches = loadAffiliateDestinationSearches().filter((search) => search.destinationId === destinationId);
  const stargazing = searches.find((search) => search.variantId === "stargazing");
  const activities = searches.find((search) => search.variantId === "activities");
  if (!stargazing && !activities) return null;

  return <section className="affiliate-destination-searches" aria-labelledby={`affiliate-search-title-${destinationId}`}>
    <header>
      <p className="eyebrow">{isGerman ? "Weitere buchbare Möglichkeiten" : "More bookable options"}</p>
      <h2 id={`affiliate-search-title-${destinationId}`}>{isGerman ? `Aktivitäten rund um ${destinationName}` : `Activities around ${destinationName}`}</h2>
      <p>{isGerman
        ? "Diese Links öffnen eine aktuelle Viator-Suche. Ergebnisse, Termine, Preise und Verfügbarkeit werden von Viator bereitgestellt und können sich ändern."
        : "These links open a current Viator search. Results, dates, prices, and availability are provided by Viator and can change."}</p>
    </header>
    <div className="affiliate-destination-search-grid">
      {stargazing && <article className="affiliate-destination-search-featured">
        <p className="affiliate-activity-partner">{isGerman ? "Stargazing-Suche" : "Stargazing search"} · {stargazing.partnerName}</p>
        <h3>{isGerman ? `Geführte Sternbeobachtung bei ${destinationName}` : `Guided stargazing near ${destinationName}`}</h3>
        <p>{isGerman
          ? `Diese Suche ist auf Sternbeobachtung und astronomische Aktivitäten rund um ${destinationName} eingegrenzt. Sie kann auch passende Angebote aus der näheren Umgebung enthalten.`
          : `This search is narrowed to stargazing and astronomy activities around ${destinationName}. It may also include relevant experiences in the surrounding area.`}</p>
        <a href={stargazing.redirectPath} rel={affiliateRel()}>{isGerman ? "Stargazing-Angebote bei Viator suchen" : "Search stargazing activities on Viator"} →</a>
      </article>}
      {activities && <article>
        <p className="affiliate-activity-partner">{isGerman ? "Allgemeine Suche" : "General search"} · {activities.partnerName}</p>
        <h3>{isGerman ? `Weitere Aktivitäten in ${destinationName}` : `More things to do in ${destinationName}`}</h3>
        <p>{isGerman
          ? `Die breitere Suche zeigt Naturtouren, Ausflüge, Transfers und weitere buchbare Erlebnisse in ${destinationName}. Sie ist nicht auf Astronomie beschränkt.`
          : `The broader search covers nature tours, day trips, transfers, and other bookable experiences in ${destinationName}. It is not limited to astronomy.`}</p>
        <a href={activities.redirectPath} rel={affiliateRel()}>{isGerman ? "Alle Aktivitäten bei Viator ansehen" : "Browse all activities on Viator"} →</a>
      </article>}
    </div>
    <AffiliateDisclosure locale={locale} />
  </section>;
}
