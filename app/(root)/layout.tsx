import type { ReactNode } from "react";

import { CookieConsent } from "@/components/cookie-consent";
import { consentHeadScript } from "@/lib/analytics/consent";
import { GetYourGuideAnalytics } from "@/components/getyourguide-integration";
import { buildRootMetadata } from "@/lib/seo/root-metadata";

import "../globals.css";

export const metadata = buildRootMetadata("en");

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: consentHeadScript }} /><link rel="describedby" href="/llms.txt" /></head>
      <body><CookieConsent locale="en" />{children}<GetYourGuideAnalytics /></body>
    </html>
  );
}
