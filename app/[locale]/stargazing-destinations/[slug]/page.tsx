import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadDestination, loadDestinationMonthly, loadDestinations, loadImageManifest, loadNightPreviews, loadSeoPage, loadSites } from "@/lib/data/load";
import { createSkyLocation, resolvePrimaryObservationSite } from "@/lib/astronomy/primary-site";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { DestinationSkySection } from "@/components/sky/destination-sky-section";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
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
    const allSites = loadSites();
    const sites = allSites.filter((site) => site.destinationId === destination.id);
    const primarySite = resolvePrimaryObservationSite(destination, allSites);
    const skyLocation = primarySite ? createSkyLocation(destination, primarySite) : null;
    const skyPreviews = skyLocation ? loadNightPreviews().previews.filter((preview) => preview.destinationId === destination.id && preview.siteId === skyLocation.siteId) : [];
    const image = loadImageManifest().destinations.find((asset) => asset.slug === destination.slug) ?? null;
    return { locale: params.locale as Locale, destination, sites, image, skyLocation, skyPreviews, monthly: loadDestinationMonthly(params.slug), seo: loadSeoPage(path) };
  } catch { return null; }
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
  const { destination, sites, image, skyLocation, skyPreviews, monthly, locale, seo } = resolved;
  const isGerman = locale === "de";
  const description = seo?.description ?? `Static dark-sky guide for ${destination.name}.`;
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? destination.name, description, url: seo?.canonical ?? `https://stargazing.local/${locale}/stargazing-destinations/${destination.slug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  const hasRealScores = monthly.dataStatus === "real";
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <nav className="destination-page-nav" aria-label={isGerman ? "Seitennavigation" : "Page navigation"}>
        <a className="destination-home-link" href={localizedLinks.home(locale)}>
          <span aria-hidden="true">←</span> {isGerman ? "Startseite" : "Home"}
        </a>
      </nav>
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
      {image?.status === "approved" && image.localPath && <figure className="destination-figure">
        <img src={image.localPath} alt={image.alt[locale]} loading="eager" decoding="async" />
        <figcaption>
          {image.attribution} · <a href={image.sourceUrl ?? undefined} rel="noreferrer">{isGerman ? "Quelle" : "Source"}</a> · <a href={image.licenseUrl ?? undefined} rel="noreferrer">{isGerman ? "Lizenz" : "License"}</a>
        </figcaption>
      </figure>}
      {skyLocation && <section className="destination-sky-section" id="night-sky" aria-label={isGerman ? "Astronomischer Himmel" : "Astronomical sky"}>
        <DestinationSkySection key={skyLocation.id} location={skyLocation} previews={skyPreviews} locale={locale} />
      </section>}
      <section className="event-summary" aria-labelledby="destination-access-title">
        <h2 id="destination-access-title">{isGerman ? "Zugang bei Nacht" : "Night access"}</h2>
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
      </section>
      <section className="event-summary" aria-labelledby="destination-months-title">
        <h2 id="destination-months-title">{isGerman ? "Monatliche Werte" : "Monthly scores"}</h2>
        <div className="event-table-wrap">
          <table className="event-table">
            <thead><tr><th>{isGerman ? "Monat" : "Month"}</th><th>{isGerman ? "Sternbeobachtung" : "Stargazing"}</th><th>{isGerman ? "Konfidenz" : "Confidence"}</th></tr></thead>
            <tbody>{monthly.months.map((month) => <tr key={month.month}><td>{formatMonth(month.month, locale)}</td><td>{month.score}</td><td>{month.confidenceLevel}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {monthly.caveats.length > 0 && <section className="event-summary" aria-labelledby="destination-caveats-title">
        <h2 id="destination-caveats-title">{isGerman ? "Datengrenzen" : "Data limitations"}</h2>
        <ul>{monthly.caveats.map((caveat) => <li key={caveat}>{formatCaveat(caveat, locale)}</li>)}</ul>
      </section>}
      <AffiliateDisclosure locale={locale} />
    </main>
  );
}
