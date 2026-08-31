import type { Locale } from "@/lib/i18n/config";

export function AffiliateDisclosure({ locale }: { locale: Locale }) {
  return <p className="affiliate-disclosure">{locale === "de"
    ? "Hinweis: Einige Links sind Affiliate-Links. Wenn du darüber buchst, können wir ohne Mehrkosten für dich eine Provision erhalten. Partnerschaften beeinflussen weder Rankings noch redaktionelle Empfehlungen."
    : "Disclosure: Some links are affiliate links. If you book through them, we may earn a commission at no extra cost to you. Partnerships do not influence rankings or editorial recommendations."}</p>;
}
