import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateGearProductLink } from "@/components/affiliate-gear-product-link";
import { AffiliateGearLink } from "@/components/affiliate-gear-link";
import { GearProductImage } from "@/components/gear-product-image";
import { loadGearProductImages } from "@/lib/gear/product-images";
import { buildAstroshopProductUrl } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig, loadAstroshopProductMatches, loadAmazonGearConfig } from "@/lib/affiliate/config";
import { buildAmazonProductUrl } from "@/lib/affiliate/amazon";
import { listGearGuides, loadGearCategories, loadGearGuide, loadSeoPage } from "@/lib/data/load";
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
  const categories = loadGearCategories();
  const affiliateConfig = loadAffiliateConfig();
  const astroshopProductMatches = loadAstroshopProductMatches();
  const amazonConfig = loadAmazonGearConfig();
  const hasAmazonLinks = guide.items.some(item => buildAmazonProductUrl(amazonConfig, guide.slug, item));
  const productImages = loadGearProductImages().filter((image) => image.guideSlug === guide.slug);
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
        <nav className="gear-page-nav" aria-label={isGerman ? "In diesem Guide" : "In this guide"}>
          <a href="#gear-comparison-title">{isGerman ? "Produkte vergleichen" : "Compare products"}</a>
          <a href="#gear-audience-title">{isGerman ? "Kaufberatung" : "Buying advice"}</a>
          <a href="#gear-tradeoffs-title">{isGerman ? "Abwägungen & Fragen" : "Trade-offs & questions"}</a>
        </nav>
      </header>
      <section className="event-summary" aria-labelledby="gear-comparison-title">
        <h2 id="gear-comparison-title">{isGerman ? "Vergleich" : "Comparison"}</h2>
        <p className="gear-shopping-disclosure">{isGerman ? "Affiliate-Links · Bei einem Kauf können wir eine Provision erhalten, ohne Mehrkosten für dich." : "Affiliate links · We may earn a commission from purchases, at no extra cost to you."}</p>
        <div className="gear-comparison-grid">
          {guide.items.map((item, index) => {
            const coreSpecs = item.localizedCoreSpecs?.[locale] ?? item.coreSpecs;
            const match = astroshopProductMatches.find((candidate) => candidate.guideSlug === guide.slug && candidate.productName === item.name.en);
            const affiliateProduct = buildAstroshopProductUrl(affiliateConfig, item, match);
            const amazonUrl = buildAmazonProductUrl(amazonConfig, guide.slug, item);
            const amazonImport = amazonConfig.matches.find(candidate => candidate.guideSlug === guide.slug && candidate.productName === item.name.en)?.importOffer;
            const productImage = productImages.find((image) => image.productName === item.name.en);
            return <article className="gear-comparison-card" key={item.name.en}>
              {productImage && affiliateProduct?.direct ? <GearProductImage image={productImage} name={item.name[locale]} href={affiliateProduct.url} /> : null}
              <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.name[locale]}</h3></header>
              <div className="gear-product-highlights">
                <p><strong>{isGerman ? "Stärke" : "Strength"}</strong>{item.pros[locale][0]}</p>
                <p><strong>{isGerman ? "Beachten" : "Consider"}</strong>{item.cons[locale][0]}</p>
              </div>
              {affiliateProduct || amazonUrl ? <div className="gear-retailer-links">
                {affiliateProduct ? <AffiliateGearProductLink href={affiliateProduct.url} direct={affiliateProduct.direct} locale={locale} /> : null}
                {amazonUrl ? <AffiliateGearProductLink href={amazonUrl} direct locale={locale} retailer="Amazon" /> : null}
                {amazonUrl && amazonImport ? <small>{isGerman ? "Amazon-US-Importangebot. Ausführung, Lieferzeit und Bedingungen vor dem Kauf prüfen." : "Amazon US import offer. Check version, delivery and terms before buying."}</small> : null}
              </div> : null}
              <details className="gear-product-details">
                <summary>{isGerman ? "Technische Daten & Einordnung" : "Specs & full assessment"}</summary>
                <p>{item.whyItMatters[locale]}</p>
                <dl>{Object.entries(coreSpecs).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
                <div className="gear-comparison-verdicts">
                  <section><p className="gear-comparison-label">{isGerman ? "Alle Stärken" : "All strengths"}</p><ul>{item.pros[locale].map((value) => <li key={value}>{value}</li>)}</ul></section>
                  <section><p className="gear-comparison-label">{isGerman ? "Alle Grenzen" : "All limitations"}</p><ul>{item.cons[locale].map((value) => <li key={value}>{value}</li>)}</ul></section>
                </div>
              </details>
            </article>;
          })}
        </div>
        {guide.items.some((item) => item.source) ? <p className="event-note">{isGerman ? "Vorteile und Grenzen sind fachliche Schlussfolgerungen aus den verlinkten Hersteller- und Händlerangaben. Produktspezifikationen können sich ändern." : "Pros and limitations are informed conclusions from the linked manufacturer and retailer specifications. Product specifications can change."}</p> : null}
      </section>
      <section className="event-summary" aria-labelledby="gear-audience-title">
        <h2 id="gear-audience-title">{isGerman ? "Welche Option passt zu dir?" : "Which option fits your needs?"}</h2>
        <p className="gear-advice-copy">{guide.decisionSummary[locale]}</p>
        <details><summary>{isGerman ? "Einsatzgebiet und Kaufkriterien" : "Who it is for & buying criteria"}</summary><p>{guide.audience[locale]}</p><ul>{guide.buyingCriteria.map((criterion) => <li key={criterion.en}>{criterion[locale]}</li>)}</ul></details>
      </section>
      <section className="event-summary" aria-labelledby="gear-tradeoffs-title"><h2 id="gear-tradeoffs-title">{isGerman ? "Abwägungen" : "Trade-offs"}</h2><ul>{guide.tradeoffs[locale].map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul><h2>FAQ</h2>{guide.faq.map((item) => <details key={item.question.en}><summary>{item.question[locale]}</summary><p>{item.answer[locale]}</p></details>)}</section>
      <section className="event-summary gear-related-guides" aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">{isGerman ? "Weitere Ausrüstungs-Guides" : "Related gear guides"}</h2>
        <div className="gear-guide-grid">{relatedGuides.map((related) => <a className="gear-guide-card" href={localizedLinks.gearGuide(locale, related.slug)} key={related.slug}><div className="card-topline"><span>{categories.find((category) => category.id === related.category)?.name[locale]}</span><span aria-hidden="true">↗</span></div><h3>{related.title[locale]}</h3><p>{categories.find((category) => category.id === related.category)?.description[locale] ?? related.summary[locale]}</p><span className="gear-card-action">{isGerman ? "Zum Vergleich" : "View comparison"} →</span></a>)}</div>
      </section>
      <AffiliateGearLink locale={locale} />
      <footer className="event-footer"><p>{isGerman
        ? "Dieser Guide enthält gekennzeichnete Affiliate-Links. Die Produktauswahl und Bewertung bleiben unabhängig."
        : "This guide contains labelled affiliate links. Product selection and evaluation remain independent."}</p>
        {hasAmazonLinks ? <p>{isGerman ? "Als Amazon-Partner verdiene ich an qualifizierten Verkäufen." : "As an Amazon Associate I earn from qualifying purchases."}</p> : null}
      </footer>
    </main>
  );
}
