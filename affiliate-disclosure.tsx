import type { Locale } from "@/lib/i18n/config";

export function AffiliateDisclosure({ locale }: { locale: Locale }) {
  return <p className="affiliate-disclosure">{locale === "de" ? "Affiliate-Links werden klar gekennzeichnet und beeinflussen keine Rankings." : "Affiliate links are clearly disclosed and never influence rankings."}</p>;
}
