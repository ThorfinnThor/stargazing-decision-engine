import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateGearProductLink } from "@/components/affiliate-gear-product-link";
import { AffiliateGearLink } from "@/components/affiliate-gear-link";
import { buildAstroshopProductUrl } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig, loadAstroshopProductMatches } from "@/lib/affiliate/config";
import { listGearGuides, loadGearGuide, loadSeoPage } from "@/lib/data/load";
import { buildGearGuideStructuredData, buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { isGearGuideEditorialReady } from "@/lib/gear/gear";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return locales.flatMap((locale) => listGearGuides().map((slug) => ({ locale, slug }))); }

function readParams(params: { locale: string; slug: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    return {
      locale: params.locale as Locale,
      guide: loadGearGuide(params.slug),
      relatedGuides: listGearGuides().filter((slug) => slug !== params.slug).map(loadGearGuide).filter(isGearGuideEditorialReady).slice(0, 3),
      seo: loadSeoPage(`/${params.locale}/gear/${params.slug}/`),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: resolved.locale,
    title: resolved.guide.title[resolved.locale],
    description: resolved.guide.summary[resolved.locale],
    article: {
      modifiedTime: resolved.guide.lastReviewedAt,
      section: resolved.locale === "de" ? "Astronomie-Ausrüstung" : "Astronomy gear",
      authors: [`https://stargazingindex.com/${resolved.locale}/about/#about-editorial-title`],
    },
  });
}

export default async function GearGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, guide, relatedGuides, seo } = resolved;
  const isGerman = locale === "de";
  const affiliateConfig = loadAffiliateConfig();
  const astroshopProductMatches = loadAstroshopProductMatches();
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? guide.title[locale], description: seo?.description ?? guide.summary[locale], url: seo?.canonical ?? `https://stargazingindex.com/${locale}/gear/${guide.slug}/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  const guideStructuredData = buildGearGuideStructuredData({ guide, locale, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/gear/${guide.slug}/` });
  return (
    <main className="event-page gear-guide-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideStructuredData) }} />
      <header className="event-header gear-guide-header">
        <p className="eyebrow">{isGerman ? "Gear-Guide · technische Analyse" : "Gear guide · specification analysis"}</p>
        <h1>{guide.title[locale]}</h1>
        <p className="lede">{guide.summary[locale]}</p>
        <p className="gear-decision-line">{guide.decisionSummary[locale]}</p>
      </header>
      <section className="event-summary gear-decision-summary" aria-labelledby="gear-audience-title">
        <div>
          <p className="eyebrow">{isGerman ? "Passung" : "Fit"}</p>
          <h2 id="gear-audience-title">{isGerman ? "Für wen" : "Who it is for"}</h2>
          <p>{guide.audience[locale]}</p>
        </div>
        <div>
          <p className="eyebrow">{isGerman ? "Vor dem Kauf" : "Before buying"}</p>
          <h2>{isGerman ? "Kaufkriterien" : "Buying criteria"}</h2>
          <ul>{guide.buyingCriteria.map((criterion) => <li key={criterion.en}>{criterion[locale]}</li>)}</ul>
        </div>
      </section>
      <section className="event-summary" aria-labelledby="gear-comparison-title">
        <h2 id="gear-comparison-title">{isGerman ? "Vergleich" : "Comparison"}</h2>
        <div className="gear-comparison-grid">
          {guide.items.map((item, index) => {
            const coreSpecs = item.localizedCoreSpecs?.[locale] ?? item.coreSpecs;
            const match = astroshopProductMatches.find((candidate) => candidate.guideSlug === guide.slug && candidate.productName === item.name.en);
            const affiliateProduct = buildAstroshopProductUrl(affiliateConfig, item, match);
            return <article className="gear-comparison-card" key={item.name.en}>
              <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.name[locale]}</h3>{affiliateProduct ? <AffiliateGearProductLink href={affiliateProduct.url} direct={affiliateProduct.direct} locale={locale} /> : null}</header>
              <section><p className="gear-comparison-label">{isGerman ? "Warum diese Option" : "Why this option"}</p><p>{item.whyItMatters[locale]}</p></section>
              <dl>{Object.entries(coreSpecs).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
              <div className="gear-comparison-verdicts">
                <section><p className="gear-comparison-label">{isGerman ? "Stärken" : "Strengths"}</p><ul>{item.pros[locale].map((value) => <li key={value}>{value}</li>)}</ul></section>
                <section><p className="gear-comparison-label">{isGerman ? "Grenzen" : "Limitations"}</p><ul>{item.cons[locale].map((value) => <li key={value}>{value}</li>)}</ul></section>
              </div>
            </article>;
          })}
        </div>
        {guide.items.some((item) => item.source) ? <p className="event-note">{isGerman ? "Vorteile und Grenzen sind fachliche Schlussfolgerungen aus den verlinkten Herstellerangaben. Produktspezifikationen können sich ändern." : "Pros and limitations are informed conclusions from the linked manufacturer specifications. Product specifications can change."}</p> : null}
      </section>
      <section className="event-summary" aria-labelledby="gear-tradeoffs-title"><h2 id="gear-tradeoffs-title">{isGerman ? "Abwägungen" : "Trade-offs"}</h2><ul>{guide.tradeoffs[locale].map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul><h2>FAQ</h2>{guide.faq.map((item) => <details key={item.question.en}><summary>{item.question[locale]}</summary><p>{item.answer[locale]}</p></details>)}</section>
      <section className="event-summary" aria-labelledby="gear-method-title">
        <h2 id="gear-method-title">{isGerman ? "So entstand dieser Guide" : "How this guide was made"}</h2>
        <p>{isGerman ? "Die Aussagen beruhen auf technischen Zusammenhängen, Kompatibilität und veröffentlichten Spezifikationen. Wir behaupten keine Praxistests und führen keine Live-Preise oder Verfügbarkeiten." : "The guidance is based on technical relationships, compatibility, and published specifications. We do not claim hands-on testing or publish live prices or availability."}</p>
        <a className="text-link" href={localizedLinks.methodology(locale)}>{isGerman ? "Bewertungsmethodik lesen →" : "Read the evaluation methodology →"}</a>
      </section>
      <section className="event-summary gear-related-guides" aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">{isGerman ? "Weitere Ausrüstungs-Guides" : "Related gear guides"}</h2>
        <div className="foundation-grid gear-guide-grid">{relatedGuides.map((related) => <a className="destination-card gear-guide-card" href={localizedLinks.gearGuide(locale, related.slug)} key={related.slug}><div className="card-topline"><span>{related.category.replaceAll("-", " ")}</span><span>→</span></div><h3>{related.title[locale]}</h3><p>{related.summary[locale]}</p></a>)}</div>
      </section>
      <AffiliateGearLink locale={locale} />
      <footer className="event-footer"><p>{isGerman
        ? "Dieser Guide enthält gekennzeichnete Astroshop-Affiliate-Links. Die Produktauswahl und Bewertung bleiben unabhängig."
        : "This guide contains labelled Astroshop affiliate links. Product selection and evaluation remain independent."}</p></footer>
    </main>
  );
}
