import { listGearGuides, listShortTripOrigins, loadDestinations, loadDestinationMonthly, loadManifest, loadNightPreviews, loadSeoPage, loadSites } from "@/lib/data/load";
import { isTravelEligibleSite } from "@/lib/access/travel";
import { buildHomepageSkyCandidates } from "@/lib/astronomy/homepage-candidates";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { localeCopy, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { formatMonth } from "@/lib/i18n/months";
import { RandomHomepageSky } from "@/components/sky/random-homepage-sky";

export function HomePage({ locale }: { locale: Locale }) {
  const copy = localeCopy[locale];
  const manifest = loadManifest();
  const realScoreSites = manifest.counts.realScoreSites ?? 0;
  const catalogNote = realScoreSites === 0
    ? copy.catalogNote
    : realScoreSites >= manifest.counts.observationSites
      ? copy.realCatalogNote
      : copy.mixedCatalogNote;
  const shortTripOrigins = listShortTripOrigins();
  const gearGuides = listGearGuides();
  const seo = loadSeoPage(`/${locale}/`);
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing Decision Engine", description: seo?.description ?? copy.lede, url: seo?.canonical ?? `https://stargazing.local/${locale}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  const sites = loadSites();
  const destinationRecords = loadDestinations();
  const previews = loadNightPreviews().previews;
  const homepageSkyCandidates = buildHomepageSkyCandidates({ destinations: destinationRecords, sites, locale, previews });
  const destinations = destinationRecords.map((destination) => {
    const monthly = loadDestinationMonthly(destination.slug);
    const bestMonth = [...monthly.months].sort((a, b) => b.score - a.score)[0];
    const destinationSites = sites.filter((site) => site.destinationId === destination.id);
    const travelEligible = destinationSites.some(isTravelEligibleSite);
    const nightAccessStatus = travelEligible ? "eligible" : destinationSites.every((site) => site.publicAccess === "no") ? "closed" : "unverified";
    return { destination, bestMonth, dataStatus: monthly.dataStatus, nightAccessStatus };
  });

  return (
    <main lang={copy.htmlLang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="hero" aria-labelledby="hero-title">
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="Stargazing home">
            <span className="brand-mark" aria-hidden="true">✦</span>
            <span>STARGAZING</span>
          </a>
          <div className="locale-nav" aria-label="Language switcher">
            {(["en", "de"] as const).map((item) => (
              <a className={item === locale ? "active" : ""} href={localizedLinks.home(item)} key={item}>
                {item.toUpperCase()}
              </a>
            ))}
          </div>
        </nav>

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
          <p className="catalog-note">{catalogNote}</p>
        </div>
        <div className="catalog-grid">
          {destinations.map(({ destination, bestMonth, dataStatus, nightAccessStatus }) => (
            <a className="destination-card" href={localizedLinks.destination(locale, destination.slug)} key={destination.id}>
              <div className="card-topline">
                <span>{destination.countryCode}</span>
                <span>{destination.continent}</span>
              </div>
              <h3>{destination.name}</h3>
              <p>{destination.tags.slice(0, 2).join(" · ")}{nightAccessStatus === "closed"
                ? ` · ${locale === "de" ? "kein öffentlicher Nachtzugang" : "no public night access"}`
                : nightAccessStatus === "unverified" ? ` · ${locale === "de" ? "Nachtzugang nicht verifiziert" : "night access not verified"}` : ""}</p>
              <div className="card-score">
                <span className="score-value">{bestMonth?.score ?? "—"}</span>
                <span className="score-label">{dataStatus === "real" ? copy.realScore : copy.seedScore}<br />{copy.bestMonth} {bestMonth ? formatMonth(bestMonth.month, locale) : "—"}</span>
              </div>
            </a>
          ))}
        </div>
        <p className="catalog-footnote">
          {copy.dataset} {manifest.datasetVersion} · {manifest.counts.destinations} {copy.destinations} · {copy.climateNormal} {manifest.climateNormal.startYear}–{manifest.climateNormal.endYear}
        </p>
      </section>

      <section className="foundation" aria-labelledby="short-trips-title">
        <div className="section-heading">
          <p className="eyebrow dark">{locale === "de" ? "Kurzreisen" : "Short trips"}</p>
          <h2 id="short-trips-title">{locale === "de" ? "Ziele ab deiner Stadt." : "Destinations from your city."}</h2>
        </div>
        <div className="foundation-grid short-trip-links">
          {shortTripOrigins.map((origin) => <a className="destination-card" href={localizedLinks.shortTrips(locale, origin)} key={origin}>{origin}</a>)}
        </div>
      </section>

      <section className="foundation" aria-labelledby="gear-title">
        <div className="section-heading"><p className="eyebrow dark">{locale === "de" ? "Ausrüstungsguides" : "Gear guides"}</p><h2 id="gear-title">{locale === "de" ? "Werkzeuge für klare Nächte." : "Tools for clear nights."}</h2></div>
        <div className="foundation-grid short-trip-links"><a className="destination-card" href={localizedLinks.gear(locale)}>{locale === "de" ? "Alle Gear-Guides" : "All gear guides"}</a>{gearGuides.map((guide) => <a className="destination-card" href={localizedLinks.gearGuide(locale, guide)} key={guide}>{guide.replaceAll("-", " ")}</a>)}</div>
      </section>
    </main>
  );
}
