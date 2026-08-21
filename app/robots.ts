import type { MetadataRoute } from "next";

import { loadSeoRegistry } from "@/lib/data/load";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const registry = loadSeoRegistry();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${registry.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
