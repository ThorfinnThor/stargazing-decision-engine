import { legal } from "@/lib/legal/config";

const sectionNames = {
  en: {
    gear: "Gear guides",
    methodology: "Methodology",
    about: "About",
    "stargazing-destinations": "Stargazing destinations",
    "short-trips": "Short trips",
    "meteor-showers": "Meteor showers",
  },
  de: {
    gear: "Ausrüstungsguides",
    methodology: "Methodik",
    about: "Über uns",
    "stargazing-destinations": "Sternbeobachtungsziele",
    "short-trips": "Kurzreisen",
    "meteor-showers": "Meteorschauer",
  },
} as const;

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
  if (firstSegment === "gear" && contentSegments.length > 1) {
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: sectionNames[locale].gear,
      item: `${url.origin}/${locale}/gear/`,
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
