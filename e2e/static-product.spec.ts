import { expect, test, type Page } from "@playwright/test";

function captureConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("both localized homepages and language navigation render without browser errors", async ({ page }) => {
  const errors = captureConsoleErrors(page);
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator(".site-header-locales").getByRole("link", { name: "DE" }).click();
  await expect(page).toHaveURL(/\/de\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("homepage destination filters restore from and synchronize to the URL", async ({ page }) => {
  await page.goto("/en/?q=spain&region=europe#catalog");
  const search = page.getByLabel("Search destinations");
  const region = page.getByLabel("Region");
  await expect(search).toHaveValue("spain");
  await expect(region).toHaveValue("europe");
  await expect(page.locator(".destination-card").first()).toBeVisible();

  await search.fill("Chile");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("Chile");

  await page.goto("/de/#catalog");
  const continentLabels = await page.locator(".destination-card .card-topline span:nth-child(2)").allTextContents();
  expect(continentLabels).toContain("Nordamerika");
  expect(continentLabels).not.toContain("north-america");
});

test("finder deep links hydrate controls and preserve the replace-state contract", async ({ page }) => {
  const errors = captureConsoleErrors(page);
  await page.goto("/en/finder/?month=9&region=europe&priority=darkness");
  await expect(page.getByLabel("Month")).toHaveValue("9");
  await expect(page.getByLabel("Region")).toHaveValue("europe");
  await expect(page.getByLabel("Preference focus")).toHaveValue("darkness");
  await expect(page.locator(".finder-result").first()).toBeVisible();
  await page.getByLabel("Month").focus();
  await expect(page.getByLabel("Month")).toBeFocused();
  expect(errors).toEqual([]);
});

test("finder explains withheld low-confidence data", async ({ page }) => {
  await page.route("**/data/stargazing/search/destination-index.json", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{
        id: "low-confidence",
        slug: "low-confidence",
        name: "Low confidence destination",
        countryCode: "DE",
        countryName: "Germany",
        continent: "europe",
        tags: [],
        bestSiteId: "low-site",
        bestSiteName: "Low site",
        publicAccess: "yes",
        monthly: [{
          month: 1,
          stargazingTrip: 80,
          skyQuality: 80,
          tripComfort: 80,
          clearSkyScore: 80,
          darknessScore: 80,
          temperatureComfortScore: 80,
          nightTempMeanC: 10,
          dewRiskProbability: 0.1,
          confidenceScore: 35,
          confidenceLevel: "low",
        }],
      }]),
    });
  });

  await page.goto("/en/finder/");
  await expect(page.locator(".finder-exclusion-notice")).toContainText("1 additional destination");
  await expect(page.locator(".finder-result")).toHaveCount(0);
});

test("finder retries a transient index failure without a page reload", async ({ page }) => {
  let requests = 0;
  await page.route("**/data/stargazing/search/destination-index.json", async (route) => {
    requests += 1;
    if (requests === 1) await route.fulfill({ status: 503, body: "temporary failure" });
    else await route.continue();
  });

  await page.goto("/en/finder/");
  const retry = page.getByRole("button", { name: "Retry loading destinations" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.locator(".finder-result").first()).toBeVisible();
  expect(requests).toBe(2);
});

test("critical pages have no horizontal overflow at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/en/", "/en/finder/", "/en/stargazing-destinations/la-palma/"]) {
    await page.goto(path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test("destination and tour affiliate CTAs expose direct analyzer-compatible GetYourGuide links", async ({ page }) => {
  for (const path of [
    "/en/stargazing-destinations/la-palma/",
    "/en/stargazing-tours/llanos-del-jable-independent-night/",
  ]) {
    await page.goto(path);

    const links = page.locator(".affiliate-activity-card a");
    await expect(links.first()).toBeAttached();
    expect(await links.count()).toBeGreaterThan(0);

    for (const link of await links.all()) {
      const href = await link.getAttribute("href");
      expect(href).toMatch(/^https:\/\/www\.getyourguide\.com\//);
      expect(href).not.toContain("/go/getyourguide-activities/");

      const affiliateUrl = new URL(href!);
      expect(affiliateUrl.searchParams.get("partner_id")).toBe("BKWM9K1");
      expect(affiliateUrl.searchParams.get("utm_medium")).toBe("online_publisher");
      expect(affiliateUrl.searchParams.get("cmp")).toBeTruthy();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /sponsored/);
      await expect(link).toHaveAttribute("rel", /nofollow/);
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect(link).toHaveAttribute("rel", /noreferrer/);
    }
  }
});
