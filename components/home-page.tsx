import { listGearGuides, listLocationTours, listShortTripOrigins, loadDestination, loadDestinations, loadDestinationMonthly, loadGearGuide, loadManifest, loadNightPreviews, loadSeoPage, loadShortTrip, loadSites } from "@/lib/data/load";
import { isTravelEligibleSite } from "@/lib/access/travel";
import { buildHomepageSkyCandidates } from "@/lib/astronomy/homepage-candidates";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { localeCopy, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { formatMonth } from "@/lib/i18n/months";
import { DestinationCatalogFilter } from "@/components/destination-catalog-filter";
import { RandomHomepageSky } from "@/components/sky/random-homepage-sky";

export function HomePage({ locale }: { locale: Locale }) {
  const copy = localeCopy[locale];
  const manifest = loadManifest();
  const realScoreSites = manifest.counts.realScoreSites ?? 0;
  const catalogNote = realScoreSites === 0
    ? copy.catalogNote
    : realScoreSites >= manifest.counts.observationSites
      ? null
      : copy.mixedCatalogNote;
  const shortTripOrigins = listShortTripOrigins();
  const shortTrips = shortTripOrigins.map((origin) => {
    const trip = loadShortTrip(origin);
    return { origin, originName: trip.originName, destinationCount: trip.entries.length };
  }).filter((trip) => trip.destinationCount > 0);
  const gearGuides = listGearGuides().map(loadGearGuide);
  const locationTours = listLocationTours();
  const seo = loadSeoPage(`/${locale}/`);
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing Index", description: seo?.description ?? copy.lede, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  const sites = loadSites();
  const destinationRecords = loadDestinations();
  const previews = loadNightPreviews().previews;
  const homepageSkyCandidates = buildHomepageSkyCandidates({ destinations: destinationRecords, sites, locale, previews });
  const destinations = destinationRecords.map((destination) => {
    const monthly = loadDestinationMonthly(destination.slug);
    const bestMonth = [...monthly.months].sort((a, b) => b.score - a.score)[0];
    const destinationSites = sites.filter((site) => site.destinationId === destination.id);
    const travelEligible = destinationSites.some(isTravelEligibleSite);
    const nightAccessStatus: "eligible" | "closed" | "unverified" = travelEligible
      ? "eligible"
      : destinationSites.every((site) => site.publicAccess === "no") ? "closed" : "unverified";
    return { destination, bestMonth, dataStatus: monthly.dataStatus, nightAccessStatus };
  });
  const catalogDestinations = destinations.map(({ destination, bestMonth, dataStatus, nightAccessStatus }) => ({
    id: destination.id,
    href: localizedLinks.destination(locale, destination.slug),
    name: destination.name,
    countryCode: destination.countryCode,
    countryName: destination.countryName,
    continent: destination.continent,
    tags: destination.tags,
    nightAccessStatus,
    score: bestMonth?.score ?? null,
    scoreLabel: dataStatus === "real" ? copy.realScore : copy.seedScore,
    bestMonthLabel: bestMonth ? formatMonth(bestMonth.month, locale) : "—",
    bestMonth: bestMonth?.month ?? null,
  }));

  return (
    <main lang={copy.htmlLang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy" id="top">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="hero-title">
            {copy.titleLead}
            <span>{copy.titleAccent}</span>
          </h1>
          <p className="lede">{copy.lede}</p>
          <a className="hero-link" href={localizedLinks.finder(locale)}>
            {copy.explore} <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="orbit">
          <RandomHomepageSky candidates={homepageSkyCandidates} previews={previews} locale={locale} />
        </div>
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="catalog-intro">
          <div>
            <p className="eyebrow dark">{copy.catalogEyebrow}</p>
            <h2 id="catalog-title">{copy.catalogTitle}</h2>
          </div>
          {catalogNote ? <p className="catalog-note">{catalogNote}</p> : null}
        </div>
        <DestinationCatalogFilter destinations={catalogDestinations} locale={locale} bestMonthLabel={copy.bestMonth} />
      </section>

      <section className="foundation" aria-labelledby="short-trips-title">
        <div className="section-heading">
          <p className="eyebrow dark">{locale === "de" ? "Kurzreisen" : "Short trips"}</p>
          <h2 id="short-trips-title">{locale === "de" ? "Ziele ab deiner Stadt." : "Destinations from your city."}</h2>
        </div>
        <div className="foundation-grid short-trip-links">
          {shortTrips.map(({ origin, originName, destinationCount }) => <a className="destination-card short-trip-card" href={localizedLinks.shortTrips(locale, origin)} key={origin}>
            <div className="card-topline"><span>{destinationCount} {locale === "de" ? (destinationCount === 1 ? "Ziel" : "Ziele") : (destinationCount === 1 ? "destination" : "destinations")}</span><span>→</span></div>
            <h3>{originName}</h3>
            <p>{locale === "de" ? "Dunkle Orte für eine realistische Kurzreise." : "Dark-sky places for a practical short trip."}</p>
          </a>)}
        </div>
      </section>

      <section className="foundation" aria-labelledby="gear-title">
        <div className="section-heading"><p className="eyebrow dark">{locale === "de" ? "Ausrüstungsguides" : "Gear guides"}</p><h2 id="gear-title">{locale === "de" ? "Werkzeuge für klare Nächte." : "Tools for clear nights."}</h2></div>
        <div className="foundation-grid short-trip-links"><a className="destination-card gear-guide-card" href={localizedLinks.gear(locale)}><div className="card-topline"><span>{gearGuides.length} {locale === "de" ? "Guides" : "guides"}</span><span>→</span></div><h3>{locale === "de" ? "Alle Gear-Guides" : "All gear guides"}</h3><p>{locale === "de" ? "Technische Orientierung für klare Nächte." : "Specification-based guidance for clear nights."}</p></a>{gearGuides.map((guide) => <a className="destination-card gear-guide-card" href={localizedLinks.gearGuide(locale, guide.slug)} key={guide.slug}><div className="card-topline"><span>{guide.category.replaceAll("-", " ")}</span><span>→</span></div><h3>{guide.title[locale]}</h3><p>{guide.summary[locale]}</p></a>)}</div>
      </section>

      <section className="foundation" aria-labelledby="location-tours-title">
        <div className="section-heading">
          <p className="eyebrow dark">{locale === "de" ? "Standort-Touren" : "Location tours"}</p>
          <h2 id="location-tours-title">{locale === "de" ? "Eine konkrete Nacht statt allgemeiner Reisetipps." : "One specific night, not generic travel advice."}</h2>
        </div>
        <a className="location-tour-index-cta" href={localizedLinks.locationTours(locale)}>
          <span><strong>{locationTours.length}</strong> {locale === "de" ? "individuelle Nachtpläne" : "individual night plans"}</span>
          <span>{locale === "de" ? "Alle Standort-Touren durchsuchen" : "Search all location tours"} →</span>
        </a>
        <p className="featured-tour-label">{locale === "de" ? "Ausgewählte Nachtpläne" : "Featured night plans"}</p>
        <div className="foundation-grid short-trip-links featured-tour-grid">
          {locationTours.slice(0, 3).map((tour) => <a className="destination-card" href={localizedLinks.locationTour(locale, tour.slug)} key={tour.id}>
            <div className="card-topline"><span>{loadDestination(tour.destinationId).name}</span><span>→</span></div>
            <h3>{tour.title[locale]}</h3>
            <p>{tour.seoDescription[locale]}</p>
          </a>)}
        </div>
      </section>
    </main>
  );
}
