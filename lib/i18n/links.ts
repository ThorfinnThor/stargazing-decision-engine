import type { Locale } from "./config";

export const localizedLinks = {
  home: (locale: Locale) => `/${locale}/`,
  finder: (locale: Locale) => `/${locale}/finder/`,
  destination: (locale: Locale, slug: string) => `/${locale}/stargazing-destinations/${slug}/`,
  locationTours: (locale: Locale) => `/${locale}/stargazing-tours/`,
  locationTour: (locale: Locale, slug: string) => `/${locale}/stargazing-tours/${slug}/`,
  methodology: (locale: Locale) => `/${locale}/methodology/`,
  meteorShower: (locale: Locale, year: number, slug: string) => `/${locale}/meteor-showers/${year}/${slug}/`,
  shortTrips: (locale: Locale, originSlug: string) => `/${locale}/short-trips/${originSlug}/`,
  gear: (locale: Locale) => `/${locale}/gear/`,
  gearGuide: (locale: Locale, slug: string) => `/${locale}/gear/${slug}/`,
  about: (locale: Locale) => `/${locale}/about/`,
  contact: (locale: Locale) => `/${locale}/contact/`,
  imprint: (locale: Locale) => `/${locale}/imprint/`,
  privacy: (locale: Locale) => `/${locale}/privacy/`,
} as const;
