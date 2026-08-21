import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { listGearGuides, loadGearGuide, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return locales.flatMap((locale) => listGearGuides().map((slug) => ({ locale, slug }))); }

function readParams(params: { locale: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  try { return { locale: params.locale as Locale, guide: loadGearGuide(params.slug), seo: loadSeoPage(`/${params.locale}/gear/${params.slug}/`) }; } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return { title: resolved.seo?.title ?? resolved.guide.title[resolved.locale], description: resolved.seo?.description ?? resolved.guide.summary[resolved.locale], robots: resolved.seo?.indexable ? undefined : { index: false, follow: true }, alternates: resolved.seo ? { canonical: resolved.seo.canonical, languages: resolved.seo.alternatePaths } : undefined };
}

export default async function GearGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, guide, seo } = resolved;
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? guide.title[locale], description: seo?.description ?? guide.summary[locale], url: seo?.canonical ?? `https://stargazing.local/${locale}/gear/${guide.slug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="event-header"><p className="eyebrow">{isGerman ? "Gear-Guide · technische Analyse" : "Gear guide · specification analysis"}</p><h1>{guide.title[locale]}</h1><p className="lede">{guide.summary[locale]}</p><p className="event-note">{guide.decisionSummary[locale]}</p></header>
      <section className="event-summary"><h2>{isGerman ? "Für wen" : "Who it is for"}</h2><p>{guide.audience[locale]}</p><h2>{isGerman ? "Kaufkriterien" : "Buying criteria"}</h2><ul>{guide.buyingCriteria.map((criterion) => <li key={criterion.en}>{criterion[locale]}</li>)}</ul></section>
      <section className="event-summary"><h2>{isGerman ? "Vergleich" : "Comparison"}</h2><div className="event-table-wrap"><table className="event-table"><thead><tr><th>{isGerman ? "Option" : "Option"}</th><th>{isGerman ? "Warum wichtig" : "Why it matters"}</th><th>{isGerman ? "Technische Daten" : "Core specs"}</th><th>{isGerman ? "Stärken / Grenzen" : "Pros / cons"}</th></tr></thead><tbody>{guide.items.map((item) => <tr key={item.name.en}><td>{item.name[locale]}</td><td>{item.whyItMatters[locale]}</td><td>{Object.entries(item.coreSpecs).map(([key, value]) => `${key}: ${value}`).join(" · ")}</td><td>{item.pros[locale].join(", ")} / {item.cons[locale].join(", ")}</td></tr>)}</tbody></table></div></section>
      <section className="event-summary"><h2>{isGerman ? "Abwägungen" : "Trade-offs"}</h2><ul>{guide.tradeoffs[locale].map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul><h2>FAQ</h2>{guide.faq.map((item) => <details key={item.question.en}><summary>{item.question[locale]}</summary><p>{item.answer[locale]}</p></details>)}</section>
      <footer className="event-footer"><p>{guide.affiliateDisclosure[locale]} {isGerman ? "Zuletzt geprüft" : "Last reviewed"}: {guide.lastReviewedAt}.</p><AffiliateDisclosure locale={locale} /></footer>
    </main>
  );
}
