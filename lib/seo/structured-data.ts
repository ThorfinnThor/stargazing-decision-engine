export function buildWebPageStructuredData(options: {
  name: string;
  description: string;
  url: string;
  inLanguage: "en" | "de";
  isPartOf?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: options.inLanguage,
    ...(options.isPartOf ? { isPartOf: { "@type": "WebSite", name: options.isPartOf, url: new URL(options.url).origin } } : {}),
  };
}
