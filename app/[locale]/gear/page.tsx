import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listGearGuides, loadGearCategories, loadGearGuide, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { isGearGuideEditorialReady } from "@/lib/gear/gear";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function readParams(params: { locale: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    const guides = listGearGuides().map(loadGearGuide).filter(isGearGuideEditorialReady);
    const publishedCategoryIds = new Set(guides.map((guide) => guide.category));
    return { locale: params.locale as Locale, categories: loadGearCategories().filter((category) => publishedCategoryIds.has(category.id)), guides, seo: loadSeoPage(`/${params.locale}/gear/`) };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: resolved.locale === "de" ? "Ausrüstung für Sternbeobachtung" : "Stargazing gear guides", description: resolved.locale === "de" ? "Technische Ausrüstungsguides für Sternbeobachtung." : "Technical gear guides for stargazing." });
}

export default async function GearIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, categories, guides, seo } = resolved;
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? "Stargazing gear guides", description: seo?.description ?? "Gear guides.", url: seo?.canonical ?? `https://stargazingindex.com/${locale}/gear/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return (
    <main className="event-page gear-index-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="event-header"><p className="eyebrow">{isGerman ? "Ausrüstung · Guides" : "Gear · guides"}</p><h1>{isGerman ? "Ausrüstung für klare Nächte." : "Gear for clear nights."}</h1><p className="lede">{isGerman ? "Finde passende Ausrüstung für deine Beobachtungen. Vergleiche die wichtigsten Unterschiede, prüfe die Kompatibilität und öffne das passende Produkt im Shop." : "Find equipment that fits your observing plans. Compare the differences that matter, check compatibility, and explore the products at the shop."}</p></header>
      <nav className="gear-category-nav" aria-label={isGerman ? "Ausrüstungskategorien" : "Gear categories"}>{categories.map((category) => <a href={`#category-${category.id}`} key={category.id}>{category.name[locale]} <span aria-hidden="true">↓</span></a>)}</nav>
      <section className="event-summary" aria-labelledby="gear-guides-title"><h2 id="gear-guides-title">{isGerman ? "Welcher Guide passt zu dir?" : "What are you looking for?"}</h2><div className="gear-guide-grid">{guides.map((guide) => <a id={`category-${guide.category}`} className="gear-guide-card" href={localizedLinks.gearGuide(locale, guide.slug)} key={guide.slug}><div className="card-topline"><span>{categories.find((category) => category.id === guide.category)?.name[locale]}</span><span aria-hidden="true">↗</span></div><h3>{guide.title[locale]}</h3><p>{categories.find((category) => category.id === guide.category)?.description[locale] ?? guide.summary[locale]}</p><span className="gear-card-action">{isGerman ? `${guide.items.length} Optionen vergleichen` : `Compare ${guide.items.length} options`} →</span></a>)}</div></section>
    </main>
  );
}
