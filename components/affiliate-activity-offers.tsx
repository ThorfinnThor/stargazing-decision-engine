import { affiliateRel } from "@/lib/affiliate/affiliate";
import { loadAffiliateActivityOffers, loadDestinations } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateActivityOffers({ destinationId, locationTourSlug, locale }: { destinationId: string; locationTourSlug?: string; locale: Locale }) {
  const isGerman = locale === "de";
  const destinationName = loadDestinations().find((destination) => destination.id === destinationId)?.name ?? destinationId;
  const offers = loadAffiliateActivityOffers().filter((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  const stargazingOffers = offers.filter((offer) => offer.kind === "stargazing");
  const regionalOffers = offers.filter((offer) => offer.kind === "regional");
  const hasDirectStargazing = stargazingOffers.length > 0;

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
    {!hasDirectStargazing ? <section className="affiliate-activity-offers affiliate-no-stargazing-offers" aria-labelledby={`affiliate-no-stargazing-title-${locationTourSlug ?? destinationId}`}>
      <header>
        <p className="eyebrow">{isGerman ? "Buchbare Angebote" : "Bookable options"}</p>
        <h2 id={`affiliate-no-stargazing-title-${locationTourSlug ?? destinationId}`}>{isGerman ? "Derzeit keine direkte Stargazing-Tour verfügbar" : "No direct stargazing tour currently available"}</h2>
        <p>{isGerman
          ? regionalOffers.length > 0
            ? `Für ${destinationName} konnten wir bei GetYourGuide derzeit keine direkt buchbare Stargazing-Tour verifizieren. Die folgenden Angebote sind andere Aktivitäten am Reiseziel oder in der nächstgelegenen Ausgangsregion und keine Astronomie-Touren.`
            : `Für ${destinationName} konnten wir derzeit weder eine direkt buchbare Stargazing-Tour noch ein ausreichend standortnahes GetYourGuide-Angebot verifizieren.`
          : regionalOffers.length > 0
            ? `We could not verify a directly bookable stargazing tour for ${destinationName} on GetYourGuide. The options below are other activities in the destination or its nearest gateway region, not astronomy tours.`
            : `We could not currently verify either a directly bookable stargazing tour or a sufficiently local GetYourGuide activity for ${destinationName}.`}</p>
      </header>
      {regionalOffers.length > 0 ? renderOffers(regionalOffers) : null}
    </section> : regionalOffers.length > 0 ? <section className="affiliate-activity-offers affiliate-regional-offers" aria-labelledby={`affiliate-regional-title-${locationTourSlug ?? destinationId}`}>
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
