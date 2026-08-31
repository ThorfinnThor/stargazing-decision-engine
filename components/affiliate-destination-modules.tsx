import { AffiliateActivityOffers } from "@/components/affiliate-activity-offers";
import { AffiliateDestinationSearches } from "@/components/affiliate-destination-searches";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { GetYourGuideActivitiesWidget, hasGetYourGuideActivitiesWidget } from "@/components/getyourguide-integration";
import { loadAffiliateActivityOffers, loadAffiliateDestinationSearches } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateDestinationModules({
  destinationId,
  destinationName,
  destinationQuery,
  locationTourSlug,
  locale,
}: {
  destinationId: string;
  destinationName: string;
  destinationQuery: string;
  locationTourSlug?: string;
  locale: Locale;
}) {
  const hasOffers = loadAffiliateActivityOffers().some((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  const hasSearches = loadAffiliateDestinationSearches().some((search) => search.destinationId === destinationId);
  const hasWidget = hasGetYourGuideActivitiesWidget(destinationId);
  if (!hasOffers && !hasSearches && !hasWidget) return null;

  return <>
    <AffiliateDisclosure locale={locale} />
    <AffiliateActivityOffers destinationId={destinationId} locationTourSlug={locationTourSlug} locale={locale} />
    <AffiliateDestinationSearches destinationId={destinationId} destinationName={destinationName} locale={locale} />
    <GetYourGuideActivitiesWidget destinationId={destinationId} destinationName={destinationName} destinationQuery={destinationQuery} locale={locale} />
  </>;
}
