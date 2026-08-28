import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { PageHomeNav } from "@/components/page-home-nav";
import { listGearGuides, loadGearCategories, loadGearGuide, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function readParams(params: { locale: string }) {
  if (!isLocale(params.locale)) return null;
  try { return { locale: params.locale as Locale, categories: loadGearCategories(), guides: listGearGuides().map(loadGearGuide), seo: loadSeoPage(`/${params.locale}/gear/`) }; } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return { title: resolved.seo?.title, description: resolved.seo?.description, robots: resolved.seo?.indexable ? undefined : { index: false, follow: true }, alternates: resolved.seo ? { canonical: resolved.seo.canonical, languages: resolved.seo.alternatePaths } : undefined };
}

export default async function GearIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, categories, guides, seo } = resolved;
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing gear guides", description: seo?.description ?? "Gear guides.", url: seo?.canonical ?? `https://stargazing.local/${locale}/gear/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header"><p className="eyebrow">{isGerman ? "Ausrüstung · Guides" : "Gear · guides"}</p><h1>{isGerman ? "Ausrüstung für klare Nächte." : "Gear for clear nights."}</h1><p className="lede">{isGerman ? "Technische Vergleiche für Sternbeobachtung, getrennt von Rankings und ohne Preis- oder Verfügbarkeitsversprechen." : "Specification-based comparisons for stargazing, separate from rankings and without price or availability claims."}</p></header>
      <section className="event-summary" aria-labelledby="gear-methodology-title"><h2 id="gear-methodology-title">{isGerman ? "Transparente Bewertung" : "Transparent evaluation"}</h2><p>{isGerman ? "Wir vergleichen Einsatzgebiet, technische Passung und reale Trade-offs. Solange wir ein Produkt nicht selbst geprüft haben, kennzeichnen wir die Inhalte ausdrücklich als Spezifikationsanalyse." : "We compare intended use, technical fit, and real trade-offs. Unless we have tested a product ourselves, the content is explicitly identified as specification analysis."}</p><a className="text-link" href={localizedLinks.methodology(locale)}>{isGerman ? "So bewerten wir Ausrüstung →" : "How we evaluate gear →"}</a></section>
      <section className="catalog" aria-labelledby="gear-categories-title"><div className="catalog-intro"><h2 id="gear-categories-title">{isGerman ? "Kategorien" : "Categories"}</h2></div><div className="catalog-grid">{categories.map((category) => <article className="destination-card" key={category.id}><h3>{category.name[locale]}</h3><p>{category.description[locale]}</p></article>)}</div></section>
      <section className="event-summary" aria-labelledby="gear-guides-title"><h2 id="gear-guides-title">{isGerman ? "Guides" : "Guides"}</h2><div className="foundation-grid gear-guide-grid">{guides.map((guide) => <a className="destination-card gear-guide-card" href={localizedLinks.gearGuide(locale, guide.slug)} key={guide.slug}><div className="card-topline"><span>{guide.category.replaceAll("-", " ")}</span><span>→</span></div><h3>{guide.title[locale]}</h3><p>{guide.summary[locale]}</p><p>{guide.decisionSummary[locale]}</p></a>)}</div></section>
      <AffiliateDisclosure locale={locale} />
    </main>
  );
}
