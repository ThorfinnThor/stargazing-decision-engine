import { affiliateRel, buildAffiliatePartnerUrl } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig } from "@/lib/affiliate/config";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateGearLink({ locale }: { locale: Locale }) {
  const url = buildAffiliatePartnerUrl(loadAffiliateConfig(), "astroshop-gear");
  if (!url) return null;
  const isGerman = locale === "de";
  return <section className="affiliate-gear-link" aria-labelledby="affiliate-gear-title">
    <p className="eyebrow">{isGerman ? "Ausrüstung" : "Gear"}</p>
    <h2 id="affiliate-gear-title">{isGerman ? "Astronomieausrüstung bei Astroshop ansehen" : "Browse astronomy gear at Astroshop"}</h2>
    <p>{isGerman
      ? "Die Vergleichskriterien und Schlussfolgerungen bleiben redaktionell unabhängig. Preise, Lieferbarkeit und aktuelle Produktdaten stehen direkt bei Astroshop."
      : "The comparison criteria and conclusions remain editorially independent. Check current prices, availability, and product details directly at Astroshop."}</p>
    <a href={url} target="_blank" rel={`${affiliateRel()} noopener noreferrer`}>
      {isGerman ? "Ausrüstung bei Astroshop öffnen" : "Open Astroshop gear"} →
    </a>
  </section>;
}
