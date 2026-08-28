import type { ReactNode } from "react";

import { PageHomeNav } from "@/components/page-home-nav";
import type { Locale } from "@/lib/i18n/config";

export function LegalPageShell({ locale, eyebrow, title, description, children }: { locale: Locale; eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="event-page legal-page" lang={locale}>
      <PageHomeNav locale={locale} />
      <header className="event-header"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></header>
      {children}
    </main>
  );
}
