import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHomeNav } from "@/components/page-home-nav";
import { loadSeoPage } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function readParams(params: { locale: string }) {
  if (!isLocale(params.locale)) return null;
  try {
    return { locale: params.locale as Locale, seo: loadSeoPage(`/${params.locale}/methodology/`) };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: resolved.locale === "de" ? "So bewerten wir Astronomie-Ausrüstung" : "How we evaluate astronomy gear", description: resolved.locale === "de" ? "Transparente Methodik für technische Vergleiche und Quellen." : "Transparent methodology for technical comparisons and sources." });
}

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, seo } = resolved;
  const isGerman = locale === "de";
  const title = isGerman ? "So bewerten wir Ausrüstung." : "How we evaluate gear.";
  const description = isGerman ? "Unsere redaktionellen Standards für technische Gear-Guides, Quellen, Aktualität und kommerzielle Unabhängigkeit." : "Our editorial standards for technical gear guides, evidence, freshness, and commercial independence.";
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? title, description: seo?.description ?? description, url: seo?.canonical ?? `https://stargazingindex.com/${locale}/methodology/`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });

  return (
    <main className="event-page" lang={isGerman ? "de" : "en"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHomeNav locale={locale} />
      <header className="event-header"><p className="eyebrow">{isGerman ? "Redaktion · Methodik" : "Editorial · methodology"}</p><h1>{title}</h1><p className="lede">{description}</p></header>
      <section className="event-summary" aria-labelledby="method-scope-title"><h2 id="method-scope-title">{isGerman ? "Was wir bewerten" : "What we evaluate"}</h2><p>{isGerman ? "Ein Guide beginnt mit einem konkreten Beobachtungsproblem. Wir prüfen Einsatzgebiet, optische oder elektrische Kompatibilität, Stabilität, Transport, Strombedarf, Sicherheit und die Trade-offs zwischen diesen Faktoren." : "Each guide starts with a specific observing problem. We evaluate intended use, optical or electrical compatibility, stability, portability, power needs, safety, and the trade-offs between those factors."}</p><p>{isGerman ? "Wir vergleichen zuerst Produktklassen und technische Lösungen. Marken oder Modelle werden erst genannt, wenn sie mit belastbaren, aktuellen Daten fair vergleichbar sind." : "We compare product classes and technical approaches first. Brands or models are named only when reliable, current information supports a fair comparison."}</p></section>
      <section className="event-summary" aria-labelledby="method-evidence-title"><h2 id="method-evidence-title">{isGerman ? "Wie wir Nachweise kennzeichnen" : "How we label evidence"}</h2><ul><li>{isGerman ? "Spezifikationsanalyse: technische Daten, Kompatibilität und nachvollziehbare optische oder elektrische Zusammenhänge." : "Specification analysis: published specifications, compatibility, and reproducible optical or electrical relationships."}</li><li>{isGerman ? "Praxistest: wird nur dann verwendet, wenn ein klar dokumentierter Test tatsächlich durchgeführt wurde. Die aktuellen Guides beanspruchen das nicht." : "Hands-on test: used only when a documented test was actually performed. The current guides do not make that claim."}</li><li>{isGerman ? "Preis und Verfügbarkeit: werden nicht als dauerhaft gültig dargestellt. Ohne klaren Zeitstempel gibt es keine Live-Preisbehauptung." : "Price and availability: never presented as permanent facts. No live-price claim appears without a clear timestamp."}</li></ul></section>
      <section className="event-summary" aria-labelledby="method-independence-title"><h2 id="method-independence-title">{isGerman ? "Redaktionelle Unabhängigkeit" : "Editorial independence"}</h2><p>{isGerman ? "Eine mögliche Provision verändert weder Vergleichskriterien noch Schlussfolgerungen. Kommerzielle Links werden als solche gekennzeichnet; Partner können keine Platzierung kaufen. Unsere Guides bleiben auch ohne Affiliate-Link vollständig lesbar." : "A potential commission does not change comparison criteria or conclusions. Commercial links are identified; partners cannot buy placement. Every guide remains complete without an affiliate link."}</p><p>{isGerman ? "Einzeln empfohlene Aktivitäten werden manuell geprüft und eindeutig einer Destination zugeordnet. Ergänzende Viator-Suchlinks übergeben nur den Namen der jeweiligen Destination sowie wahlweise den Begriff Stargazing. Auf freigegebenen Seiten wählen automatische GetYourGuide-Widgets anhand des Standorts, des Seitentexts und der Metadaten wechselnde Live-Ergebnisse aus. Sie werden nur nach einer Relevanzkontrolle aktiviert und sind ausdrücklich nicht als einzelne redaktionelle Empfehlung gekennzeichnet. Preise, Bewertungen und Verfügbarkeiten übernehmen wir nicht in den statischen Katalog, weil sie sich ändern können." : "Individually recommended activities are manually reviewed and explicitly matched to a destination. Additional Viator search links send only the relevant destination name and, where selected, the term stargazing. On approved pages, automatic GetYourGuide widgets select changing live results from the location, page copy, and metadata. They are enabled only after a relevance check and are expressly not labelled as individual editorial recommendations. Prices, ratings, and availability are not copied into the static catalog because they can change."}</p></section>
      <section className="event-summary" aria-labelledby="method-maintenance-title"><h2 id="method-maintenance-title">{isGerman ? "Aktualität, Korrekturen und Quellen" : "Freshness, corrections, and sources"}</h2><p>{isGerman ? "Jeder Guide zeigt sein letztes Prüfdatum. Bei technischen oder sicherheitsrelevanten Aussagen hat die aktuelle Dokumentation des Herstellers Vorrang. Fehler werden korrigiert und die Prüfzeit wird aktualisiert." : "Every guide shows its last-reviewed date. Current manufacturer documentation takes priority for technical or safety-critical claims. Errors are corrected and the review date is updated."}</p><p>{isGerman ? "Für Bilder und externe Daten veröffentlichen wir nur Inhalte mit vollständigem Quellen- und Lizenznachweis aus freigegebenen Open-Access- oder Public-Domain-Lizenzen." : "For images and external data, we publish only material with complete source and licence records under approved open-access or public-domain terms."}</p><a className="text-link" href={localizedLinks.gear(locale)}>{isGerman ? "Zu allen Ausrüstungs-Guides →" : "Browse all gear guides →"}</a></section>
    </main>
  );
}
