import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal-page-shell";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal, legalAddressLines } from "@/lib/legal/config";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const de = locale === "de";
  return { title: de ? "Impressum" : "Imprint", description: de ? "Anbieterkennzeichnung von Stargazing Index." : "Legal provider information for Stargazing Index.", robots: { index: false, follow: true }, alternates: { canonical: localizedLinks.imprint(locale), languages: Object.fromEntries(locales.map((item) => [item, localizedLinks.imprint(item)])) } };
}

export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const de = locale === "de";
  return (
    <LegalPageShell locale={locale} eyebrow={de ? "Rechtliches · Anbieterkennzeichnung" : "Legal · provider information"} title={de ? "Impressum" : "Imprint"} description={de ? "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)." : "Provider information under Section 5 of the German Digital Services Act (DDG)."}>
      <section className="event-summary" aria-labelledby="imprint-provider-title"><h2 id="imprint-provider-title">{de ? "Diensteanbieter" : "Service provider"}</h2><address>{legal.businessName}<br />{legal.legalForm[locale]}<br />{de ? "Inhaber" : "Owner"}: {legal.owner}<br />{legalAddressLines(locale).map((line) => <span key={line}>{line}<br /></span>)}</address></section>
      <section className="event-summary" aria-labelledby="imprint-contact-title"><h2 id="imprint-contact-title">{de ? "Kontakt" : "Contact"}</h2><p>E-Mail: <a className="text-link" href={`mailto:${legal.email}`}>{legal.email}</a></p></section>
      <section className="event-summary" aria-labelledby="imprint-editor-title"><h2 id="imprint-editor-title">{de ? "Redaktionell verantwortlich" : "Editorial responsibility"}</h2><p>{de ? "Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 Medienstaatsvertrag (MStV):" : "Responsible for journalistic-editorial content under Section 18(2) of the German Interstate Media Treaty (MStV):"}</p><address>{legal.owner}<br />{legalAddressLines(locale).map((line) => <span key={line}>{line}<br /></span>)}</address></section>
      <footer className="event-footer"><p>{de ? "Letzte rechtliche Prüfung" : "Last legal review"}: {legal.lastLegalReview}</p></footer>
    </LegalPageShell>
  );
}
