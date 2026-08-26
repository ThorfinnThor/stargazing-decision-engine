import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export function PageHomeNav({ locale }: { locale: Locale }) {
  return (
    <nav className="destination-page-nav" aria-label={locale === "de" ? "Seitennavigation" : "Page navigation"}>
      <a className="destination-home-link" href={localizedLinks.home(locale)}>
        <span aria-hidden="true">←</span> {locale === "de" ? "Startseite" : "Home"}
      </a>
    </nav>
  );
}
