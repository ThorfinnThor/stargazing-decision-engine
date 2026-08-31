import { AffiliateActivityOffers } from "@/components/affiliate-activity-offers";
import { AffiliateDestinationSearches } from "@/components/affiliate-destination-searches";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { GetYourGuideAutoWidget, hasGetYourGuideAutoWidget } from "@/components/getyourguide-integration";
import { loadAffiliateActivityOffers, loadAffiliateDestinationSearches } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateDestinationModules({
  destinationId,
  destinationName,
  locationTourSlug,
  locale,
}: {
  destinationId: string;
  destinationName: string;
  locationTourSlug?: string;
  locale: Locale;
}) {
  const hasOffers = loadAffiliateActivityOffers().some((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  const hasSearches = loadAffiliateDestinationSearches().some((search) => search.destinationId === destinationId);
  const hasWidget = hasGetYourGuideAutoWidget(destinationId);
  if (!hasOffers && !hasSearches && !hasWidget) return null;

  return <>
    <AffiliateActivityOffers destinationId={destinationId} locationTourSlug={locationTourSlug} locale={locale} />
    <AffiliateDestinationSearches destinationId={destinationId} destinationName={destinationName} locale={locale} />
    <GetYourGuideAutoWidget destinationId={destinationId} destinationName={destinationName} locale={locale} />
    <AffiliateDisclosure locale={locale} />
  </>;
}
