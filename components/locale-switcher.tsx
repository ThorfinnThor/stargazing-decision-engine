"use client";

import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";
import { localeCounterpartPath } from "@/lib/seo/internal-links";

// Links each page to its own translation (prerendered per route in the static
// export), falling back to the locale home for English-only sections.
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}/`;
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return <nav className="site-header-locales" aria-label={label}>
    {(["en", "de"] as const).map((item) => <a className={item === locale ? "active" : ""} href={localeCounterpartPath(normalized, item)} hrefLang={item} key={item}>{item.toUpperCase()}</a>)}
  </nav>;
}
