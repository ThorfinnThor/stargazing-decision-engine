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

  const stargazingOffers = offers.filter((offer) => offer.kind === "stargazing");
  const regionalOffers = offers.filter((offer) => offer.kind === "regional");

  const renderOffers = (items: typeof offers) => <div className="affiliate-activity-grid">
    {items.map((offer) => <article key={offer.id}>
      <p className="affiliate-activity-partner">{isGerman ? "Affiliate-Link" : "Affiliate link"} · {offer.partnerName}</p>
      <h3>{offer.title[locale]}</h3>
      <p>{offer.description[locale]}</p>
      <a href={offer.redirectPath} target="_blank" rel={affiliateRel()}>{isGerman ? `Details bei ${offer.partnerName} prüfen` : `Check details on ${offer.partnerName}`} →</a>
    </article>)}
  </div>;

  return <>
    {stargazingOffers.length > 0 ? <section className="affiliate-activity-offers" aria-labelledby={`affiliate-activity-title-${locationTourSlug ?? destinationId}`}>
      <header>
        <p className="eyebrow">{isGerman ? "Sternbeobachtung vor Ort" : "Stargazing at the destination"}</p>
        <h2 id={`affiliate-activity-title-${locationTourSlug ?? destinationId}`}>{isGerman ? "Passende geführte Angebote" : "Relevant guided options"}</h2>
        <p>{isGerman
          ? "Diese konkreten Angebote wurden einzeln auf Thema und Region geprüft. Aktuelle Termine, Leistungen und Stornierungsbedingungen stehen beim jeweiligen Anbieter."
          : "These specific options were checked individually for subject and location. Confirm current dates, inclusions, and cancellation terms with the provider."}</p>
      </header>
      {renderOffers(stargazingOffers)}
    </section> : null}
    {regionalOffers.length > 0 ? <section className="affiliate-activity-offers affiliate-regional-offers" aria-labelledby={`affiliate-regional-title-${locationTourSlug ?? destinationId}`}>
      <header>
        <p className="eyebrow">{isGerman ? "Weitere Aktivitäten" : "Other activities"}</p>
        <h2 id={`affiliate-regional-title-${locationTourSlug ?? destinationId}`}>{isGerman ? "Mehr in der Region erleben" : "More to do nearby"}</h2>
        <p>{isGerman
          ? "Diese zusätzlichen Angebote liegen in der passenden Region, sind aber keine Sternbeobachtung. Prüfe Treffpunkt und Route vor der Buchung direkt beim Anbieter."
          : "These additional options are in the relevant region but are not stargazing tours. Confirm the meeting point and route with the provider before booking."}</p>
      </header>
      {renderOffers(regionalOffers)}
    </section> : null}
  </>;
}
