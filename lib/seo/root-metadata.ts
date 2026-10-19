import type { Metadata } from "next";

import { legal } from "@/lib/legal/config";
import { siteConfig } from "@/lib/site-config";

export function buildRootMetadata(locale: "en" | "de"): Metadata {
  const german = locale === "de";
  return {
    metadataBase: new URL("https://stargazingindex.com"),
    applicationName: siteConfig.name,
    title: { default: siteConfig.name, template: `%s | ${siteConfig.shortName}` },
    description: siteConfig.description,
    authors: [{ name: legal.owner, url: `/${locale}/about/` }],
    creator: legal.owner,
    publisher: legal.businessName,
    category: "travel and astronomy",
    alternates: {
      canonical: `/${locale}/`,
      languages: { en: "/en/", de: "/de/", "x-default": "/en/" },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      url: `/${locale}/`,
      locale: german ? "de_DE" : "en_US",
      alternateLocale: [german ? "en_US" : "de_DE"],
    },
    twitter: { card: "summary", title: siteConfig.name, description: siteConfig.description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}
