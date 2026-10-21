import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationTourContent } from "@/components/location-tour-content";
import { AffiliateDestinationModules } from "@/components/affiliate-destination-modules";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { listGearGuides, listLocationTours, loadDestination, loadDestinationEditorialGuide, loadDestinations, loadGearGuide, loadImageManifest, loadLocationTour, loadSeoPage, loadSeoRegistry, loadSites } from "@/lib/data/load";
import { isGearGuideEditorialReady } from "@/lib/gear/gear";
import { localizedLinks } from "@/lib/i18n/links";
import { destinationAnchors, selectGearGuidesForDestination, selectRelatedDestinations } from "@/lib/seo/internal-links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildLocationTourStructuredData, buildWebPageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => listLocationTours().map((tour) => ({ locale, slug: tour.slug })));
}

function read(localeValue: string, slug: string) {
  if (!isLocale(localeValue)) return null;
  try {
    const locale = localeValue as Locale;
    const tour = loadLocationTour(slug);
    const destination = loadDestination(tour.destinationId);
    const guide = loadDestinationEditorialGuide(destination.slug);
    if (!guide) return null;
    const path = `/${locale}/stargazing-tours/${tour.slug}/`;
    const image = loadImageManifest().destinations.find((asset) => asset.slug === destination.slug) ?? null;
    const indexablePaths = new Set(loadSeoRegistry().pages.filter((page) => page.indexable).map((page) => page.path));
    const allDestinations = loadDestinations();
    const anchors = destinationAnchors(allDestinations, loadSites());
    const toursByDestination = new Map(listLocationTours()
      .filter((item) => item.slug !== tour.slug && indexablePaths.has(localizedLinks.locationTour(locale, item.slug)))
      .map((item) => [item.destinationId, item]));
    const nearbyTours = selectRelatedDestinations(destination, allDestinations.filter((item) => toursByDestination.has(item.id)), anchors, 6)
      .map((item) => ({ destination: item, tour: toursByDestination.get(item.id)! }));
    const readyGearGuides = listGearGuides().map(loadGearGuide).filter(isGearGuideEditorialReady);
    const gearGuides = selectGearGuidesForDestination(destination, readyGearGuides.map((item) => item.slug))
      .map((match) => readyGearGuides.find((item) => item.slug === match.slug)!);
    return { locale, tour, destination, guide, image, nearbyTours, gearGuides, seo: loadSeoPage(path) };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const value = await params;
  const resolved = read(value.locale, value.slug);
  if (!resolved) return {};
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: resolved.locale,
    title: resolved.tour.title[resolved.locale],
    description: resolved.tour.seoDescription[resolved.locale],
    image: resolved.image?.localPath,
    article: {
      modifiedTime: resolved.tour.lastReviewedAt,
      section: resolved.locale === "de" ? "Standort-Touren" : "Location tours",
      authors: [`https://stargazingindex.com/${resolved.locale}/about/#about-editorial-title`],
    },
  });
}

export default async function LocationTourPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const value = await params;
  const resolved = read(value.locale, value.slug);
  if (!resolved) notFound();
  const { locale, tour, destination, guide, image, nearbyTours, gearGuides, seo } = resolved;
  const isGerman = locale === "de";
  const url = seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-tours/${tour.slug}/`;
  const structuredData = buildWebPageStructuredData({ name: tour.title[locale], description: tour.seoDescription[locale], url, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: tour.lastReviewedAt });
  const editorialStructuredData = buildLocationTourStructuredData({ destination, tour, locale, url, sources: guide.sources, image: image?.localPath });
  return <main className="event-page location-tour-page" lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editorialStructuredData) }} />
    <header className="event-header location-tour-header">
      <p className="eyebrow">{isGerman ? "Standort-Tour" : "Location tour"} · {destination.name}</p>
      <h1>{tour.title[locale]}</h1>
      <p className="lede">{tour.standfirst[locale]}</p>
      <p><Link href={`/${locale}/stargazing-destinations/${destination.slug}/`}>{isGerman ? `Zum Datenprofil für ${destination.name}` : `View the ${destination.name} data profile`} →</Link></p>
    </header>
    <LocationTourContent tour={tour} locale={locale} availableSources={guide.sources} activityModules={<AffiliateDestinationModules destinationId={destination.id} locationTourSlug={tour.slug} locale={locale} />} />
    {nearbyTours.length > 0 && <nav className="destination-related location-tour-related" aria-labelledby="tour-nearby-title">
      <div>
        <p className="eyebrow">{isGerman ? "Weitere Nachtpläne" : "More night plans"}</p>
        <h2 id="tour-nearby-title">{isGerman ? "Nächte in der Nähe" : "Nearby nights"}</h2>
      </div>
      <div className="destination-related-grid">
        {nearbyTours.map(({ destination: nearby, tour: nearbyTour }) => <Link key={nearbyTour.id} href={localizedLinks.locationTour(locale, nearbyTour.slug)}>
          <span>{nearby.name} · {nearby.countryName}</span>
          <strong>{nearbyTour.title[locale]}</strong>
          <small>{isGerman ? "Nachtplan öffnen" : "Open night plan"} →</small>
        </Link>)}
      </div>
    </nav>}
    {gearGuides.length > 0 && <nav className="destination-related location-tour-related" aria-labelledby="tour-gear-title">
      <div>
        <p className="eyebrow">{isGerman ? "Packliste" : "Packing list"}</p>
        <h2 id="tour-gear-title">{isGerman ? "Ausrüstung für diese Nacht" : "Gear for this night"}</h2>
      </div>
      <div className="destination-related-grid">
        {gearGuides.map((gear) => <Link key={gear.slug} href={localizedLinks.gearGuide(locale, gear.slug)}>
          <span>{isGerman ? "Gear-Guide" : "Gear guide"}</span>
          <strong>{gear.title[locale]}</strong>
          <small>{isGerman ? "Zum Vergleich" : "View comparison"} →</small>
        </Link>)}
      </div>
    </nav>}
    <nav className="location-tour-back"><Link href={`/${locale}/stargazing-tours/`}>{isGerman ? "Alle Standort-Touren" : "All location tours"} →</Link></nav>
  </main>;
}
