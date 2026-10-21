import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listBlogPosts, listDestinationEditorialGuides, listGearGuides, listLocationTours, loadDestination, loadDestinationEditorialGuide, loadDestinations, loadGearGuide, loadImageManifest, loadNightPreviews, loadSeoPage, loadSeoRegistry, loadSiteMonthly, loadSites } from "@/lib/data/load";
import { isGearGuideEditorialReady } from "@/lib/gear/gear";
import { destinationAnchors, selectGearGuidesForDestination, selectRelatedDestinations } from "@/lib/seo/internal-links";
import { createSkyLocation } from "@/lib/astronomy/primary-site";
import { buildDestinationEditorialStructuredData, buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { AffiliateDestinationModules } from "@/components/affiliate-destination-modules";
import { DestinationSiteExplorer, type DestinationSiteView } from "@/components/sky/destination-site-explorer";
import { DestinationEditorialGuideView } from "@/components/destination-editorial-guide";
import { DestinationDecisionSummary } from "@/components/destination-decision-summary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const destinations = loadDestinations();
  return locales.flatMap((locale) => destinations.map((destination) => ({ locale, slug: destination.slug })));
}

function formatCaveat(caveat: string, locale: Locale) {
  if (locale === "en") return caveat;
  if (caveat === "Temperature comfort uses the monthly astronomical-night mean, not hourly utility") {
    return "Der Temperaturkomfort verwendet den Monatsmittelwert astronomischer Nachtstunden, nicht eine stündliche Bewertung.";
  }
  if (caveat === "Curated elevation fallback used; DEM confidence is zero") {
    return "Kuratierte Höhenangabe als Fallback; der DEM-Anteil der Konfidenz ist null.";
  }
  if (caveat === "Not a weather forecast") return "Keine Wettervorhersage.";
  if (caveat === "Not production climate data") return "Keine produktiven Klimadaten.";
  if (caveat === "Stargazing score is forced to zero when ERA5 contains no astronomical-night hours") {
    return "Der Sternbeobachtungswert wird auf null gesetzt, wenn ERA5 keine astronomischen Nachtstunden enthält.";
  }
  const coverage = caveat.match(/^Reviewed Black Marble coverage override used \((\d+)% good-quality coverage\); confidence is reduced$/);
  if (coverage) {
    return `Geprüfte Black-Marble-Abdeckungsausnahme (${coverage[1]} % Abdeckung mit guter Qualität); die Konfidenz ist reduziert.`;
  }
  return caveat;
}

function readParams(params: { locale: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    const locale = params.locale as Locale;
    const destination = loadDestination(params.slug);
    const path = `/${params.locale}/stargazing-destinations/${params.slug}/`;
    const allSites = loadSites();
    const sitesById = new Map(allSites.map((site) => [site.id, site]));
    const sites = destination.observationSiteIds.flatMap((siteId) => {
      const site = sitesById.get(siteId);
      return site?.destinationId === destination.id ? [site] : [];
    });
    const nightPreviews = loadNightPreviews().previews;
    const siteViews = sites.flatMap((site): DestinationSiteView[] => {
      const location = createSkyLocation(destination, site);
      if (!location) return [];
      const siteMonthly = loadSiteMonthly(site.slug);
      const caveats = [...new Set(siteMonthly.scores.flatMap((score) => score.caveats))].map((caveat) => formatCaveat(caveat, locale));
      return [{
        site: { id: site.id, name: site.name, publicAccess: site.publicAccess },
        location,
        previews: nightPreviews.filter((preview) => preview.destinationId === destination.id && preview.siteId === site.id),
        monthly: {
          destinationId: destination.id,
          siteId: site.id,
          dataStatus: siteMonthly.dataStatus,
          algorithmVersion: siteMonthly.algorithmVersion,
          generatedAt: siteMonthly.generatedAt,
          caveats,
          months: siteMonthly.scores.map((score) => ({ month: score.month, score: score.stargazingTrip, confidenceLevel: score.confidenceLevel })),
        },
      }];
    });
    const image = loadImageManifest().destinations.find((asset) => asset.slug === destination.slug) ?? null;
    const editorialSlugs = new Set(listDestinationEditorialGuides());
    const indexablePaths = new Set(loadSeoRegistry().pages.filter((page) => page.indexable).map((page) => page.path));
    const allDestinations = loadDestinations();
    const anchors = destinationAnchors(allDestinations, allSites);
    const relatedCandidates = allDestinations.filter((item) => editorialSlugs.has(item.slug) && indexablePaths.has(localizedLinks.destination(locale, item.slug)));
    const relatedDestinations = selectRelatedDestinations(destination, relatedCandidates, anchors, 6);
    const toursByDestination = new Map(listLocationTours().filter((tour) => indexablePaths.has(localizedLinks.locationTour(locale, tour.slug))).map((tour) => [tour.destinationId, tour]));
    const nearbyTours = selectRelatedDestinations(destination, allDestinations.filter((item) => toursByDestination.has(item.id)), anchors, 3)
      .map((item) => ({ destination: item, tour: toursByDestination.get(item.id)! }));
    const readyGearGuides = listGearGuides().map(loadGearGuide).filter(isGearGuideEditorialReady);
    const gearGuides = selectGearGuidesForDestination(destination, readyGearGuides.map((item) => item.slug))
      .map((match) => readyGearGuides.find((item) => item.slug === match.slug)!);
    const blogPosts = locale === "en" ? listBlogPosts().filter((post) => post.relatedDestinationSlugs.includes(destination.slug)) : [];
    return { locale, destination, sites, siteViews, image, guide: loadDestinationEditorialGuide(destination.slug), locationTour: listLocationTours().find((tour) => tour.destinationId === destination.id) ?? null, relatedDestinations, nearbyTours, gearGuides, blogPosts, seo: loadSeoPage(path) };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const fallbackDescription = resolved.locale === "de" ? `Himmelsführer für ${resolved.destination.name}.` : `Dark-sky guide for ${resolved.destination.name}.`;
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: resolved.locale,
    title: resolved.guide?.seoTitle[resolved.locale] ?? resolved.destination.name,
    description: resolved.guide?.seoDescription[resolved.locale] ?? fallbackDescription,
    image: resolved.image?.localPath ?? null,
    article: resolved.guide ? {
      modifiedTime: resolved.guide.lastReviewedAt,
      section: resolved.locale === "de" ? "Reiseziele für Sternbeobachtung" : "Stargazing destinations",
      authors: [`https://stargazingindex.com/${resolved.locale}/about/#about-editorial-title`],
    } : undefined,
  });
}

