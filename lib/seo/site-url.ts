export const productionSiteOrigin = "https://stargazingindex.com";

export function validateProductionSiteOrigin(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid production site URL: ${value}`);
  }

  const hasUnexpectedParts = parsed.username !== ""
    || parsed.password !== ""
    || parsed.port !== ""
    || parsed.pathname !== "/"
    || parsed.search !== ""
    || parsed.hash !== "";

  if (parsed.protocol !== "https:" || parsed.origin !== productionSiteOrigin || hasUnexpectedParts) {
    throw new Error(`Production site URL must be exactly ${productionSiteOrigin}`);
  }

  return parsed.origin;
}
