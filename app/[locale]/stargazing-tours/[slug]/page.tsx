import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationTourContent } from "@/components/location-tour-content";
import { PageHomeNav } from "@/components/page-home-nav";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { listLocationTours, loadDestination, loadDestinationEditorialGuide, loadLocationTour, loadSeoPage } from "@/lib/data/load";
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
    return { locale, tour, destination, guide, seo: loadSeoPage(path) };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const value = await params;
  const resolved = read(value.locale, value.slug);
  if (!resolved) return {};
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: resolved.tour.title[resolved.locale], description: resolved.tour.seoDescription[resolved.locale] });
}

export default async function LocationTourPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const value = await params;
  const resolved = read(value.locale, value.slug);
  if (!resolved) notFound();
  const { locale, tour, destination, guide, seo } = resolved;
  const isGerman = locale === "de";
  const url = seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-tours/${tour.slug}/`;
  const structuredData = buildWebPageStructuredData({ name: tour.title[locale], description: tour.seoDescription[locale], url, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: tour.lastReviewedAt });
  const editorialStructuredData = buildLocationTourStructuredData({ destination, tour, locale, url, sources: guide.sources });
  return <main className="event-page location-tour-page" lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editorialStructuredData) }} />
    <PageHomeNav locale={locale} />
    <header className="event-header location-tour-header">
      <p className="eyebrow">{isGerman ? "Standort-Tour" : "Location tour"} · {destination.name}</p>
      <h1>{tour.title[locale]}</h1>
      <p className="lede">{tour.standfirst[locale]}</p>
      <p><Link href={`/${locale}/stargazing-destinations/${destination.slug}/`}>{isGerman ? `Zum Datenprofil für ${destination.name}` : `View the ${destination.name} data profile`} →</Link></p>
    </header>
    <LocationTourContent tour={tour} locale={locale} availableSources={guide.sources} />
    <nav className="location-tour-back"><Link href={`/${locale}/stargazing-tours/`}>{isGerman ? "Alle Standort-Touren" : "All location tours"} →</Link></nav>
  </main>;
}
