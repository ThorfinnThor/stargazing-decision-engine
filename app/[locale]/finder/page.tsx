import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FinderClient } from "@/components/finder-client";
import { loadSeoPage } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function readPage(locale: string) {
  if (!isLocale(locale)) return null;
  return { locale: locale as Locale, seo: loadSeoPage(`/${locale}/finder/`) };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readPage((await params).locale);
  if (!resolved) return {};
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: resolved.locale === "de" ? "Stargazing-Finder" : "Stargazing finder", description: resolved.locale === "de" ? "Vergleiche geprüfte Sternbeobachtungsziele." : "Compare reviewed stargazing destinations." });
}

export default async function FinderPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readPage((await params).locale);
  if (!resolved) notFound();
  const { locale, seo } = resolved;
  const de = locale === "de";
  const description = seo?.description ?? (de ? "Stargazing-Finder für geprüfte Reiseziele." : "Stargazing finder for reviewed destinations.");
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing finder", description, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/finder/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return (
    <main className="finder-page" lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="finder-header"><p className="eyebrow">{de ? "Reiseplanung" : "Trip planning"}</p><h1>{de ? "Finde die Nacht, die zu dir passt." : "Find the night that fits your trip."}</h1><p className="lede">{description}</p></header>
      <section className="finder-body" aria-label={de ? "Finder und Ergebnisse" : "Finder and results"}><FinderClient locale={locale} /></section>
    </main>
  );
}
