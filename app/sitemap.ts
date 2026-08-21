import type { MetadataRoute } from "next";

import { loadSeoRegistry } from "@/lib/data/load";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const registry = loadSeoRegistry();
  const siteUrl = registry.siteUrl.replace(/\/$/, "");
  return registry.pages.filter((page) => page.indexable).map((page) => ({
    url: page.canonical,
    alternates: { languages: Object.fromEntries(Object.entries(page.alternatePaths).map(([locale, path]) => [locale, `${siteUrl}${path}`])) },
  }));
}
