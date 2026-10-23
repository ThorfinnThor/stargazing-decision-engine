import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadDestinationEditorialGuide, loadDestinations, loadSeoPage, loadSeoRegistry } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

const continentLabels: Record<Locale, Record<string, string>> = {
  en: { africa: "Africa", asia: "Asia", europe: "Europe", "north-america": "North America", oceania: "Oceania", "south-america": "South America" },
  de: { africa: "Afrika", asia: "Asien", europe: "Europa", "north-america": "Nordamerika", oceania: "Ozeanien", "south-america": "Südamerika" },
};

function read(localeValue: string) {
  if (!isLocale(localeValue)) return null;
  const locale = localeValue as Locale;
  const path = `/${locale}/stargazing-destinations/`;
  const indexablePaths = new Set(loadSeoRegistry().pages.filter((page) => page.indexable).map((page) => page.path));
  const countryNames = new Intl.DisplayNames([locale], { type: "region" });
  const entries = loadDestinations()
    .filter((destination) => indexablePaths.has(localizedLinks.destination(locale, destination.slug)))
    .map((destination) => ({
      destination,
      country: countryNames.of(destination.countryCode) ?? destination.countryName,
      description: loadDestinationEditorialGuide(destination.slug)?.seoDescription[locale] ?? null,
    }));
  const continents = [...new Set(entries.map((entry) => entry.destination.continent))]
    .sort((left, right) => continentLabels[locale][left]!.localeCompare(continentLabels[locale][right]!, locale))
    .map((continent) => {
      const inContinent = entries.filter((entry) => entry.destination.continent === continent);
      const countries = [...new Set(inContinent.map((entry) => entry.country))].sort((left, right) => left.localeCompare(right, locale))
        .map((country) => ({ country, entries: inContinent.filter((entry) => entry.country === country).sort((left, right) => left.destination.name.localeCompare(right.destination.name, locale)) }));
      return { continent, label: continentLabels[locale][continent] ?? continent, count: inContinent.length, countries };
    });
  return { locale, path, total: entries.length, continents, seo: loadSeoPage(path) };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = read((await params).locale);
  if (!resolved) return {};
  const isGerman = resolved.locale === "de";
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: resolved.locale,
    title: isGerman ? "Reiseziele für Sternbeobachtung nach Kontinent und Land" : "Stargazing destinations by continent and country",
    description: isGerman ? `${resolved.total} geprüfte Dark-Sky-Reiseziele mit Quellen, Zugang und bester Reisezeit.` : `${resolved.total} reviewed dark-sky destinations with sources, access notes and best months.`,
  });
}

export default async function StargazingDestinationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = read((await params).locale);
  if (!resolved) notFound();
  const { locale, path, total, continents, seo } = resolved;
  const isGerman = locale === "de";
  const title = seo?.title ?? (isGerman ? "Reiseziele für Sternbeobachtung" : "Stargazing destinations");
  const structuredData = buildWebPageStructuredData({ name: title, description: seo?.description ?? title, url: seo?.canonical ?? `https://stargazingindex.com${path}`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return <main className="event-page destinations-index" lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <header className="event-header">
      <p className="eyebrow">{isGerman ? "Alle Himmelsführer" : "All sky guides"}</p>
      <h1>{isGerman ? `${total} Reiseziele für dunkle Himmel` : `${total} destinations for dark skies`}</h1>
      <p className="lede">{isGerman
        ? "Jedes Ziel hat einen quellenbasierten Himmelsführer mit konkreten Beobachtungsorten, Zugangshinweisen und einem Monatsvergleich. Wenn du nach Monat, Temperatur oder Zugang filtern willst, nutze den Finder."
        : "Every destination has a source-backed sky guide with specific observing sites, access notes and a month-by-month comparison. To filter by month, temperature or access, use the finder."}{" "}
        <a href={localizedLinks.finder(locale)}>{isGerman ? "Zum Finder" : "Open the finder"}</a>
      </p>
      <nav className="destinations-index-jump" aria-label={isGerman ? "Kontinente" : "Continents"}>
        {continents.map((item) => <a key={item.continent} href={`#${item.continent}`}>{item.label} ({item.count})</a>)}
      </nav>
    </header>
    {continents.map((item) => <section key={item.continent} id={item.continent} className="destinations-index-continent" aria-labelledby={`${item.continent}-title`}>
      <h2 id={`${item.continent}-title`}>{item.label}</h2>
      {item.countries.map(({ country, entries }) => <div key={country} className="destinations-index-country">
        <h3>{country}</h3>
        <ul>
          {entries.map(({ destination, description }) => <li key={destination.id}>
            <a href={localizedLinks.destination(locale, destination.slug)}>{destination.name}</a>
            {description ? <p>{description}</p> : null}
          </li>)}
        </ul>
      </div>)}
    </section>)}
  </main>;
}
