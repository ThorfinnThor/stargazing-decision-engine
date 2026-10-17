import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listBlogPosts, loadBlogPost, loadDestination, loadDestinations, loadImageManifest, loadSeoPage } from "@/lib/data/load";
import { localizedLinks } from "@/lib/i18n/links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildBlogPostStructuredData, buildWebPageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return listBlogPosts().map((post) => ({ locale: "en", slug: post.slug })); }

function readPost(locale: string, slug: string) {
  if (locale !== "en") return null;
  try {
    const post = loadBlogPost(slug);
    const image = loadImageManifest().destinations.find((item) => item.slug === post.heroDestinationSlug) ?? null;
    return {
      post,
      image,
      related: post.relatedDestinationSlugs.map(loadDestination),
      destinationSlugsByName: new Map(loadDestinations().map((destination) => [destination.name, destination.slug])),
      seo: loadSeoPage(`/en/blog/${slug}/`),
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = readPost(locale, slug);
  if (!resolved) return {};
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: "en",
    title: resolved.post.title,
    description: resolved.post.seoDescription,
    image: resolved.image?.localPath,
    article: {
      modifiedTime: resolved.post.lastReviewedAt,
      section: "Stargazing data journal",
      authors: ["https://stargazingindex.com/en/about/#about-editorial-title"],
    },
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const resolved = readPost(locale, slug);
  if (!resolved) notFound();
  const { post, image, related, destinationSlugsByName, seo } = resolved;
  const canonical = seo?.canonical ?? `https://stargazingindex.com/en/blog/${post.slug}/`;
  const webPageData = buildWebPageStructuredData({ name: post.title, description: post.seoDescription, url: canonical, inLanguage: "en", dateModified: post.lastReviewedAt });
  const articleData = buildBlogPostStructuredData({ post, url: canonical, image: image?.localPath ?? null });
  return <main className="event-page blog-post-page" lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }} />
    <nav className="blog-back-link"><Link href={localizedLinks.blog()}>← All data stories</Link></nav>
    <article>
      <header className="event-header blog-post-header">
        <p className="eyebrow">Data journal · {post.readingMinutes} min read</p>
        <h1>{post.title}</h1>
        <p className="lede">{post.standfirst}</p>
        <p className="blog-published">Published {post.publishedAt} · Reviewed {post.lastReviewedAt}</p>
      </header>
      {image?.status === "approved" && image.localPath ? <figure className="blog-hero-figure">
        <img src={image.localPath} alt={image.alt.en} loading="eager" decoding="async" />
        <figcaption>{image.attribution} · <a href={image.sourceUrl ?? undefined} rel="noreferrer">Source</a> · <a href={image.licenseUrl ?? undefined} rel="noreferrer">License</a></figcaption>
      </figure> : null}
      <dl className="blog-metric-grid">
        {post.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd><small>{metric.note}</small></div>)}
      </dl>
      <div className="blog-article-body">
        {post.blocks.map((block, index) => {
          if (block.kind === "prose") return <section key={block.heading} aria-labelledby={`blog-section-${index}`}><h2 id={`blog-section-${index}`}>{block.heading}</h2>{block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>;
          if (block.kind === "callout") return <aside className="blog-callout" key={block.heading}><p className="eyebrow">Decision rule</p><h2>{block.heading}</h2><p>{block.body}</p></aside>;
          return <section className="blog-data-section" key={block.heading} aria-labelledby={`blog-table-${index}`}>
            <h2 id={`blog-table-${index}`}>{block.heading}</h2><p>{block.introduction}</p>
            <div className="blog-table-scroll"><table><thead><tr>{block.columns.map((column, columnIndex) => <th scope="col" key={`${column}-${columnIndex}`}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row) => <tr key={row.join("|")}>{row.map((value, columnIndex) => { const destinationSlug = columnIndex === (block.columns[0] === "Destination" ? 0 : 1) ? destinationSlugsByName.get(value) : null; return <td key={`${value}-${columnIndex}`}>{destinationSlug ? <Link href={localizedLinks.destination("en", destinationSlug)}>{value}</Link> : value}</td>; })}</tr>)}</tbody></table></div>
            <p className="blog-table-note">{block.note}</p>
          </section>;
        })}
      </div>
      <aside className="blog-method-note">
        <p className="eyebrow">Method and limits</p>
        <h2>How this comparison was made</h2>
        <p>{post.methodologyNote}</p>
        <p><Link href={localizedLinks.methodology("en")}>Read the editorial methodology</Link> →</p>
      </aside>
      <nav className="blog-related" aria-labelledby="blog-related-title">
        <p className="eyebrow">Open the underlying guides</p><h2 id="blog-related-title">Destinations in this analysis</h2>
        <div>{related.map((destination) => <Link href={localizedLinks.destination("en", destination.slug)} key={destination.id}><strong>{destination.name}</strong><span>{destination.countryName} →</span></Link>)}</div>
      </nav>
    </article>
  </main>;
}
