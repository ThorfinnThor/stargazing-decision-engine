import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FinderClient } from "@/components/finder-client";
import { loadSeoPage } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";

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
  return {
    title: resolved.seo?.title,
    description: resolved.seo?.description,
    robots: { index: false, follow: true },
    alternates: resolved.seo ? { canonical: resolved.seo.canonical, languages: resolved.seo.alternatePaths } : undefined,
  };
}

export default async function FinderPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readPage((await params).locale);
  if (!resolved) notFound();
  const { locale, seo } = resolved;
  const de = locale === "de";
  const description = seo?.description ?? (de ? "Stargazing-Finder für geprüfte Reiseziele." : "Stargazing finder for reviewed destinations.");
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing finder", description, url: seo?.canonical ?? `https://stargazing.local/${locale}/finder/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="finder-page" lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <nav className="finder-nav" aria-label={de ? "Finder-Navigation" : "Finder navigation"}><a href={localizedLinks.home(locale)}>← {de ? "Startseite" : "Home"}</a><div>{locales.map((item) => <a className={item === locale ? "active" : ""} href={localizedLinks.finder(item)} key={item}>{item.toUpperCase()}</a>)}</div></nav>
      <header className="finder-header"><p className="eyebrow">{de ? "Clientseitig · fünf Eingaben" : "Client-side · five inputs"}</p><h1>{de ? "Finde die Nacht, die zu dir passt." : "Find the night that fits your trip."}</h1><p className="lede">{description}</p></header>
      <section className="finder-body" aria-label={de ? "Finder und Ergebnisse" : "Finder and results"}><FinderClient locale={locale} /></section>
    </main>
  );
}
