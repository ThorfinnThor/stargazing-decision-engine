import type { MetadataRoute } from "next";

import { loadSeoRegistry } from "@/lib/data/load";

export const dynamic = "force-static";

const affiliateRedirectPrefix = "/go/";

export default function robots(): MetadataRoute.Robots {
  const registry = loadSeoRegistry();
  return {
    // Crawlers obey only the most specific group that names them, so every
    // group repeats the disallow for the noindex affiliate redirects under /go/.
    rules: ["*", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User"].map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: affiliateRedirectPrefix,
    })),
    host: registry.siteUrl.replace(/\/$/, ""),
    sitemap: `${registry.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
