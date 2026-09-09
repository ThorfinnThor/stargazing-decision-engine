import { AffiliateActivityOffers } from "@/components/affiliate-activity-offers";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { AffiliateStaySearch } from "@/components/affiliate-stay-search";
import { loadAffiliateActivityOffers, loadAffiliateDestinationSearches, loadDestinations } from "@/lib/data/load";
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
  const disclosureId = `affiliate-disclosure-${locationTourSlug ?? destinationId}`;
  const destinationName = loadDestinations().find((destination) => destination.id === destinationId)?.name ?? destinationId;
  const offers = loadAffiliateActivityOffers().filter((offer) => (
    offer.destinationId === destinationId
    && (!locationTourSlug || offer.locationTourSlugs.includes(locationTourSlug))
  ));
  const staySearch = loadAffiliateDestinationSearches().find((search) => search.partnerId === "booking-stay-search" && search.destinationId === destinationId && search.variantId === "default") ?? null;
  const hasOffers = offers.length > 0;
  const hasStaySearch = Boolean(staySearch);
  const hasAffiliateContent = hasOffers || hasStaySearch;

  return <>
    {hasAffiliateContent ? <AffiliateDisclosure id={disclosureId} locale={locale} /> : null}
    <AffiliateActivityOffers destinationId={destinationId} destinationName={destinationName} offers={offers} locationTourSlug={locationTourSlug} locale={locale} disclosureId={hasOffers ? disclosureId : undefined} />
    <AffiliateStaySearch destinationId={destinationId} destinationName={destinationName} search={staySearch} locale={locale} disclosureId={hasStaySearch ? disclosureId : undefined} />
  </>;
}
