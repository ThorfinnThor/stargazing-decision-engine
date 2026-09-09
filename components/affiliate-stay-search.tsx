import { affiliateRel } from "@/lib/affiliate/affiliate";
import type { PublishedAffiliateDestinationSearch } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateStaySearch({ destinationId, destinationName, search, locale, disclosureId }: { destinationId: string; destinationName: string; search: PublishedAffiliateDestinationSearch | null; locale: Locale; disclosureId?: string }) {
  if (!search) return null;
  const isGerman = locale === "de";
  const title = isGerman ? `Unterkünfte rund um ${destinationName}` : `Places to stay around ${destinationName}`;
  const cta = isGerman ? "Unterkünfte bei Booking.com suchen" : "Search stays on Booking.com";

  return <section className="affiliate-stay-search" aria-describedby={disclosureId} aria-labelledby={`affiliate-stay-title-${destinationId}`}>
    <div>
      <p className="eyebrow">{isGerman ? "Übernachten in der Region" : "Stay near the observing site"}</p>
      <h2 id={`affiliate-stay-title-${destinationId}`}>{title}</h2>
    </div>
    <div className="affiliate-stay-search-copy">
      <p>{isGerman
        ? "Die Suche führt zu aktuell verfügbaren Unterkünften im hinterlegten Übernachtungsort. Prüfe vor der Buchung die nächtliche Fahrzeit zum ausgewählten Beobachtungsplatz, da das Suchgebiet größer sein kann als der eigentliche Dark-Sky-Standort."
        : "The search opens current accommodation availability for the recorded stay area. Check the night-time drive to your chosen observing site before booking, because the search area may be broader than the dark-sky location itself."}</p>
      <a
        aria-label={`${cta} (${isGerman ? "öffnet neuen Tab" : "opens in a new tab"})`}
        href={search.redirectPath}
        target="_blank"
        rel={`${affiliateRel()} noopener noreferrer`}
      >{cta} <span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}
