import { AffiliateActivityOffers } from "@/components/affiliate-activity-offers";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { loadAffiliateActivityOffers } from "@/lib/data/load";
import type { Locale } from "@/lib/i18n/config";

export function AffiliateDestinationModules({
  destinationId,
  locationTourSlug,
  locale,
}: {
  destinationId: string;
  locationTourSlug?: string;
  locale: Locale;
}) {
  const hasOffers = loadAffiliateActivityOffers().some((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  if (!hasOffers) return null;

  return <>
    <AffiliateDisclosure locale={locale} />
    <AffiliateActivityOffers destinationId={destinationId} locationTourSlug={locationTourSlug} locale={locale} />
  </>;
}
