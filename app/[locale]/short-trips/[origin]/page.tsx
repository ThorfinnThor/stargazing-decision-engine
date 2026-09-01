import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listShortTripOrigins, loadSeoPage, loadShortTrip } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
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

const distanceBandLabels: Record<string, Record<Locale, string>> = {
  near: { en: "Under 100 km", de: "Unter 100 km" },
  regional: { en: "100–250 km", de: "100–250 km" },
  weekend: { en: "250–500 km", de: "250–500 km" },
  "long-weekend": { en: "500–800 km", de: "500–800 km" },
  far: { en: "Over 800 km", de: "Über 800 km" },
};

function formatDistanceBand(band: string, locale: Locale) {
  return distanceBandLabels[band]?.[locale] ?? band;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; origin: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const title = resolved.locale === "de" ? `Kurze Sternreisen ab ${resolved.trip.originName}` : `Short stargazing trips from ${resolved.trip.originName}`;
  const hasResults = resolved.trip.entries.length > 0;
  const seo = resolved.seo;
  return buildSeoMetadata({
    seo,
    locale: resolved.locale,
    title,
    description: hasResults
      ? resolved.locale === "de" ? `Ranking dunkler Himmelsziele ab ${resolved.trip.originName}.` : `Ranking of dark-sky destinations from ${resolved.trip.originName}.`
      : resolved.locale === "de" ? `Derzeit erfüllt kein geprüftes Ziel die Kriterien für eine kurze Sternreise ab ${resolved.trip.originName}.` : `No reviewed destination currently meets the criteria for a short stargazing trip from ${resolved.trip.originName}.`,
  });
}

export default async function ShortTripsPage({ params }: { params: Promise<{ locale: string; origin: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { trip, locale, seo } = resolved;
  const isGerman = locale === "de";
  const hasResults = trip.entries.length > 0;
  const tableLabels = {
    rank: "#",
    destination: isGerman ? "Ziel" : "Destination",
    distance: isGerman ? "Distanz" : "Distance",
    band: isGerman ? "Entfernungsbereich" : "Distance range",
    score: isGerman ? "Wert" : "Score",
    bestMonths: isGerman ? "Beste Monate" : "Best months",
  };
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? `Short stargazing trips from ${trip.originName}`, description: seo?.description ?? `Destination ranking from ${trip.originName}.`, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/short-trips/${trip.originSlug}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return (
    <main className="trip-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Kurze Sternreisen · Zielranking" : "Short stargazing trips · destination ranking"}</p>
        <h1>{isGerman ? `Ab ${trip.originName}` : `From ${trip.originName}`}</h1>
        <p className="lede">
          {isGerman
            ? `Geprüfte Ziele bis ${trip.maxShortTripKm} km, bewertet nach historischen Sternbeobachtungswerten und Luftlinienentfernung.`
            : `Reviewed destinations within ${trip.maxShortTripKm} km, ranked by historical stargazing scores and great-circle distance.`}
        </p>
        <p className="event-note">{isGerman ? "Entfernung ist keine Fahrzeit. Die veröffentlichten Werte sind keine Verfügbarkeits- oder Wetterprognose." : "Distance is not driving time. Published values are not availability or weather forecasts."}</p>
      </header>
      <section className="event-summary" aria-labelledby="trip-results-title">
        <h2 id="trip-results-title">
          {hasResults
            ? trip.entries.length === 1
              ? isGerman ? "Ein Ziel erfüllt die Kriterien" : "One destination meets the criteria"
              : isGerman ? "Beste Ziele" : "Best destinations"
            : isGerman ? "Noch kein passendes Ziel" : "No qualifying destination yet"}
        </h2>
        {hasResults ? <div className="event-table-wrap">
          <table className="event-table short-trip-table">
            <thead><tr><th>{tableLabels.rank}</th><th>{tableLabels.destination}</th><th>{tableLabels.distance}</th><th>{tableLabels.band}</th><th>{tableLabels.score}</th><th>{tableLabels.bestMonths}</th></tr></thead>
            <tbody>{trip.entries.map((entry) => (
              <tr key={entry.destinationId}>
                <td data-label={tableLabels.rank}>{entry.rank}</td>
                <td data-label={tableLabels.destination}>
                  <a className="short-trip-destination-link" href={localizedLinks.destination(locale, entry.destinationSlug)}><strong>{entry.destinationName}</strong></a>
                  <br /><small>{entry.stayArea?.name ?? (isGerman ? "Kein Übernachtungsgebiet kuratiert" : "No curated stay area")}</small>
                </td>
                <td data-label={tableLabels.distance}>{entry.distanceKm} km</td>
                <td data-label={tableLabels.band}>{formatDistanceBand(entry.distanceBand, locale)}</td>
                <td data-label={tableLabels.score}>{entry.shortTripScore}</td>
                <td data-label={tableLabels.bestMonths}>{entry.bestMonths.map((month) => `${formatMonth(month.month, locale)} (${month.score})`).join(", ")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div> : (
          <div className="short-trip-empty">
            <p>
              {isGerman
                ? `Im aktuellen Zielverzeichnis liegt derzeit kein öffentlich zugänglicher Ort mit ausreichenden Informationen innerhalb von ${trip.maxShortTripKm} km Luftlinie um ${trip.originName}. Wir erweitern den Radius nicht künstlich und empfehlen keine ungeprüften Orte.`
                : `The current destination index contains no publicly accessible place with sufficient information within ${trip.maxShortTripKm} km great-circle distance of ${trip.originName}. We do not inflate the radius or recommend unreviewed places to fill the list.`}
            </p>
            <p>
              {isGerman
                ? "Im Finder kannst du stattdessen alle geprüften Ziele vergleichen, ohne sie als kurze Reise auszugeben."
                : "Use the finder to compare every reviewed destination without treating a long journey as a short trip."}
            </p>
            <a href={localizedLinks.finder(locale)}>
              {isGerman ? "Alle geprüften Ziele öffnen" : "Explore all reviewed destinations"} <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
