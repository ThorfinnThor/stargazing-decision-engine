import { affiliateRel } from "@/lib/affiliate/affiliate";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateGearProductLink({ href, direct, locale }: { href: string; direct: boolean; locale: Locale }) {
  const isGerman = locale === "de";
  return <a className="gear-affiliate-product-link" href={href} target="_blank" rel={`${affiliateRel()} noopener noreferrer`}>
    {direct
      ? (isGerman ? "Produkt bei Astroshop ansehen" : "View product at Astroshop")
      : (isGerman ? "Produkt bei Astroshop suchen" : "Search product at Astroshop")} →
  </a>;
}
