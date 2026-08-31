import Script from "next/script";

import { affiliatePartnerId, getAffiliatePartner } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig } from "@/lib/affiliate/config";
import type { Locale } from "@/lib/i18n/config";

function loadEnabledWidget() {
  const partner = getAffiliatePartner(loadAffiliateConfig(), "getyourguide-activities");
  if (!partner?.enabled || !partner.widget?.enabled) return null;
  const partnerId = affiliatePartnerId(partner);
  if (!partnerId) return null;
  return { partnerId, partnerName: partner.name, ...partner.widget };
}

export function hasGetYourGuideAutoWidget(destinationId: string) {
  const widget = loadEnabledWidget();
  return Boolean(widget?.destinationIds.includes(destinationId));
}

export function GetYourGuideAnalytics() {
  const widget = loadEnabledWidget();
  if (!widget) return null;
  return <Script
    id="getyourguide-integration-analyzer"
    src={widget.scriptUrl}
    strategy="afterInteractive"
    data-gyg-partner-id={widget.partnerId}
  />;
}

export function GetYourGuideAutoWidget({ destinationId, destinationName, locale }: { destinationId: string; destinationName: string; locale: Locale }) {
  const widget = loadEnabledWidget();
  if (!widget || !widget.destinationIds.includes(destinationId)) return null;
  const isGerman = locale === "de";

  return <section className="getyourguide-auto-widget" aria-labelledby={`getyourguide-widget-title-${destinationId}`}>
    <header>
      <p className="eyebrow">{isGerman ? "Automatische Live-Auswahl" : "Automatic live selection"} · {widget.partnerName}</p>
      <h2 id={`getyourguide-widget-title-${destinationId}`}>{isGerman ? `Weitere Erlebnisse rund um ${destinationName}` : `More experiences around ${destinationName}`}</h2>
      <p>{isGerman
        ? "GetYourGuide wählt anhand des Standorts und des Seiteninhalts drei aktuell buchbare Aktivitäten aus. Diese Live-Ergebnisse wurden von uns nicht einzeln geprüft. Prüfe vor der Buchung Treffpunkt, Leistungen, Preis und Bedingungen beim Anbieter."
        : "GetYourGuide uses the location and page content to select three currently bookable activities. We have not reviewed these live results individually. Check the meeting point, inclusions, price, and terms with the provider before booking."}</p>
    </header>
    <div className="getyourguide-auto-widget-frame">
      <div data-gyg-widget="auto" data-gyg-partner-id={widget.partnerId} data-gyg-cmp={widget.campaign} />
    </div>
  </section>;
}
