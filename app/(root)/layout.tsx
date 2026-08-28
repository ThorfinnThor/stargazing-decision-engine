import type { ReactNode } from "react";

import { buildRootMetadata } from "@/lib/seo/root-metadata";

import "../globals.css";

export const metadata = buildRootMetadata("en");

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><link rel="describedby" href="/llms.txt" /></head>
      <body>{children}</body>
    </html>
  );
}
