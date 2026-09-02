import Script from "next/script";

import { affiliatePartnerId, getAffiliatePartner } from "@/lib/affiliate/affiliate";
import { loadAffiliateConfig } from "@/lib/affiliate/config";

function loadEnabledAnalytics() {
  const partner = getAffiliatePartner(loadAffiliateConfig(), "getyourguide-activities");
  if (!partner?.enabled || !partner.widget?.scriptUrl) return null;
  const partnerId = affiliatePartnerId(partner);
  if (!partnerId) return null;
  return { partnerId, scriptUrl: partner.widget.scriptUrl };
}

export function GetYourGuideAnalytics() {
  const integration = loadEnabledAnalytics();
  if (!integration) return null;
  return <Script
    id="getyourguide-integration-analyzer"
    src={integration.scriptUrl}
    strategy="afterInteractive"
    data-gyg-partner-id={integration.partnerId}
  />;
}
