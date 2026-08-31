import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listDestinationEditorialGuides, listLocationTours, loadDestination, loadDestinationEditorialGuide, loadDestinations, loadImageManifest, loadNightPreviews, loadSeoPage, loadSiteMonthly, loadSites } from "@/lib/data/load";
import { createSkyLocation } from "@/lib/astronomy/primary-site";
import { buildDestinationEditorialStructuredData, buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { AffiliateDestinationModules } from "@/components/affiliate-destination-modules";
import { DestinationSiteExplorer, type DestinationSiteView } from "@/components/sky/destination-site-explorer";
import { PageHomeNav } from "@/components/page-home-nav";
import { DestinationEditorialGuideView } from "@/components/destination-editorial-guide";
import { DestinationDecisionSummary } from "@/components/destination-decision-summary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

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
    const relatedDestinations = loadDestinations()
      .filter((item) => item.slug !== destination.slug && editorialSlugs.has(item.slug))
      .sort((left, right) => Number(right.continent === destination.continent) - Number(left.continent === destination.continent) || left.priority - right.priority)
      .slice(0, 3);
    return { locale, destination, sites, siteViews, image, guide: loadDestinationEditorialGuide(destination.slug), locationTour: listLocationTours().find((tour) => tour.destinationId === destination.id) ?? null, relatedDestinations, seo: loadSeoPage(path) };
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
  const { destination, sites, siteViews, image, guide, locationTour, relatedDestinations, locale, seo } = resolved;
  const isGerman = locale === "de";
  const description = seo?.description ?? `Dark-sky guide for ${destination.name}.`;
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? destination.name, description, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-destinations/${destination.slug}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  const canonical = seo?.canonical ?? `https://stargazingindex.com/${locale}/stargazing-destinations/${destination.slug}/`;
  const editorialStructuredData = guide ? buildDestinationEditorialStructuredData({ destination, guide, locale, url: canonical, image: image?.localPath }) : null;
  const hasRealScores = siteViews.length > 0 && siteViews.every((view) => view.monthly.dataStatus === "real");
  return (
    <main className="event-page destination-profile-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {editorialStructuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editorialStructuredData) }} />}
      <PageHomeNav locale={locale} />
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
      <DestinationDecisionSummary sites={sites} siteViews={siteViews} guide={guide} locale={locale} hasRealScores={hasRealScores} />
      {image?.status === "approved" && image.localPath && <figure className="destination-figure">
        <img src={image.localPath} alt={image.alt[locale]} loading="eager" decoding="async" />
        <figcaption>
          {image.attribution} · <a href={image.sourceUrl ?? undefined} rel="noreferrer">{isGerman ? "Quelle" : "Source"}</a> · <a href={image.licenseUrl ?? undefined} rel="noreferrer">{isGerman ? "Lizenz" : "License"}</a>
        </figcaption>
      </figure>}
      <DestinationSiteExplorer options={siteViews} locale={locale} />
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
      {guide && <DestinationEditorialGuideView guide={guide} locale={locale} />}
      {locationTour && <aside className="destination-location-tour">
        <div>
          <p className="eyebrow">{isGerman ? "Konkreter Nachtplan" : "A specific night plan"}</p>
          <h2>{locationTour.title[locale]}</h2>
          <p>{locationTour.seoDescription[locale]}</p>
        </div>
        <Link href={`/${locale}/stargazing-tours/${locationTour.slug}/`}>{isGerman ? "Tour öffnen" : "Open the tour"} →</Link>
      </aside>}
      <AffiliateDestinationModules destinationId={destination.id} destinationName={destination.name} destinationQuery={destination.affiliateQuery} locale={locale} />
      {guide && relatedDestinations.length > 0 && <nav className="destination-related" aria-labelledby="destination-related-title">
        <div>
          <p className="eyebrow">{isGerman ? "Weiterplanen" : "Continue planning"}</p>
          <h2 id="destination-related-title">{isGerman ? "Weitere redaktionelle Himmelsführer" : "More editorial sky guides"}</h2>
        </div>
        <div className="destination-related-grid">
          {relatedDestinations.map((related, index) => <Link key={related.id} href={`/${locale}/stargazing-destinations/${related.slug}/`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{related.name}</strong>
            <small>{related.countryName}</small>
          </Link>)}
        </div>
      </nav>}
    </main>
  );
}
