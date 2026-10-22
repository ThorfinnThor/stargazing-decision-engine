import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const legal = JSON.parse(read("data-config/site/legal.json")) as { businessName: string; owner: string; email: string; address: { street: string; postalCode: string; city: string } };

test("legal identity contains the public provider and direct contact fields", () => {
  assert.equal(legal.businessName, "SeitenHafen361");
  assert.equal(legal.owner, "Schayan Yousefian");
  assert.equal(legal.email, "info@stargazingindex.com");
  assert.equal(legal.address.street, "Freienwalder Str. 34");
  assert.equal(legal.address.postalCode, "13359");
  assert.equal(legal.address.city, "Berlin");
});

test("every localized page receives directly reachable legal navigation", () => {
  const layout = read("app/[locale]/layout.tsx");
  const footer = read("components/legal-footer.tsx");
  for (const link of ["about", "contact", "imprint", "privacy"]) {
    assert.match(footer, new RegExp(`localizedLinks\\.${link}\\(locale\\)`));
  }
  assert.match(layout, /<LegalFooter locale=\{locale\}/);
});

test("the public site avoids own persistent storage and unapproved analytics providers", () => {
  const client = read("components/sky/random-homepage-sky.tsx");
  assert.doesNotMatch(client, /sessionStorage|localStorage|document\.cookie/);
  const rootLayouts = `${read("app/(root)/layout.tsx")}\n${read("app/[locale]/layout.tsx")}`;
  assert.doesNotMatch(rootLayouts, /gtag|googletagmanager|GoogleAnalytics\b|PostHog/i);
  assert.match(rootLayouts, /GetYourGuideAnalytics/);
});

test("Google Analytics is loaded only after opt-in consent with Consent Mode v2 defaults denied", () => {
  const rootLayouts = `${read("app/(root)/layout.tsx")}\n${read("app/[locale]/layout.tsx")}`;
  assert.match(read("app/(root)/layout.tsx"), /<CookieConsent locale="en" \/>/);
  assert.match(read("app/[locale]/layout.tsx"), /<CookieConsent locale=\{locale\} \/>/);
  assert.doesNotMatch(rootLayouts, /<Script[^>]*googletagmanager/);
  const consent = read("lib/analytics/consent.ts");
  assert.match(consent, /G-WZSPWW8M7F/);
  for (const signal of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
    assert.match(consent, new RegExp(`"consent", "default", \\{[^}]*${signal}: "denied"`));
  }
  assert.doesNotMatch(consent, /ad_storage: "granted"|ad_user_data: "granted"|ad_personalization: "granted"/);
  assert.match(consent, /allow_google_signals: false/);
  assert.match(consent, /_ga_/);
  const banner = read("components/cookie-consent.tsx");
  assert.match(banner, /if \(stored === "granted"\) loadGoogleAnalytics\(\)/);
  assert.match(banner, /"Akzeptieren"/);
  assert.match(banner, /"Ablehnen"/);
  assert.doesNotMatch(banner, /type="checkbox"|defaultChecked/);
  assert.match(read("components/legal-footer.tsx"), /<CookieSettingsButton locale=\{locale\} \/>/);
});

test("privacy notice documents Google Analytics 4 in both languages", () => {
  const privacy = read("app/[locale]/privacy/page.tsx");
  assert.match(privacy, /id="privacy-analytics-title"/);
  for (const phrase of [/Google Ireland Limited/, /Reichweitenmessung/, /audience measurement/, /Art\. 6 Abs\. 1 lit\. a DSGVO/, /Article 6\(1\)\(a\) GDPR/, /§ 25 Abs\. 1 TDDDG \(vormals TTDSG\)/, /14 Monaten/, /14 months/, /2 Jahren/, /2 years/, /Data Privacy Framework/, /Cookie-Einstellungen/, /Cookie settings/]) {
    assert.match(privacy, phrase);
  }
});

test("privacy notice discloses Cloudflare Web Analytics and GetYourGuide on-device storage", () => {
  const privacy = read("app/[locale]/privacy/page.tsx");
  for (const phrase of [/Cloudflare Web Analytics/, /static\.cloudflareinsights\.com/, /\/cdn-cgi\/rum/, /„session_id“/, /“session_id”/, /gyg_visitor_id/, /partner_id/, /collector\.getyourguide\.com/]) {
    assert.match(privacy, phrase);
  }
});
