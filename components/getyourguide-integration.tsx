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

function widgetIncludesDestination(widget: NonNullable<ReturnType<typeof loadEnabledWidget>>, destinationId: string) {
  return widget.destinationScope === "all-active" || Boolean(widget.destinationIds?.includes(destinationId));
}

export function hasGetYourGuideActivitiesWidget(destinationId: string) {
  const widget = loadEnabledWidget();
  return Boolean(widget && widgetIncludesDestination(widget, destinationId));
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

export function GetYourGuideActivitiesWidget({ destinationId, destinationName, destinationQuery, locale }: { destinationId: string; destinationName: string; destinationQuery: string; locale: Locale }) {
  const widget = loadEnabledWidget();
  if (!widget || !widgetIncludesDestination(widget, destinationId)) return null;
  const isGerman = locale === "de";

  return <section className="getyourguide-activities-widget" aria-labelledby={`getyourguide-widget-title-${destinationId}`}>
    <header>
      <p className="eyebrow">{isGerman ? "Live-Aktivitäten für die Destination" : "Live destination activities"} · {widget.partnerName}</p>
      <h2 id={`getyourguide-widget-title-${destinationId}`}>{isGerman ? `Weitere Erlebnisse rund um ${destinationName}` : `More experiences around ${destinationName}`}</h2>
      <p>{isGerman
        ? `GetYourGuide zeigt aktuell buchbare Aktivitäten für ${destinationName}. Prüfe vor der Buchung Treffpunkt, Leistungen, Preis und Bedingungen direkt beim Anbieter.`
        : `GetYourGuide shows currently bookable activities for ${destinationName}. Check the meeting point, inclusions, price, and terms directly with the provider before booking.`}</p>
    </header>
    <div className="getyourguide-activities-widget-frame">
      <div
        data-gyg-href={widget.frameUrl}
        data-gyg-locale-code={isGerman ? "de-DE" : "en-US"}
        data-gyg-widget="activities"
        data-gyg-number-of-items={widget.itemCount}
        data-gyg-partner-id={widget.partnerId}
        data-gyg-cmp={widget.campaign}
        data-gyg-q={destinationQuery}
      />
    </div>
  </section>;
}
