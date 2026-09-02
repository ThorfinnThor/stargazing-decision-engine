import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal-page-shell";
import { loadSeoPage } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal } from "@/lib/legal/config";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const de = locale === "de";
  const seo = loadSeoPage(localizedLinks.about(locale));
  return buildSeoMetadata({ seo, locale, title: de ? "Über Stargazing Index" : "About Stargazing Index", description: de ? "Mission, Arbeitsweise und redaktionelle Verantwortung von Stargazing Index." : "The mission, working principles, and editorial responsibility behind Stargazing Index." });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const de = locale === "de";
  const seo = loadSeoPage(localizedLinks.about(locale));
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? (de ? "Über Stargazing Index" : "About Stargazing Index"), description: seo?.description ?? (de ? "Mission, Arbeitsweise und redaktionelle Verantwortung von Stargazing Index." : "The mission, working principles, and editorial responsibility behind Stargazing Index."), url: seo?.canonical ?? `https://stargazingindex.com/${locale}/about/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });
  return (
    <LegalPageShell locale={locale} eyebrow={de ? "Über uns · Redaktion" : "About · editorial"} title={de ? "Entscheidungen für bessere Nächte." : "Decisions for better nights."} description={de ? "Stargazing Index verbindet reproduzierbare Astronomie- und Klimadaten mit klarer, unabhängiger Reise- und Ausrüstungsorientierung." : "Stargazing Index combines reproducible astronomy and climate data with clear, independent travel and gear guidance."}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="event-summary" aria-labelledby="about-mission-title"><h2 id="about-mission-title">{de ? "Unsere Mission" : "Our mission"}</h2><p>{de ? "Sternbeobachtung scheitert selten an fehlender Begeisterung, sondern an schlechten Bedingungen, unklaren Standorten oder ungeeigneter Ausrüstung. Wir machen diese Entscheidungen nachvollziehbar, ohne eine Live-Wetterprognose oder perfekte Sicht vor Ort zu versprechen." : "Stargazing trips rarely fail for lack of enthusiasm; they fail because conditions, locations, or equipment are poorly matched. We make those decisions easier to understand without promising a live weather forecast or perfect local visibility."}</p></section>
      <section className="event-summary" aria-labelledby="about-editorial-title"><h2 id="about-editorial-title">{de ? "Redaktion und Verantwortung" : "Editorial responsibility"}</h2><p>{de ? `${legal.siteName} wird von ${legal.owner}, Inhaber des Einzelunternehmens ${legal.businessName}, entwickelt und redaktionell verantwortet.` : `${legal.siteName} is developed and editorially managed by ${legal.owner}, owner of the sole proprietorship ${legal.businessName}.`}</p><p>{de ? "Standortwerte, astronomische Simulationen und Gear-Guides weisen ihre Annahmen und Grenzen sichtbar aus. Provisionen dürfen weder Kriterien noch Rankings verändern." : "Destination scores, astronomical simulations, and gear guides visibly state their assumptions and limits. Commissions may not change criteria or rankings."}</p><a className="text-link" href={localizedLinks.methodology(locale)}>{de ? "Unsere Bewertungsmethodik →" : "Our evaluation methodology →"}</a></section>
      <section className="event-summary" aria-labelledby="about-corrections-title"><h2 id="about-corrections-title">{de ? "Korrekturen und Hinweise" : "Corrections and feedback"}</h2><p>{de ? "Wenn du einen Datenfehler, eine veraltete Zugangsregel oder eine unklare Aussage findest, schreibe uns. Wir prüfen den Hinweis und korrigieren den betroffenen Inhalt, wenn sich der Fehler bestätigt." : "If you find a data error, outdated access rule, or unclear statement, tell us. We check the report and correct the affected content when the issue is confirmed."}</p><a className="text-link" href={localizedLinks.contact(locale)}>{de ? "Kontakt aufnehmen →" : "Contact us →"}</a></section>
    </LegalPageShell>
  );
}
