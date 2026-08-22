import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadDestination, loadDestinationMonthly, loadDestinations, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { formatMonth } from "@/lib/i18n/months";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const destinations = loadDestinations();
  return locales.flatMap((locale) => destinations.map((destination) => ({ locale, slug: destination.slug })));
}

function readParams(params: { locale: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    const destination = loadDestination(params.slug);
    const path = `/${params.locale}/stargazing-destinations/${params.slug}/`;
    return { locale: params.locale as Locale, destination, monthly: loadDestinationMonthly(params.slug), seo: loadSeoPage(path) };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const seo = resolved.seo;
  return {
    title: seo?.title ?? resolved.destination.name,
    description: seo?.description,
    robots: seo?.indexable ? undefined : { index: false, follow: true },
    alternates: seo ? { canonical: seo.canonical, languages: seo.alternatePaths } : undefined,
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { destination, monthly, locale, seo } = resolved;
  const isGerman = locale === "de";
  const description = seo?.description ?? `Static dark-sky guide for ${destination.name}.`;
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? destination.name, description, url: seo?.canonical ?? `https://stargazing.local/${locale}/stargazing-destinations/${destination.slug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  const hasRealScores = monthly.dataStatus === "real";
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Statisches Zielprofil" : "Static destination profile"}</p>
        <h1>{destination.name}</h1>
        <p className="lede">{hasRealScores
          ? isGerman ? "Historische Realwerte aus geprüften Klima- und Dunkelheits-Snapshots." : "Historical real scores from reviewed climate and darkness snapshots."
          : isGerman ? "Historische Seed-Werte und Monatskontext für die Beobachtungsplanung." : "Historical seed values and monthly context for planning an observing trip."}</p>
        <p className="event-note">{hasRealScores
          ? isGerman ? "1991–2020 Klima-Normalperiode; keine Live-Wettervorhersage." : "1991–2020 climate normal; not a live weather forecast."
          : isGerman ? "Seed-Daten mit niedriger Konfidenz; keine Live-Wettervorhersage." : "Seed data with low confidence; not a live weather forecast."}</p>
      </header>
      <section className="event-summary" aria-labelledby="destination-months-title">
        <h2 id="destination-months-title">{isGerman ? "Monatliche Werte" : "Monthly scores"}</h2>
        <div className="event-table-wrap">
          <table className="event-table">
            <thead><tr><th>{isGerman ? "Monat" : "Month"}</th><th>{isGerman ? "Sternbeobachtung" : "Stargazing"}</th><th>{isGerman ? "Konfidenz" : "Confidence"}</th></tr></thead>
            <tbody>{monthly.months.map((month) => <tr key={month.month}><td>{formatMonth(month.month, locale)}</td><td>{month.score}</td><td>{month.confidenceLevel}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <AffiliateDisclosure locale={locale} />
    </main>
  );
}
