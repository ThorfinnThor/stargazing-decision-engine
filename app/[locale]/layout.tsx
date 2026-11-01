import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { CookieConsent } from "@/components/cookie-consent";
import { consentHeadScript } from "@/lib/analytics/consent";
import { GetYourGuideAnalytics } from "@/components/getyourguide-integration";
import { LegalFooter } from "@/components/legal-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale, locales } from "@/lib/i18n/config";
import { buildRootMetadata } from "@/lib/seo/root-metadata";

import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? buildRootMetadata(locale) : {};
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale}>
      <head><script dangerouslySetInnerHTML={{ __html: consentHeadScript }} /><link rel="describedby" href="/llms.txt" /></head>
      <body><CookieConsent locale={locale} /><SiteHeader locale={locale} />{children}<LegalFooter locale={locale} /><GetYourGuideAnalytics /></body>
    </html>
  );
}
