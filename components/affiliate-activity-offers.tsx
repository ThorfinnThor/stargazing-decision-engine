import { affiliateRel } from "@/lib/affiliate/affiliate";
import { loadAffiliateActivityOffers, loadDestinations } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateActivityOffers({ destinationId, locationTourSlug, locale, disclosureId }: { destinationId: string; locationTourSlug?: string; locale: Locale; disclosureId?: string }) {
  const isGerman = locale === "de";
  const destinationName = loadDestinations().find((destination) => destination.id === destinationId)?.name ?? destinationId;
  const offers = loadAffiliateActivityOffers().filter((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  const stargazingOffers = offers.filter((offer) => offer.kind === "stargazing");
  const regionalOffers = offers.filter((offer) => offer.kind === "regional");
  const hasDirectStargazing = stargazingOffers.length > 0;
  const sectionId = locationTourSlug ?? destinationId;

  const renderOffers = (items: typeof offers, kind: "stargazing" | "regional") => <div className={`affiliate-activity-grid affiliate-activity-grid-${kind}`}>
    {items.map((offer) => <article className={`affiliate-activity-card affiliate-activity-card-${kind}`} key={offer.id}>
      <p className="affiliate-activity-partner">{kind === "stargazing"
        ? isGerman ? "Geführte Sternbeobachtung" : "Guided stargazing"
        : isGerman ? "Aktivität in der Region" : "Regional activity"} · {offer.partnerName}</p>
      <h3>{offer.title[locale]}</h3>
      <p>{offer.description[locale]}</p>
      <a
        aria-label={`${kind === "stargazing"
          ? isGerman ? "Tour ansehen" : "View tour"
          : isGerman ? "Aktivität ansehen" : "View activity"}: ${offer.title[locale]} (${isGerman ? "öffnet neuen Tab" : "opens in a new tab"})`}
        href={offer.redirectPath}
        target="_blank"
        rel={affiliateRel()}
      >{kind === "stargazing"
          ? isGerman ? `Tour bei ${offer.partnerName} ansehen` : `View tour on ${offer.partnerName}`
          : isGerman ? `Aktivität bei ${offer.partnerName} ansehen` : `View activity on ${offer.partnerName}`} <span aria-hidden="true">↗</span></a>
    </article>)}
  </div>;

  return <>
    {stargazingOffers.length > 0 ? <section className="affiliate-activity-offers affiliate-stargazing-offers" aria-describedby={disclosureId} aria-labelledby={`affiliate-activity-title-${sectionId}`}>
      <header>
        <p className="eyebrow">{isGerman ? "Direkt buchbare Sternbeobachtung" : "Bookable stargazing"}</p>
        <h2 id={`affiliate-activity-title-${sectionId}`}>{isGerman ? "Geführte Stargazing-Angebote" : "Guided stargazing options"}</h2>
        <p>{isGerman
          ? "Diese konkreten Touren passen zum Reiseziel und zum Thema. Termine, Treffpunkt, Sprache und Stornierung prüfst du vor der Buchung beim Anbieter."
          : "These specific tours match the destination and subject. Confirm dates, meeting point, language, and cancellation terms before booking."}</p>
      </header>
      {renderOffers(stargazingOffers, "stargazing")}
    </section> : null}
    {!hasDirectStargazing ? <aside className="affiliate-offer-status" aria-labelledby={`affiliate-no-stargazing-title-${sectionId}`}>
      <div>
        <p className="eyebrow">{isGerman ? "Stargazing-Touren" : "Stargazing tours"}</p>
        <h2 id={`affiliate-no-stargazing-title-${sectionId}`}>{isGerman ? "Derzeit kein passendes Angebot" : "No suitable tour currently listed"}</h2>
      </div>
      <p>{isGerman
        ? regionalOffers.length > 0
          ? `Für ${destinationName} ist derzeit keine ausreichend passende Stargazing-Tour verifiziert. Die Aktivitäten darunter sind regionale Ergänzungen und keine Astronomie-Touren.`
          : `Für ${destinationName} ist derzeit weder eine ausreichend passende Stargazing-Tour noch eine verlässliche regionale Aktivität verifiziert.`
        : regionalOffers.length > 0
          ? `No sufficiently relevant stargazing tour is currently verified for ${destinationName}. The activities below are regional additions, not astronomy tours.`
          : `No sufficiently relevant stargazing tour or reliable regional activity is currently verified for ${destinationName}.`}</p>
    </aside> : null}
    {regionalOffers.length > 0 ? <section className="affiliate-activity-offers affiliate-regional-offers" aria-describedby={disclosureId} aria-labelledby={`affiliate-regional-title-${sectionId}`}>
      <header>
        <p className="eyebrow">{isGerman ? "Tagsüber und abseits der Sternbeobachtung" : "Beyond the stargazing plan"}</p>
        <h2 id={`affiliate-regional-title-${sectionId}`}>{isGerman ? `Weitere Aktivitäten rund um ${destinationName}` : `Other activities around ${destinationName}`}</h2>
        <p>{isGerman
          ? "Diese Angebote passen zur Region, aber nicht zur Sternbeobachtung. Prüfe Entfernung, Treffpunkt und Rückkehrzeit, bevor du sie mit deinem Nachtplan kombinierst."
          : "These options fit the region, not the stargazing session. Check distance, meeting point, and finish time before combining one with your night plan."}</p>
      </header>
      {renderOffers(regionalOffers, "regional")}
    </section> : null}
  </>;
}
