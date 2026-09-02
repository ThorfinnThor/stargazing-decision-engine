import type { Locale } from "@/lib/i18n/config";

export function AffiliateDisclosure({ id, locale }: { id?: string; locale: Locale }) {
  return <p className="affiliate-disclosure" id={id}><strong>{locale === "de" ? "Affiliate-Hinweis:" : "Affiliate disclosure:"}</strong>{" "}{locale === "de"
    ? "Wenn du über einen gekennzeichneten Link buchst, können wir ohne Mehrkosten für dich eine Provision erhalten. Das beeinflusst weder Auswahl noch Bewertung."
    : "If you book through a labelled link, we may earn a commission at no extra cost to you. This does not influence selection or evaluation."}</p>;
}
