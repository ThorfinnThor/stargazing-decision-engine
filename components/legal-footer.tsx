import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal } from "@/lib/legal/config";

export function LegalFooter({ locale }: { locale: Locale }) {
  const de = locale === "de";
  return (
    <footer className="site-legal-footer">
      <div>
        <p className="site-legal-brand">{legal.siteName}</p>
        <p>{de ? "Unabhängige, datenbasierte Orientierung für Sternbeobachtung." : "Independent, data-driven guidance for stargazing."}</p>
      </div>
      <nav aria-label={de ? "Rechtliches und Kontakt" : "Legal and contact"}>
        <a href={localizedLinks.about(locale)}>{de ? "Über uns" : "About"}</a>
        <a href={localizedLinks.contact(locale)}>{de ? "Kontakt" : "Contact"}</a>
        <a href={localizedLinks.imprint(locale)}>{de ? "Impressum" : "Imprint"}</a>
        <a href={localizedLinks.privacy(locale)}>{de ? "Datenschutz" : "Privacy"}</a>
      </nav>
    </footer>
  );
}
