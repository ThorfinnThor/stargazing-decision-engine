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
  return { title: de ? "Kontakt" : "Contact", description: de ? "Kontakt zu Stargazing Index und SeitenHafen361." : "Contact Stargazing Index and SeitenHafen361.", robots: { index: false, follow: true }, alternates: { canonical: localizedLinks.contact(locale), languages: Object.fromEntries(locales.map((item) => [item, localizedLinks.contact(item)])) } };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const de = locale === "de";
  return (
    <LegalPageShell locale={locale} eyebrow={de ? "Kontakt · Stargazing Index" : "Contact · Stargazing Index"} title={de ? "Schreib uns." : "Get in touch."} description={de ? "Für Korrekturen, Quellenhinweise, redaktionelle Fragen und Partnerschaften erreichst du uns direkt per E-Mail." : "For corrections, source notes, editorial questions, and partnerships, contact us directly by email."}>
      <section className="event-summary" aria-labelledby="contact-email-title"><h2 id="contact-email-title">E-Mail</h2><p><a className="text-link" href={`mailto:${legal.email}`}>{legal.email}</a></p><p>{de ? "Beim Klick auf die Adresse öffnet sich dein eigenes E-Mail-Programm. Diese Website verwendet kein Kontaktformular und überträgt dabei selbst keine Nachricht." : "Selecting the address opens your own email application. This website has no contact form and does not itself transmit a message."}</p></section>
      <section className="event-summary" aria-labelledby="contact-post-title"><h2 id="contact-post-title">{de ? "Postanschrift" : "Postal address"}</h2><address>{legal.businessName}<br />{de ? "Inhaber" : "Owner"}: {legal.owner}<br />{legalAddressLines(locale).map((line) => <span key={line}>{line}<br /></span>)}</address></section>
    </LegalPageShell>
  );
}
