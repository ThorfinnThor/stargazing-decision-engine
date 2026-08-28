import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { PageHomeNav } from "@/components/page-home-nav";
import { listGearGuides, loadGearGuide, loadSeoPage } from "@/lib/data/load";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return locales.flatMap((locale) => listGearGuides().map((slug) => ({ locale, slug }))); }

function readParams(params: { locale: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    return {
      locale: params.locale as Locale,
      guide: loadGearGuide(params.slug),
      relatedGuides: listGearGuides().filter((slug) => slug !== params.slug).slice(0, 3).map(loadGearGuide),
      seo: loadSeoPage(`/${params.locale}/gear/${params.slug}/`),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return { title: resolved.seo?.title ?? resolved.guide.title[resolved.locale], description: resolved.seo?.description ?? resolved.guide.summary[resolved.locale], robots: resolved.seo?.indexable ? undefined : { index: false, follow: true }, alternates: resolved.seo ? { canonical: resolved.seo.canonical, languages: resolved.seo.alternatePaths } : undefined };
}

export default async function GearGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, guide, relatedGuides, seo } = resolved;
  const isGerman = locale === "de";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? guide.title[locale], description: seo?.description ?? guide.summary[locale], url: seo?.canonical ?? `https://stargazing.local/${locale}/gear/${guide.slug}/`, inLanguage: locale, isPartOf: "Stargazing Decision Engine" });
  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header"><p className="eyebrow">{isGerman ? "Gear-Guide · technische Analyse" : "Gear guide · specification analysis"}</p><h1>{guide.title[locale]}</h1><p className="lede">{guide.summary[locale]}</p><p className="event-note">{guide.decisionSummary[locale]}</p></header>
      <section className="event-summary" aria-labelledby="gear-audience-title"><h2 id="gear-audience-title">{isGerman ? "Für wen" : "Who it is for"}</h2><p>{guide.audience[locale]}</p><h2>{isGerman ? "Kaufkriterien" : "Buying criteria"}</h2><ul>{guide.buyingCriteria.map((criterion) => <li key={criterion.en}>{criterion[locale]}</li>)}</ul></section>
      <section className="event-summary" aria-labelledby="gear-comparison-title">
        <h2 id="gear-comparison-title">{isGerman ? "Vergleich" : "Comparison"}</h2>
        <div className="event-table-wrap">
          <table className="event-table gear-comparison-table">
            <thead>
              <tr>
                <th>{isGerman ? "Option" : "Option"}</th>
                <th>{isGerman ? "Warum wichtig" : "Why it matters"}</th>
                <th>{isGerman ? "Technische Daten" : "Core specs"}</th>
                <th>{isGerman ? "Stärken / Grenzen" : "Pros / cons"}</th>
              </tr>
            </thead>
            <tbody>
              {guide.items.map((item) => {
                const coreSpecs = item.localizedCoreSpecs?.[locale] ?? item.coreSpecs;
                return <tr key={item.name.en}>
                  <td data-label={isGerman ? "Option" : "Option"}>
                    <strong>{item.name[locale]}</strong>
                    {item.source ? <><br /><a className="gear-source-link" href={item.source.url} rel="noreferrer">{isGerman ? "Herstellerdaten ↗" : "Manufacturer specifications ↗"}</a></> : null}
                  </td>
                  <td data-label={isGerman ? "Warum wichtig" : "Why it matters"}>{item.whyItMatters[locale]}</td>
                  <td data-label={isGerman ? "Technische Daten" : "Core specs"}>{Object.entries(coreSpecs).map(([key, value]) => `${key}: ${value}`).join(" · ")}</td>
                  <td data-label={isGerman ? "Stärken / Grenzen" : "Pros / cons"}>
                    <span className="gear-pro-con"><strong>{isGerman ? "Stärken:" : "Pros:"}</strong> {item.pros[locale].join(", ")}</span>
                    <span className="gear-pro-con"><strong>{isGerman ? "Grenzen:" : "Cons:"}</strong> {item.cons[locale].join(", ")}</span>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {guide.items.some((item) => item.source) ? <p className="event-note">{isGerman ? `Quellen zuletzt geprüft: ${guide.lastReviewedAt}. Vorteile und Grenzen sind redaktionelle Schlussfolgerungen aus den verlinkten Herstellerdaten.` : `Sources last checked: ${guide.lastReviewedAt}. Pros and limitations are editorial inferences from the linked manufacturer specifications.`}</p> : null}
      </section>
      <section className="event-summary" aria-labelledby="gear-tradeoffs-title"><h2 id="gear-tradeoffs-title">{isGerman ? "Abwägungen" : "Trade-offs"}</h2><ul>{guide.tradeoffs[locale].map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul><h2>FAQ</h2>{guide.faq.map((item) => <details key={item.question.en}><summary>{item.question[locale]}</summary><p>{item.answer[locale]}</p></details>)}</section>
      <section className="event-summary" aria-labelledby="gear-method-title">
        <h2 id="gear-method-title">{isGerman ? "So entstand dieser Guide" : "How this guide was made"}</h2>
        <p>{isGerman ? "Die Aussagen beruhen auf technischen Zusammenhängen, Kompatibilität und veröffentlichten Spezifikationen. Wir behaupten keine Praxistests und führen keine Live-Preise oder Verfügbarkeiten." : "The guidance is based on technical relationships, compatibility, and published specifications. We do not claim hands-on testing or publish live prices or availability."}</p>
        <a className="text-link" href={localizedLinks.methodology(locale)}>{isGerman ? "Bewertungsmethodik lesen →" : "Read the evaluation methodology →"}</a>
      </section>
      <section className="event-summary" aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">{isGerman ? "Weitere Ausrüstungs-Guides" : "Related gear guides"}</h2>
        <div className="foundation-grid gear-guide-grid">{relatedGuides.map((related) => <a className="destination-card gear-guide-card" href={localizedLinks.gearGuide(locale, related.slug)} key={related.slug}><div className="card-topline"><span>{related.category.replaceAll("-", " ")}</span><span>→</span></div><h3>{related.title[locale]}</h3><p>{related.summary[locale]}</p></a>)}</div>
      </section>
      <footer className="event-footer"><p>{guide.affiliateDisclosure[locale]} {isGerman ? "Zuletzt geprüft" : "Last reviewed"}: {guide.lastReviewedAt}.</p><AffiliateDisclosure locale={locale} /></footer>
    </main>
  );
}
