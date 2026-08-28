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

test("the public site does not use cookies, analytics, or persistent browser storage", () => {
  const client = read("components/sky/random-homepage-sky.tsx");
  assert.doesNotMatch(client, /sessionStorage|localStorage|document\.cookie/);
  const rootLayout = read("app/layout.tsx");
  assert.doesNotMatch(rootLayout, /gtag|GoogleAnalytics|PostHog|analytics/i);
});
