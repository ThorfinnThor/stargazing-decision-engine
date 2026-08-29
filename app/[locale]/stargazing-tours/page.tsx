import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHomeNav } from "@/components/page-home-nav";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { listLocationTours, loadDestination, loadSeoPage } from "@/lib/data/load";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

function read(localeValue: string) {
  if (!isLocale(localeValue)) return null;
  const locale = localeValue as Locale;
  return { locale, tours: listLocationTours(), seo: loadSeoPage(`/${locale}/stargazing-tours/`) };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = read((await params).locale);
  if (!resolved) return {};
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: resolved.locale === "de" ? "Eigenständige Stargazing-Touren" : "Independent stargazing tours", description: resolved.locale === "de" ? "Quellenbasierte Nachtpläne für konkrete Beobachtungsorte." : "Source-backed night plans for specific observing locations." });
}

export default async function LocationToursPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = read((await params).locale);
  if (!resolved) notFound();
  const { locale, tours } = resolved;
  const isGerman = locale === "de";
  return <main className="event-page location-tours-index" lang={locale}>
    <PageHomeNav locale={locale} />
    <header className="event-header">
      <p className="eyebrow">{isGerman ? "Eigenständige Nachtpläne" : "Independent night plans"}</p>
      <h1>{isGerman ? "Zwanzig Orte, zwanzig unterschiedliche Nächte." : "Twenty places, twenty different nights."}</h1>
      <p className="lede">{isGerman ? "Jede Tour beantwortet die konkreten Fragen eines Standorts. Zugang, Anfahrt, Programm und Grenzen folgen den geprüften lokalen Quellen." : "Each tour answers the practical questions of one place. Access, approach, program and boundaries follow reviewed local sources."}</p>
    </header>
    <section className="location-tour-index-grid">
      {tours.map((tour, index) => {
        const destination = loadDestination(tour.destinationId);
        return <Link key={tour.id} href={`/${locale}/stargazing-tours/${tour.slug}/`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <small>{destination.name} · {destination.countryName}</small>
          <h2>{tour.title[locale]}</h2>
          <p>{tour.seoDescription[locale]}</p>
        </Link>;
      })}
    </section>
  </main>;
}
