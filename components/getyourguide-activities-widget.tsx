import { affiliatePartnerId, getAffiliatePartner, getGetYourGuideActivityId } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig } from "@/lib/affiliate/config";
import type { PublishedAffiliateActivityOffer } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";

export interface GetYourGuideWidgetModel {
  campaign: string;
  fallbackUrl: string;
  frameUrl: string;
  localeCode: "de-DE" | "en-US";
  offerIds: string[];
  partnerId: string;
  tourIds: string[];
}

export function buildGetYourGuideWidgetModel(offers: PublishedAffiliateActivityOffer[], locale: Locale): GetYourGuideWidgetModel | null {
  const partner = getAffiliatePartner(loadAffiliateConfig(), "getyourguide-activities");
  if (!partner?.enabled || !partner.widget?.enabled) return null;
  const partnerId = affiliatePartnerId(partner);
  if (!partnerId) return null;

  const selected = offers
    .filter((offer) => offer.partnerId === partner.id && offer.kind === "stargazing")
    .map((offer) => ({ offer, tourId: getGetYourGuideActivityId(offer.affiliateUrl) }))
    .filter((item): item is { offer: PublishedAffiliateActivityOffer; tourId: string } => Boolean(item.tourId))
    .slice(0, partner.widget.itemCount);
  if (selected.length === 0) return null;

  return {
    campaign: partner.widget.campaign,
    fallbackUrl: selected[0].offer.affiliateUrl,
    frameUrl: partner.widget.frameUrl,
    localeCode: locale === "de" ? "de-DE" : "en-US",
    offerIds: selected.map(({ offer }) => offer.id),
    partnerId,
    tourIds: selected.map(({ tourId }) => tourId),
  };
}

export function GetYourGuideActivitiesWidget({ model }: { model: GetYourGuideWidgetModel }) {
  return <div
    className="getyourguide-activities-widget-frame"
    data-gyg-href={model.frameUrl}
    data-gyg-locale-code={model.localeCode}
    data-gyg-widget="activities"
    data-gyg-number-of-items={model.tourIds.length}
    data-gyg-cmp={model.campaign}
    data-gyg-partner-id={model.partnerId}
    data-gyg-tour-ids={model.tourIds.join(",")}
  >
    <span className="getyourguide-widget-fallback">Powered by <a href={model.fallbackUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">GetYourGuide</a></span>
  </div>;
}
