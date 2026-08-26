import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listShortTripOrigins, loadSeoPage, loadShortTrip } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { PageHomeNav } from "@/components/page-home-nav";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { formatMonth } from "@/lib/i18n/months";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => listShortTripOrigins().map((origin) => ({ locale, origin })));
}

function readParams(params: { locale: string; origin: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    return { locale: params.locale as Locale, trip: loadShortTrip(params.origin), seo: loadSeoPage(`/${params.locale}/short-trips/${params.origin}/`) };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; origin: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const title = resolved.locale === "de" ? `Kurze Sternreisen ab ${resolved.trip.originName}` : `Short stargazing trips from ${resolved.trip.originName}`;
  const seo = resolved.seo;
  return {
    title: seo?.title ?? title,
    description: seo?.description,
    robots: seo?.indexable ? undefined : { index: false, follow: true },
    alternates: seo ? { canonical: seo.canonical, languages: seo.alternatePaths } : undefined,
  };
}

export default async function ShortTripsPage({ params }: { params: Promise<{ locale: string; origin: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { trip, locale, seo } = resolved;
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? `Short stargazing trips from ${trip.originName}`, description: seo?.description ?? `Static ranking from ${trip.originName}.`, url: seo?.canonical ?? `https://stargazing.local/${locale}/short-trips/${trip.originSlug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="trip-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Kurze Sternreisen · statisches Ranking" : "Short stargazing trips · static ranking"}</p>
        <h1>{isGerman ? `Ab ${trip.originName}` : `From ${trip.originName}`}</h1>
        <p className="lede">
          {isGerman
            ? `Ziele bis ${trip.maxShortTripKm} km, gewichtet nach historischem Realwert und Luftlinienentfernung.`
            : `Destinations within ${trip.maxShortTripKm} km, weighted by historical real scores and great-circle distance.`}
        </p>
        <p className="event-note">{isGerman ? "Entfernung ist keine Fahrzeit. Alle Werte sind statisch und keine Verfügbarkeits- oder Wetterprognose." : "Distance is not driving time. Values are static and are not availability or weather forecasts."}</p>
      </header>
      <section className="event-summary" aria-labelledby="trip-results-title">
        <h2 id="trip-results-title">{isGerman ? "Beste Ziele" : "Best destinations"}</h2>
        <div className="event-table-wrap">
          <table className="event-table">
            <thead><tr><th>#</th><th>{isGerman ? "Ziel" : "Destination"}</th><th>{isGerman ? "Distanz" : "Distance"}</th><th>{isGerman ? "Band" : "Band"}</th><th>{isGerman ? "Wert" : "Score"}</th><th>{isGerman ? "Beste Monate" : "Best months"}</th></tr></thead>
            <tbody>{trip.entries.map((entry) => (
              <tr key={entry.destinationId}>
                <td>{entry.rank}</td>
                <td><strong>{entry.destinationName}</strong><br /><small>{entry.stayArea?.name ?? (isGerman ? "Kein Übernachtungsgebiet kuratiert" : "No curated stay area")}</small></td>
                <td>{entry.distanceKm} km</td>
                <td>{entry.distanceBand}</td>
                <td>{entry.shortTripScore}</td>
                <td>{entry.bestMonths.map((month) => `${formatMonth(month.month, locale)} (${month.score})`).join(", ")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="event-note">{isGerman ? "Die Camping-Angabe bleibt unbekannt, solange keine kuratierte Quelle vorliegt." : "Camping remains unknown until curated source metadata is available."}</p>
      </section>
      <AffiliateDisclosure locale={locale} />
    </main>
  );
}
