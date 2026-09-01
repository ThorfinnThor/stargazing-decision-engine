import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export function SiteHeader({ locale }: { locale: Locale }) {
  const isGerman = locale === "de";
  const items = [
    { href: `${localizedLinks.home(locale)}#catalog`, label: isGerman ? "Ziele" : "Destinations" },
    { href: localizedLinks.finder(locale), label: "Finder" },
    { href: localizedLinks.locationTours(locale), label: isGerman ? "Nachtpläne" : "Night plans" },
    { href: localizedLinks.gear(locale), label: isGerman ? "Ausrüstung" : "Gear" },
    { href: localizedLinks.methodology(locale), label: isGerman ? "Methodik" : "Method" },
    { href: localizedLinks.about(locale), label: isGerman ? "Über uns" : "About" },
  ];

  return <header className="site-header">
    <a className="site-header-brand" href={localizedLinks.home(locale)} aria-label={isGerman ? "Stargazing Index Startseite" : "Stargazing Index home"}>
      <span aria-hidden="true">✦</span>
      <strong>STARGAZING INDEX</strong>
    </a>
    <nav className="site-header-menu" aria-label={isGerman ? "Hauptnavigation" : "Main navigation"}>
      {items.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
    </nav>
    <nav className="site-header-locales" aria-label={isGerman ? "Sprache" : "Language"}>
      {(["en", "de"] as const).map((item) => <a className={item === locale ? "active" : ""} href={localizedLinks.home(item)} key={item}>{item.toUpperCase()}</a>)}
    </nav>
  </header>;
}
