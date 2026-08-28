import legalConfig from "@/data-config/site/legal.json";

export interface LegalConfig {
  siteName: string;
  businessName: string;
  legalForm: { en: string; de: string };
  owner: string;
  address: { street: string; postalCode: string; city: string; country: { en: string; de: string } };
  email: string;
  lastLegalReview: string;
}

export const legal = legalConfig satisfies LegalConfig;

export function legalAddressLines(locale: "en" | "de") {
  return [legal.address.street, `${legal.address.postalCode} ${legal.address.city}`, legal.address.country[locale]];
}
