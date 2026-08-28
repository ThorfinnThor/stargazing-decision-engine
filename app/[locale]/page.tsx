import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { HomePage } from "@/components/home-page";
import { loadSeoPage } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const seo = loadSeoPage(`/${locale}/`);
  return buildSeoMetadata({ seo, locale, title: locale === "de" ? "Stargazing für dunkle Himmel" : "Stargazing for dark skies", description: locale === "de" ? "Datenbasierte Entscheidungshilfe für Sternbeobachtung." : "A data-driven decision engine for stargazing travel." });
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage locale={locale as Locale} />;
}
