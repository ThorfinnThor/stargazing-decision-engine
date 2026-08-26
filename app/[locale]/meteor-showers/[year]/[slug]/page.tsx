import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { loadMeteorShowerEvent, listMeteorShowerEvents, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { PageHomeNav } from "@/components/page-home-nav";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => listMeteorShowerEvents().map(({ year, slug }) => ({ locale, year: String(year), slug })));
}

function readParams(params: { locale: string; year: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  const year = Number(params.year);
  if (!Number.isInteger(year) || year < 1900) return null;
  try {
    const event = loadMeteorShowerEvent(year, params.slug);
    return { locale: params.locale as Locale, year, event, seo: loadSeoPage(`/${params.locale}/meteor-showers/${year}/${params.slug}/`) };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; year: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const title = resolved.event.name[resolved.locale];
  const seo = resolved.seo;
  return {
    title: seo?.title ?? `${title} ${resolved.year}`,
    description: seo?.description,
    robots: seo?.indexable ? undefined : { index: false, follow: true },
    alternates: seo ? { canonical: seo.canonical, languages: seo.alternatePaths } : undefined,
  };
}

export default async function MeteorShowerPage({ params }: { params: Promise<{ locale: string; year: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { event, locale, year, seo } = resolved;
  const name = event.name[locale];
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? `${name} ${year}`, description: seo?.description ?? `Static viewing guide for ${name} ${year}.`, url: seo?.canonical ?? `https://stargazing.local/${locale}/meteor-showers/${year}/${event.slug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header">
        <p className="eyebrow">{isGerman ? "Meteorstrom · statischer Leitfaden" : "Meteor shower · static viewing guide"}</p>
        <h1>{name} <span>{year}</span></h1>
        <p className="lede">
          {isGerman
            ? `Maximum am ${event.peakDate}. Der Bewertungswert kombiniert monatliche historische Himmelsqualität, Mondbedingungen und die Radiantenhöhe.`
            : `Peak date ${event.peakDate}. The viewing score combines monthly historical sky quality, Moon conditions, and radiant altitude.`}
        </p>
        <p className="event-note">{isGerman ? "Keine ZHR-Prognose und keine Wettervorhersage." : "This is not a ZHR forecast or a weather forecast."}</p>
      </header>

      <section className="event-summary" aria-labelledby="event-summary-title">
        <h2 id="event-summary-title">{isGerman ? "Zusammenfassung" : "Summary"}</h2>
        <dl className="event-metrics">
          <div><dt>{isGerman ? "Beobachtungswert" : "Viewing score"}</dt><dd>{event.viewingScore ?? "—"}</dd></div>
          <div><dt>{isGerman ? "Mondwert" : "Moon score"}</dt><dd>{event.moonScore ?? "—"}</dd></div>
          <div><dt>{isGerman ? "Radiantenwert" : "Radiant score"}</dt><dd>{event.radiantScore ?? "—"}</dd></div>
          <div><dt>{isGerman ? "Konfidenz" : "Confidence"}</dt><dd>{event.confidenceLevel}</dd></div>
        </dl>
        <p>{event.caveats.join(" ")}</p>
      </section>

      <section className="event-summary" aria-labelledby="event-top-title">
        <h2 id="event-top-title">{isGerman ? "Beste statische Ziele" : "Top static destinations"}</h2>
        <div className="event-table-wrap">
          <table className="event-table">
            <thead><tr><th>#</th><th>{isGerman ? "Ziel" : "Destination"}</th><th>{isGerman ? "Ort" : "Site"}</th><th>{isGerman ? "Wert" : "Score"}</th><th>{isGerman ? "Mondlos" : "Moonless"}</th></tr></thead>
            <tbody>{event.topDestinations.map((row) => <tr key={row.destinationId}><td>{row.rank}</td><td>{row.destinationName}</td><td>{row.siteName}</td><td>{row.viewingScore}</td><td>{row.moonConditions.moonlessHours.toFixed(2)} h</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <footer className="event-footer">
        <p>{isGerman ? "Quelle:" : "Source:"} <a href={event.sourceUrl} rel="noreferrer">{event.source}</a> · {isGerman ? "Geprüft" : "Verified"} {event.verifiedAt}</p>
        <AffiliateDisclosure locale={locale} />
      </footer>
    </main>
  );
}
