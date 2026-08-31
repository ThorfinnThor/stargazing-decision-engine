import type { Metadata } from "next";

import type { SeoPageRecord } from "@/lib/data/load";

export function buildSeoMetadata(options: {
  seo: SeoPageRecord | null;
  title: string;
  description: string;
  locale: "en" | "de";
  image?: string | null;
  article?: {
    modifiedTime: string;
    section: string;
    authors?: string[];
  };
}): Metadata {
  const { seo, locale } = options;
  const title = seo?.title ?? options.title;
  const description = seo?.description ?? options.description;
  const canonical = seo?.canonical ?? `https://stargazingindex.com/${locale}/`;
  const images = options.image ? [{ url: options.image, alt: title }] : undefined;

  const openGraph = options.article
    ? {
        type: "article" as const,
        siteName: "Stargazing Index",
        title,
        description,
        url: canonical,
        locale: locale === "de" ? "de_DE" : "en_US",
        alternateLocale: [locale === "de" ? "en_US" : "de_DE"],
        modifiedTime: options.article.modifiedTime,
        section: options.article.section,
        authors: options.article.authors,
        images,
      }
    : {
        type: "website" as const,
        siteName: "Stargazing Index",
        title,
        description,
        url: canonical,
        locale: locale === "de" ? "de_DE" : "en_US",
        alternateLocale: [locale === "de" ? "en_US" : "de_DE"],
        images,
      };

  return {
    title,
    description,
    robots: seo?.indexable === false ? { index: false, follow: true } : undefined,
    alternates: seo ? { canonical, languages: seo.alternatePaths } : undefined,
    openGraph,
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
  };
}
