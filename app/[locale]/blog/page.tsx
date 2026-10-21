import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listBlogPosts, loadImageManifest, loadSeoPage } from "@/lib/data/load";
import { localizedLinks } from "@/lib/i18n/links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() { return [{ locale: "en" }]; }

function readPage(locale: string) {
  if (locale !== "en") return null;
  const images = loadImageManifest().destinations;
  return {
    posts: listBlogPosts().map((post) => ({ ...post, image: images.find((image) => image.slug === post.heroDestinationSlug) ?? null })),
    seo: loadSeoPage("/en/blog/"),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readPage((await params).locale);
  if (!resolved) return {};
  return buildSeoMetadata({
    seo: resolved.seo,
    locale: "en",
    title: "Stargazing data stories and field notes",
    description: "Original analyses of stargazing seasons, darkness, climate, elevation, access, and trip trade-offs using the Stargazing Index dataset.",
  });
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readPage((await params).locale);
  if (!resolved) notFound();
  const canonical = resolved.seo?.canonical ?? "https://stargazingindex.com/en/blog/";
  const structuredData = buildWebPageStructuredData({ name: resolved.seo?.title ?? "Stargazing data stories and field notes", description: resolved.seo?.description ?? "Data-led stargazing stories.", url: canonical, inLanguage: "en", dateModified: resolved.seo?.lastModified });
  return <main className="event-page blog-index-page" lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <header className="event-header blog-index-header">
      <p className="eyebrow">Data journal · English edition</p>
      <h1>Better questions for darker nights.</h1>
      <p className="lede">Original stories built from our destination, climate, darkness, elevation, and access data. Each article keeps the numbers visible, states its selection rule, and separates historical evidence from current travel conditions.</p>
    </header>
    <section className="blog-card-grid" aria-label="Articles">
      {resolved.posts.map((post, index) => <article className="blog-card" key={post.slug}>
        {post.image?.status === "approved" && post.image.localPath ? <figure><img src={post.image.localPath} alt={post.image.alt.en} loading={index === 0 ? "eager" : "lazy"} /><figcaption>{post.image.attribution} · <a href={post.image.sourceUrl ?? undefined} rel="noreferrer">Source</a> · <a href={post.image.licenseUrl ?? undefined} rel="noreferrer">License</a></figcaption></figure> : null}
        <div className="blog-card-body">
          <p className="blog-card-meta">{post.readingMinutes} min read · Reviewed {post.lastReviewedAt}</p>
          <h2><Link href={localizedLinks.blogPost(post.slug)}>{post.title}</Link></h2>
          <p>{post.standfirst}</p>
          <Link className="blog-card-link" href={localizedLinks.blogPost(post.slug)}>Read the analysis <span aria-hidden="true">→</span></Link>
        </div>
      </article>)}
    </section>
    <aside className="blog-method-note">
      <p className="eyebrow">A note on the numbers</p>
      <h2>Historical evidence, not a weather forecast.</h2>
      <p>The articles use committed data snapshots and reviewed site records. Always check current forecasts, Moon phase, closures, road conditions, and official access information before travelling.</p>
    </aside>
  </main>;
}
