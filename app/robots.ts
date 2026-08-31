import type { MetadataRoute } from "next";

import { loadSeoRegistry } from "@/lib/data/load";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const registry = loadSeoRegistry();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Claude-SearchBot", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
    ],
    host: registry.siteUrl.replace(/\/$/, ""),
    sitemap: `${registry.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
