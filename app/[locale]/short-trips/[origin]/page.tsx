import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listShortTripOrigins, loadSeoPage, loadShortTrip } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
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
  return buildSeoMetadata({ seo, locale: resolved.locale, title, description: resolved.locale === "de" ? `Ranking dunkler Himmelsziele ab ${resolved.trip.originName}.` : `Ranking of dark-sky destinations from ${resolved.trip.originName}.` });
}

export default async function ShortTripsPage({ params }: { params: Promise<{ locale: string; origin: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { trip, locale, seo } = resolved;
  const isGerman = locale === "de";
  const tableLabels = {
    rank: "#",
    destination: isGerman ? "Ziel" : "Destination",
    distance: isGerman ? "Distanz" : "Distance",
    band: "Band",
    score: isGerman ? "Wert" : "Score",
    bestMonths: isGerman ? "Beste Monate" : "Best months",
  };
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? `Short stargazing trips from ${trip.originName}`, description: seo?.description ?? `Destination ranking from ${trip.originName}.`, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/short-trips/${trip.originSlug}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return (
    <main className="trip-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Kurze Sternreisen · Zielranking" : "Short stargazing trips · destination ranking"}</p>
        <h1>{isGerman ? `Ab ${trip.originName}` : `From ${trip.originName}`}</h1>
        <p className="lede">
          {isGerman
            ? `Ziele bis ${trip.maxShortTripKm} km, gewichtet nach historischem Realwert und Luftlinienentfernung.`
            : `Destinations within ${trip.maxShortTripKm} km, weighted by historical real scores and great-circle distance.`}
        </p>
        <p className="event-note">{isGerman ? "Entfernung ist keine Fahrzeit. Die veröffentlichten Werte sind keine Verfügbarkeits- oder Wetterprognose." : "Distance is not driving time. Published values are not availability or weather forecasts."}</p>
      </header>
      <section className="event-summary" aria-labelledby="trip-results-title">
        <h2 id="trip-results-title">{isGerman ? "Beste Ziele" : "Best destinations"}</h2>
        <div className="event-table-wrap">
          <table className="event-table short-trip-table">
            <thead><tr><th>{tableLabels.rank}</th><th>{tableLabels.destination}</th><th>{tableLabels.distance}</th><th>{tableLabels.band}</th><th>{tableLabels.score}</th><th>{tableLabels.bestMonths}</th></tr></thead>
            <tbody>{trip.entries.map((entry) => (
              <tr key={entry.destinationId}>
                <td data-label={tableLabels.rank}>{entry.rank}</td>
                <td data-label={tableLabels.destination}><strong>{entry.destinationName}</strong><br /><small>{entry.stayArea?.name ?? (isGerman ? "Kein Übernachtungsgebiet kuratiert" : "No curated stay area")}</small></td>
                <td data-label={tableLabels.distance}>{entry.distanceKm} km</td>
                <td data-label={tableLabels.band}>{entry.distanceBand}</td>
                <td data-label={tableLabels.score}>{entry.shortTripScore}</td>
                <td data-label={tableLabels.bestMonths}>{entry.bestMonths.map((month) => `${formatMonth(month.month, locale)} (${month.score})`).join(", ")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <AffiliateDisclosure locale={locale} />
    </main>
  );
}
