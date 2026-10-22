export const gaMeasurementId = "G-WZSPWW8M7F";
export const consentStorageKey = "sgi-analytics-consent-v1";
export const openConsentEvent = "sgi:open-cookie-settings";

export type ConsentChoice = "granted" | "denied";

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } & Record<string, unknown>;

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(consentStorageKey);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function storeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(consentStorageKey, choice);
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
}

// gtag.js is only injected after an explicit opt-in, so no request reaches Google without consent.
export function loadGoogleAnalytics() {
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${gaMeasurementId}`] = false;
  if (w.gtag) {
    w.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = function gtag() {
    // gtag.js expects the arguments object, not an array.
    w.dataLayer!.push(arguments);
  };
  w.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  w.gtag("consent", "update", { analytics_storage: "granted" });
  w.gtag("js", new Date());
  w.gtag("config", gaMeasurementId, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.appendChild(script);
}

export function disableGoogleAnalytics() {
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${gaMeasurementId}`] = true;
  w.gtag?.("consent", "update", { analytics_storage: "denied" });
  deleteGoogleAnalyticsCookies();
}

function deleteGoogleAnalyticsCookies() {
  const labels = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < labels.length - 1; i += 1) domains.push(`; domain=.${labels.slice(i).join(".")}`);
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !(name === "_ga" || name.startsWith("_ga_") || name === "_gid" || name.startsWith("_gat"))) continue;
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
}
