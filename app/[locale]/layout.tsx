import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { LegalFooter } from "@/components/legal-footer";
import { isLocale, locales } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <>{children}<LegalFooter locale={locale} /></>;
}
