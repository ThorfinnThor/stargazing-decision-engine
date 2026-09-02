import { affiliateRel } from "@/lib/affiliate/affiliate";
import { loadAffiliateActivityOffers } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateActivityOffers({ destinationId, locationTourSlug, locale }: { destinationId: string; locationTourSlug?: string; locale: Locale }) {
  const isGerman = locale === "de";
  const offers = loadAffiliateActivityOffers().filter((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  if (offers.length === 0) return null;

  return <section className="affiliate-activity-offers" aria-labelledby={`affiliate-activity-title-${locationTourSlug ?? destinationId}`}>
    <header>
      <p className="eyebrow">{isGerman ? "Buchbare Erlebnisse" : "Bookable experiences"}</p>
      <h2 id={`affiliate-activity-title-${locationTourSlug ?? destinationId}`}>{isGerman ? "Passende geführte Angebote" : "Relevant guided options"}</h2>
      <p>{isGerman
        ? "Jedes Angebot wurde dieser Destination einzeln zugeordnet. Aktuelle Termine, Preise, Leistungen und Stornierungsbedingungen stehen beim jeweiligen Anbieter."
        : "Each option is mapped to this destination individually. Check current dates, prices, inclusions, and cancellation terms with the provider."}</p>
    </header>
    <div className="affiliate-activity-grid">
      {offers.map((offer) => <article key={offer.id}>
        <p className="affiliate-activity-partner">{isGerman ? "Affiliate-Link" : "Affiliate link"} · {offer.partnerName}</p>
        <h3>{offer.title[locale]}</h3>
        <p>{offer.description[locale]}</p>
        <a href={offer.redirectPath} rel={affiliateRel()}>{isGerman ? `Details bei ${offer.partnerName} prüfen` : `Check details on ${offer.partnerName}`} →</a>
      </article>)}
    </div>
  </section>;
}
