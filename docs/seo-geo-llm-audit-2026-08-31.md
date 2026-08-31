# SEO, generative-search, and LLM discovery audit — 2026-08-31

## Outcome

The site already has the foundations required for conventional and generative
search: static HTML, canonical URLs, reciprocal language alternates, a filtered
XML sitemap, crawlable internal links, visible primary-source citations,
indexability gates, structured data, and a curated `llms.txt`. Google explicitly
states that its AI search features have no separate technical eligibility layer
beyond ordinary Search eligibility and useful, crawlable, people-first content.

This change therefore avoids speculative “AI schema” or keyword variants. It
strengthens signals that are useful to people and supported by current search
documentation:

- Destination guides, location tours, and gear guides now use Article Open Graph
  metadata with their actual review date and editorial section.
- Article structured data identifies the visible responsible editor and
  publisher, marks the content as freely accessible, preserves citations, and
  includes an approved destination image when one exists.
- The same editor and review date are visible beside the sources on every
  destination guide and location tour, and in every gear-guide footer.
- `Claude-SearchBot` and `Claude-User` are explicitly allowed alongside
  `OAI-SearchBot` and `ChatGPT-User`. Training crawlers remain governed by the
  existing Cloudflare content policy, which currently permits search/reference
  use while disallowing training.
- `llms.txt` now tells retrieval systems which page type answers which question,
  identifies editorial responsibility, and directs freshness-sensitive answers
  to the cited primary sources.
- The checked-in SEO brand name now matches the public name, Stargazing Index.

## Current discovery status

On 2026-08-31 the production origin returned HTTP 200 for the English homepage,
`robots.txt`, `sitemap.xml`, and `llms.txt`. Canonicals, alternates, metadata,
structured data, and the approved La Palma image were present in the exported
HTML. A public `site:stargazingindex.com` search returned no results. That search
is not a definitive index report; Google Search Console is required to confirm
the real crawl and indexing state.

## Manual launch actions

### P0 — Google Search Console

1. Add `stargazingindex.com` as a Domain property.
2. Verify it with the DNS TXT record Google provides.
3. Submit `https://stargazingindex.com/sitemap.xml` in **Sitemaps**.
4. Inspect the English homepage and one destination URL with **URL inspection**,
   then request indexing if Google reports that either is unknown.
5. Review **Page indexing**, **Core Web Vitals**, and **Enhancements** after Google
   has processed the sitemap. Indexing can take time and is never guaranteed.

### P0 — Cloudflare crawl delivery

1. Open the `stargazingindex.com` zone.
2. Go to **Caching → Configuration** and enable **Crawler Hints**. Cloudflare will
   use cache-change signals and IndexNow rather than requiring a repository key
   or a custom submission workflow.
3. Go to **Security → Settings → Configure AI bot policies**. Keep **Search** on
   **Allow**. Allow **Agent** if user-requested retrieval from assistants should
   work. Keep **Training** blocked unless the publisher deliberately changes that
   policy.
4. In **AI Crawl Control**, confirm that `OAI-SearchBot`, `ChatGPT-User`,
   `Claude-SearchBot`, and `Claude-User` are not overridden by a block rule.

### P1 — Bing Webmaster Tools

Import the verified property from Google Search Console or verify it directly,
submit the same sitemap, and use URL Inspection on the homepage and a destination
guide. Cloudflare Crawler Hints supplies IndexNow notifications automatically,
so a second checked-in IndexNow client would be redundant.

## Remaining product and operations backlog

1. **Indexing evidence:** record Search Console and Bing coverage after the first
   crawl, then fix only reported canonical, rendering, mobile, or structured-data
   errors.
2. **Query evidence:** use Search Console queries and landing pages to decide
   which existing guides need clearer answers. Do not generate near-duplicate
   pages for speculative keyword variants.
3. **Source freshness:** recheck time-sensitive access rules, bookings, closures,
   and gear specifications on the dates displayed by each guide.
4. **Observation-site media:** the 50 destination images are approved and live;
   the 100 observation-site records still have publication-blocked placeholders.
   Promote a site image only after local WebP creation and complete approved
   licence provenance. These images are not currently required by the rendered
   destination pages.
5. **Infrastructure inventory:** obsolete deployments or aliases still cannot be
   deleted safely without an external inventory of Cloudflare projects, DNS,
   aliases, build hooks, and rollback requirements.

## Primary references

- Google Search Central, “AI features and your website”:
  https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central, “Optimizing your website for generative AI features”:
  https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central, “Article structured data”:
  https://developers.google.com/search/docs/appearance/structured-data/article
- OpenAI, “Publishers and Developers FAQ”:
  https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Anthropic, crawler controls:
  https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Cloudflare, “Crawler Hints”:
  https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/
- Bing Webmaster Tools, “IndexNow”:
  https://www.bing.com/webmasters/help/indexnow-0z209wby
