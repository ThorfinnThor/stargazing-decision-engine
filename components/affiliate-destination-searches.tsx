import { affiliateRel } from "@/lib/affiliate/affiliate";
import { loadAffiliateDestinationSearches } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateDestinationSearches({ destinationId, destinationName, locale }: { destinationId: string; destinationName: string; locale: Locale }) {
  const isGerman = locale === "de";
  const searches = loadAffiliateDestinationSearches().filter((search) => search.destinationId === destinationId);
  const stargazing = searches.filter((search) => search.variantId === "stargazing");
  const activities = searches.filter((search) => search.variantId === "activities");
  if (!stargazing.length && !activities.length) return null;

  return <details className="affiliate-destination-searches">
    <summary id={`affiliate-search-title-${destinationId}`}>
      <span><span className="eyebrow">{isGerman ? "Weitere buchbare Möglichkeiten" : "More bookable options"}</span><strong>{isGerman ? `Aktivitäten rund um ${destinationName}` : `Activities around ${destinationName}`}</strong></span>
      <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Suchen anzeigen" : "Show searches"}</span><span>{isGerman ? "Suchen schließen" : "Close searches"}</span></span>
    </summary>
    <div className="affiliate-destination-search-grid">
      {stargazing.length > 0 && <article className="affiliate-destination-search-featured">
        <p className="affiliate-activity-partner">{isGerman ? "Stargazing-Suche" : "Stargazing search"}</p>
        <h3>{isGerman ? `Geführte Sternbeobachtung bei ${destinationName}` : `Guided stargazing near ${destinationName}`}</h3>
        <p>{isGerman
          ? `Diese Suche ist auf Sternbeobachtung und astronomische Aktivitäten rund um ${destinationName} eingegrenzt. Sie kann auch passende Angebote aus der näheren Umgebung enthalten.`
          : `This search is narrowed to stargazing and astronomy activities around ${destinationName}. It may also include relevant experiences in the surrounding area.`}</p>
        <div className="affiliate-provider-links">{stargazing.map((search) => <a href={search.redirectPath} rel={affiliateRel()} key={search.partnerId}>{isGerman ? `Bei ${search.partnerName} suchen` : `Search on ${search.partnerName}`} →</a>)}</div>
      </article>}
      {activities.length > 0 && <article>
        <p className="affiliate-activity-partner">{isGerman ? "Allgemeine Suche" : "General search"}</p>
        <h3>{isGerman ? `Weitere Aktivitäten in ${destinationName}` : `More things to do in ${destinationName}`}</h3>
        <p>{isGerman
          ? `Die breitere Suche zeigt Naturtouren, Ausflüge, Transfers und weitere buchbare Erlebnisse in ${destinationName}. Sie ist nicht auf Astronomie beschränkt.`
          : `The broader search covers nature tours, day trips, transfers, and other bookable experiences in ${destinationName}. It is not limited to astronomy.`}</p>
        <div className="affiliate-provider-links">{activities.map((search) => <a href={search.redirectPath} rel={affiliateRel()} key={search.partnerId}>{isGerman ? `Bei ${search.partnerName} suchen` : `Search on ${search.partnerName}`} →</a>)}</div>
      </article>}
    </div>
  </details>;
}