export default async function DestinationPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { destination, sites, siteViews, image, guide, locationTour, relatedDestinations, nearbyTours, gearGuides, blogPosts, locale, seo } = resolved;
  const isGerman = locale === "de";
  const description = seo?.description ?? `Dark-sky guide for ${destination.name}.`;
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? destination.name, description, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-destinations/${destination.slug}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  const canonical = seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-destinations/${destination.slug}/`;
  const editorialStructuredData = guide ? buildDestinationEditorialStructuredData({ destination, guide, locale, url: canonical, image: image?.localPath, includeIndependentRoute: !locationTour }) : null;
  const hasRealScores = siteViews.length > 0 && siteViews.every((view) => view.monthly.dataStatus === "real");
  return (
    <main className="event-page destination-profile-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {editorialStructuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editorialStructuredData) }} />}
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Zielprofil" : "Destination profile"}</p>
        <h1>{destination.name}</h1>
        <p className="lede">{guide ? guide.seoDescription[locale] : hasRealScores
          ? isGerman ? "Historische Realwerte aus geprüften Klima- und Dunkelheits-Snapshots." : "Historical real scores from reviewed climate and darkness snapshots."
          : isGerman ? "Historische Seed-Werte und Monatskontext für die Beobachtungsplanung." : "Historical seed values and monthly context for planning an observing trip."}</p>
        <p className="event-note">{hasRealScores
          ? isGerman ? "1991–2020 Klima-Normalperiode; keine Live-Wettervorhersage." : "1991–2020 climate normal; not a live weather forecast."
          : isGerman ? "Seed-Daten mit niedriger Konfidenz; keine Live-Wettervorhersage." : "Seed data with low confidence; not a live weather forecast."}</p>
      </header>
      <nav className="destination-section-nav" aria-label={isGerman ? "Inhalt dieses Zielprofils" : "Destination profile contents"}>
        <a href="#destination-decision">{isGerman ? "Kurzantwort" : "Quick answer"}</a>
        <a href="#night-sky">{isGerman ? "Himmel und Monate" : "Sky and months"}</a>
        <a href="#destination-activities">{isGerman ? "Touren und Aktivitäten" : "Tours and activities"}</a>
        {guide && <a href="#destination-field-guide">{isGerman ? "Vor-Ort-Guide" : "Field guide"}</a>}
      </nav>
      <DestinationDecisionSummary sites={sites} siteViews={siteViews} guide={guide} locale={locale} hasRealScores={hasRealScores} />
      {image?.status === "approved" && image.localPath && <figure className="destination-figure">
        <img src={image.localPath} alt={image.alt[locale]} loading="eager" decoding="async" />
        <figcaption>
          {image.attribution} · <a href={image.sourceUrl ?? undefined} rel="noreferrer">{isGerman ? "Quelle" : "Source"}</a> · <a href={image.licenseUrl ?? undefined} rel="noreferrer">{isGerman ? "Lizenz" : "License"}</a>
        </figcaption>
      </figure>}
      <DestinationSiteExplorer options={siteViews} locale={locale} />
      <details className="event-summary destination-access-summary">
        <summary id="destination-access-title">
          <strong>{isGerman ? "Zugang bei Nacht" : "Night access"}</strong>
          <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Details anzeigen" : "Show details"}</span><span>{isGerman ? "Details schließen" : "Close details"}</span></span>
        </summary>
        <div className="destination-access-content">
        {sites.map((site) => (
          <div key={site.id}>
            <p><strong>{site.name}:</strong> {site.publicAccess === "yes"
              ? isGerman ? "öffentlich zugänglich" : "publicly accessible"
              : site.publicAccess === "limited"
                ? site.notesSourceUrl
                  ? isGerman ? "nur eingeschränkt oder nach Buchung zugänglich" : "limited or booking-only access"
                  : isGerman ? "eingeschränkt; Bedingungen noch nicht verifiziert" : "limited; conditions not yet verified"
                : site.publicAccess === "no"
                  ? isGerman ? "keine öffentliche Nachtbeobachtung an diesem Standort" : "no public night observing at this site"
                  : isGerman ? "Zugang nicht verifiziert" : "access not verified"}</p>
            {site.accessNotes && <p className="event-note">{site.accessNotes[locale]}</p>}
            {site.notesSourceUrl && <p><a href={site.notesSourceUrl} rel="noreferrer">{isGerman ? "Offizielle Zugangsinformation" : "Official access information"}</a></p>}
          </div>
        ))}
        {sites.every((site) => site.publicAccess === "no") && <p className="event-note">
          {isGerman ? "Dieses Profil beschreibt die astronomischen Bedingungen und ist keine Reiseempfehlung für den angegebenen Standort." : "This profile describes astronomical conditions and is not a travel recommendation for the listed site."}
        </p>}
        </div>
      </details>
      <div id="destination-activities" className="destination-activities">
      {locationTour && <aside className="destination-location-tour">
        <div>
          <p className="eyebrow">{isGerman ? "Konkreter Nachtplan" : "A specific night plan"}</p>
          <h2>{locationTour.title[locale]}</h2>
          <p>{locationTour.seoDescription[locale]}</p>
        </div>
        <Link href={`/${locale}/stargazing-tours/${locationTour.slug}/`}>{isGerman ? "Tour öffnen" : "Open the tour"} →</Link>
      </aside>}
      <AffiliateDestinationModules destinationId={destination.id} locale={locale} />
      </div>
      {guide && <DestinationEditorialGuideView guide={guide} locale={locale} showIndependentRoute={!locationTour} />}
      {guide && relatedDestinations.length > 0 && <nav className="destination-related" aria-labelledby="destination-related-title">
        <div>
          <p className="eyebrow">{isGerman ? "Weiterplanen" : "Continue planning"}</p>
          <h2 id="destination-related-title">{isGerman ? "Weitere Himmelsführer" : "More sky guides"}</h2>
        </div>
        <div className="destination-related-grid">
          {relatedDestinations.map((related, index) => <Link key={related.id} href={`/${locale}/stargazing-destinations/${related.slug}/`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{related.name}</strong>
            <small>{related.countryName}</small>
          </Link>)}
        </div>
      </nav>}
      {guide && nearbyTours.length > 0 && <nav className="destination-related destination-related-tours" aria-labelledby="destination-nearby-tours-title">
        <div>
          <p className="eyebrow">{isGerman ? "Nachtpläne in der Nähe" : "Night plans nearby"}</p>
          <h2 id="destination-nearby-tours-title">{isGerman ? "Konkrete Nächte in ähnlichen Regionen" : "Specific nights in nearby regions"}</h2>
        </div>
        <div className="destination-related-grid">
          {nearbyTours.map(({ destination: nearby, tour }) => <Link key={tour.id} href={localizedLinks.locationTour(locale, tour.slug)}>
            <span>{nearby.name}</span>
            <strong>{tour.title[locale]}</strong>
            <small>{isGerman ? "Nachtplan öffnen" : "Open night plan"} →</small>
          </Link>)}
        </div>
      </nav>}
      {gearGuides.length > 0 && <nav className="destination-related destination-related-gear" aria-labelledby="destination-gear-title">
        <div>
          <p className="eyebrow">{isGerman ? "Packliste" : "Packing list"}</p>
          <h2 id="destination-gear-title">{isGerman ? `Ausrüstung für ${destination.name}` : `Gear for ${destination.name}`}</h2>
        </div>
        <div className="destination-related-grid">
          {gearGuides.map((gear) => <Link key={gear.slug} href={localizedLinks.gearGuide(locale, gear.slug)}>
            <span>{isGerman ? "Gear-Guide" : "Gear guide"}</span>
            <strong>{gear.title[locale]}</strong>
            <small>{isGerman ? "Zum Vergleich" : "View comparison"} →</small>
          </Link>)}
        </div>
      </nav>}
      {locale === "en" && blogPosts.length > 0 && <nav className="destination-blog-related" aria-labelledby="destination-blog-related-title">
        <p className="eyebrow">From the data journal</p>
        <h2 id="destination-blog-related-title">What the numbers say about this destination</h2>
        <div>{blogPosts.slice(0, 3).map((post) => <Link href={localizedLinks.blogPost(post.slug)} key={post.slug}><strong>{post.title}</strong><small>{post.readingMinutes} min read →</small></Link>)}</div>
      </nav>}
    </main>
  );
}
