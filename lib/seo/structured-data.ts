import { legal } from "@/lib/legal/config";
import type { Destination, DestinationEditorialGuide, DestinationEditorialSource, GearGuide, LocationTour } from "@/lib/data/types";

const sectionNames = {
  en: {
    gear: "Gear guides",
    methodology: "Methodology",
    about: "About",
    "stargazing-destinations": "Stargazing destinations",
    "stargazing-tours": "Location tours",
    "short-trips": "Short trips",
    "meteor-showers": "Meteor showers",
  },
  de: {
    gear: "Ausrüstungsguides",
    methodology: "Methodik",
    about: "Über uns",
    "stargazing-destinations": "Sternbeobachtungsziele",
    "stargazing-tours": "Standort-Touren",
    "short-trips": "Kurzreisen",
    "meteor-showers": "Meteorschauer",
  },
} as const;

function authorEntity(origin: string, locale: "en" | "de") {
  return {
    "@type": "Person",
    name: legal.owner,
    url: `${origin}/${locale}/about/#about-editorial-title`,
  };
}

function publisherEntity(origin: string) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#publisher`,
    name: legal.siteName,
    legalName: legal.businessName,
    url: `${origin}/`,
  };
}

function absoluteMediaUrl(pageUrl: string, mediaUrl?: string | null) {
  return mediaUrl ? new URL(mediaUrl, pageUrl).href : undefined;
}

function humanize(segment: string) {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function breadcrumbs(url: URL, locale: "en" | "de", pageName: string) {
  const segments = url.pathname.split("/").filter(Boolean);
  const localeIndex = segments[0] === locale ? 1 : 0;
  const contentSegments = segments.slice(localeIndex);
  if (contentSegments.length === 0) return null;

  const items: Array<Record<string, unknown>> = [{
    "@type": "ListItem",
    position: 1,
    name: locale === "de" ? "Startseite" : "Home",
    item: `${url.origin}/${locale}/`,
  }];
  const firstSegment = contentSegments[0];
  if ((firstSegment === "gear" || firstSegment === "stargazing-tours") && contentSegments.length > 1) {
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: sectionNames[locale][firstSegment],
      item: `${url.origin}/${locale}/${firstSegment}/`,
    });
  }
  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: pageName || sectionNames[locale][firstSegment as keyof typeof sectionNames.en] || humanize(contentSegments.at(-1) ?? ""),
    item: url.href,
  });
  return {
    "@type": "BreadcrumbList",
    "@id": `${url.href}#breadcrumb`,
    itemListElement: items,
  };
}

export function buildLocationTourStructuredData(options: {
  destination: Destination;
  tour: LocationTour;
  locale: "en" | "de";
  url: string;
  sources: DestinationEditorialSource[];
  image?: string | null;
}) {
  const { destination, tour, locale, url, sources } = options;
  const cited = sources.filter((source) => tour.sourceIds.includes(source.id));
  const origin = new URL(url).origin;
  const image = absoluteMediaUrl(url, options.image);
  return {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "Article",
      "@id": `${url}#location-tour`,
      headline: tour.title[locale],
      description: tour.seoDescription[locale],
      dateModified: tour.lastReviewedAt,
      inLanguage: locale,
      isAccessibleForFree: true,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: { "@type": "TouristDestination", name: destination.name, addressCountry: destination.countryCode },
      author: authorEntity(origin, locale),
      publisher: publisherEntity(origin),
      ...(image ? { image } : {}),
      citation: cited.map((source) => source.url),
    }],
  };
}

export function buildWebPageStructuredData(options: {
  name: string;
  description: string;
  url: string;
  inLanguage: "en" | "de";
  isPartOf?: string;
  dateModified?: string;
}) {
  const url = new URL(options.url);
  const origin = url.origin;
  const websiteId = `${origin}/#website`;
  const publisherId = `${origin}/#publisher`;
  const breadcrumb = breadcrumbs(url, options.inLanguage, options.name);
  const isHome = url.pathname === `/${options.inLanguage}/`;
  const isPublisherPage = url.pathname === `/${options.inLanguage}/about/`;

  const webPage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url.href}#webpage`,
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: options.inLanguage,
    isPartOf: { "@id": websiteId },
    ...(breadcrumb ? { breadcrumb: { "@id": `${url.href}#breadcrumb` } } : {}),
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
  };

  const graph: Array<Record<string, unknown>> = [webPage];
  if (breadcrumb) graph.push(breadcrumb);
  if (isHome || isPublisherPage) {
    graph.push({
      "@type": "WebSite",
      "@id": websiteId,
      url: `${origin}/`,
      name: legal.siteName,
      alternateName: "Stargazing Decision Engine",
      inLanguage: ["en", "de"],
      publisher: { "@id": publisherId },
    });
    graph.push({
      "@type": "Organization",
      "@id": publisherId,
      name: legal.siteName,
      alternateName: legal.businessName,
      legalName: legal.businessName,
      url: `${origin}/`,
      email: legal.email,
      founder: { "@type": "Person", name: legal.owner },
      contactPoint: {
        "@type": "ContactPoint",
        email: legal.email,
        contactType: "editorial corrections",
        availableLanguage: ["English", "German"],
      },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function buildDestinationEditorialStructuredData(options: {
  destination: Destination;
  guide: DestinationEditorialGuide;
  locale: "en" | "de";
  url: string;
  image?: string | null;
}) {
  const { destination, guide, locale, url } = options;
  const articleId = `${url}#editorial-guide`;
  const origin = new URL(url).origin;
  const image = absoluteMediaUrl(url, options.image);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": articleId,
        headline: guide.seoTitle[locale],
        description: guide.seoDescription[locale],
        dateModified: guide.lastReviewedAt,
        inLanguage: locale,
        isAccessibleForFree: true,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        about: {
          "@type": "TouristDestination",
          name: destination.name,
          addressCountry: destination.countryCode,
        },
        author: authorEntity(origin, locale),
        publisher: publisherEntity(origin),
        ...(image ? { image } : {}),
        citation: guide.sources.map((source) => source.url),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: guide.faq.map((item) => ({
          "@type": "Question",
          name: item.question[locale],
          acceptedAnswer: { "@type": "Answer", text: item.answer[locale] },
        })),
      },
    ],
  };
}

export function buildGearGuideStructuredData(options: {
  guide: GearGuide;
  locale: "en" | "de";
  url: string;
}) {
  const { guide, locale, url } = options;
  const sourceUrls = guide.items.flatMap((item) => item.source ? [item.source.url] : []);
  const origin = new URL(url).origin;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#gear-guide`,
        headline: guide.title[locale],
        description: guide.summary[locale],
        dateModified: guide.lastReviewedAt,
        inLanguage: locale,
        isAccessibleForFree: true,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        author: authorEntity(origin, locale),
        publisher: publisherEntity(origin),
        citation: sourceUrls,
        about: guide.items.map((item) => ({ "@type": "Thing", name: item.name[locale] })),
      },
      {
        "@type": "ItemList",
        "@id": `${url}#compared-products`,
        name: locale === "de" ? "Verglichene Produkte" : "Compared products",
        numberOfItems: guide.items.length,
        itemListElement: guide.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name[locale],
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: guide.faq.map((item) => ({
          "@type": "Question",
          name: item.question[locale],
          acceptedAnswer: { "@type": "Answer", text: item.answer[locale] },
        })),
      },
    ],
  };
}
