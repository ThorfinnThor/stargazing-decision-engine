import Link from "next/link";

import type { DestinationEditorialSource, LocationTour } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal } from "@/lib/legal/config";

function Citations({ ids, sources }: { ids: string[]; sources: Map<string, DestinationEditorialSource> }) {
  return <span className="editorial-citations">{ids.map((id) => {
    const source = sources.get(id);
    return source ? <a key={id} href={`#tour-source-${id}`} title={`${source.publisher}: ${source.title}`}>[{[...sources.keys()].indexOf(id) + 1}]</a> : null;
  })}</span>;
}

export function LocationTourContent({ tour, locale, availableSources }: { tour: LocationTour; locale: Locale; availableSources: DestinationEditorialSource[] }) {
  const isGerman = locale === "de";
  const sources = new Map(availableSources.filter((source) => tour.sourceIds.includes(source.id)).map((source) => [source.id, source]));
  return <>
    <section className="location-tour-facts" aria-label={isGerman ? "Tour auf einen Blick" : "Tour at a glance"}>
      {tour.facts.map((fact) => <div key={fact.label.en}>
        <dt>{fact.label[locale]}</dt>
        <dd>{fact.value[locale]}<Citations ids={fact.sourceIds} sources={sources} /></dd>
      </div>)}
    </section>

    <article className="location-tour-body">
      {tour.blocks.map((block) => {
        if (block.kind === "prose") return <section key={block.id} className="location-tour-prose">
          <h2>{block.heading[locale]}</h2>
          {block.paragraphs[locale].map((paragraph, index) => <p key={paragraph}>{paragraph}{index === block.paragraphs[locale].length - 1 && <Citations ids={block.sourceIds} sources={sources} />}</p>)}
        </section>;
        if (block.kind === "note") return <aside key={block.id} className={`location-tour-note location-tour-note-${block.tone}`}>
          <p className="eyebrow">{block.tone === "warning" ? isGerman ? "Grenze" : "Boundary" : block.tone === "practical" ? isGerman ? "Vor Ort" : "In the field" : isGerman ? "Einordnung" : "Context"}</p>
          <h2>{block.heading[locale]}</h2>
          <p>{block.body[locale]}<Citations ids={block.sourceIds} sources={sources} /></p>
        </aside>;
        if (block.kind === "schedule") return <section key={block.id} className="location-tour-schedule">
          <h2>{block.heading[locale]}</h2>
          {block.introduction && <p>{block.introduction[locale]}</p>}
          <ol>{block.items.map((item, index) => <li key={item.title.en}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p className="location-tour-time">{item.time[locale]}</p>
            <h3>{item.title[locale]}</h3>
            <p>{item.body[locale]}<Citations ids={item.sourceIds} sources={sources} /></p>
          </li>)}</ol>
        </section>;
        return <section key={block.id} className="location-tour-decisions">
          <h2>{block.heading[locale]}</h2>
          {block.introduction && <p>{block.introduction[locale]}</p>}
          <div>{block.items.map((item) => <article key={item.label.en}>
            <h3>{item.label[locale]}</h3>
            <p>{item.body[locale]}<Citations ids={item.sourceIds} sources={sources} /></p>
          </article>)}</div>
        </section>;
      })}
    </article>

    <footer className="location-tour-sources">
      <p className="eyebrow">{isGerman ? "Geprüfte Primärquellen" : "Reviewed primary sources"}</p>
      <h2>{isGerman ? "Zugang am Reisetag erneut prüfen" : "Recheck access on the day of travel"}</h2>
      <p>
        {isGerman ? "Redaktionell geprüft von " : "Editorially reviewed by "}
        <Link href={`${localizedLinks.about(locale)}#about-editorial-title`}>{legal.owner}</Link>
        {isGerman ? ` am ${tour.lastReviewedAt}. Buchungen, Öffnungszeiten, Torzeiten und Schutzgebietsregeln können sich ändern.` : ` on ${tour.lastReviewedAt}. Bookings, opening times, gate hours and protected-area rules can change.`}
      </p>
      <ol>{[...sources.values()].map((source) => <li key={source.id} id={`tour-source-${source.id}`}>
        <a href={source.url} rel="noreferrer">{source.publisher}: {source.title}</a>
        <span>{source.authority.replaceAll("-", " ")} · {source.checkedAt}</span>
      </li>)}</ol>
    </footer>
  </>;
}
