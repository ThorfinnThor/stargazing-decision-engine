import Link from "next/link";
import type { ReactNode } from "react";

import type { DestinationEditorialSource, LocationTour } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal } from "@/lib/legal/config";

function Citations({ ids, sources, sourceNumbers }: { ids: string[]; sources: Map<string, DestinationEditorialSource>; sourceNumbers: Map<string, number> }) {
  return <span className="editorial-citations">{ids.map((id) => {
    const source = sources.get(id);
    return source ? <a key={id} href={`#tour-source-${id}`} title={`${source.publisher}: ${source.title}`}>[{sourceNumbers.get(id)}]</a> : null;
  })}</span>;
}

export function LocationTourContent({ tour, locale, availableSources, activityModules }: { tour: LocationTour; locale: Locale; availableSources: DestinationEditorialSource[]; activityModules?: ReactNode }) {
  const isGerman = locale === "de";
  const sources = new Map(availableSources.filter((source) => tour.sourceIds.includes(source.id)).map((source) => [source.id, source]));
  const sourceNumbers = new Map([...sources.keys()].map((id, index) => [id, index + 1]));
  return <>
    <nav className="location-tour-section-nav" aria-label={isGerman ? "Inhalt dieses Nachtplans" : "Night plan contents"}>
      <a href="#tour-overview">{isGerman ? "Auf einen Blick" : "At a glance"}</a><a href="#tour-plan">{isGerman ? "Ablauf und Entscheidungen" : "Plan and decisions"}</a><a href="#tour-activities">{isGerman ? "Buchbare Aktivitäten" : "Bookable activities"}</a><a href="#tour-sources">{isGerman ? "Quellen" : "Sources"}</a>
    </nav>
    <section className="location-tour-overview" id="tour-overview" aria-labelledby="tour-overview-title">
      <div><p className="eyebrow">{isGerman ? "Die praktische Antwort" : "The practical answer"}</p><h2 id="tour-overview-title">{isGerman ? "Auf einen Blick" : "At a glance"}</h2><p>{isGerman ? "Die wichtigsten Angaben für Anfahrt, Zugang und Vorbereitung, bevor der ausführliche Nachtplan beginnt." : "The essential access, arrival, and preparation details before the full night plan begins."}</p></div>
    <dl className="location-tour-facts" aria-label={isGerman ? "Tour auf einen Blick" : "Tour at a glance"}>
      {tour.facts.map((fact) => <div key={fact.label.en}>
        <dt>{fact.label[locale]}</dt>
        <dd>{fact.value[locale]}<Citations ids={fact.sourceIds} sources={sources} sourceNumbers={sourceNumbers} /></dd>
      </div>)}
    </dl>
    </section>

    {activityModules ? <div id="tour-activities" className="location-tour-activities">{activityModules}</div> : null}

    <article className="location-tour-body" id="tour-plan">
      {tour.blocks.map((block, blockIndex) => <details className={`location-tour-block location-tour-block-${block.kind}`} key={block.id}>
        <summary>
          <span className="location-tour-block-number">{String(blockIndex + 1).padStart(2, "0")}</span>
          <strong>{block.heading[locale]}</strong>
          <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Öffnen" : "Open"}</span><span>{isGerman ? "Schließen" : "Close"}</span></span>
        </summary>
        {block.kind === "prose" ? <section className="location-tour-prose">
          <h2 className="sr-only">{block.heading[locale]}</h2>
          {block.paragraphs[locale].map((paragraph, index) => <p key={paragraph}>{paragraph}{index === block.paragraphs[locale].length - 1 && <Citations ids={block.sourceIds} sources={sources} sourceNumbers={sourceNumbers} />}</p>)}
        </section> : block.kind === "note" ? <aside className={`location-tour-note location-tour-note-${block.tone}`}>
          <p className="eyebrow">{block.tone === "warning" ? isGerman ? "Grenze" : "Boundary" : block.tone === "practical" ? isGerman ? "Vor Ort" : "In the field" : isGerman ? "Einordnung" : "Context"}</p>
          <h2 className="sr-only">{block.heading[locale]}</h2>
          <p>{block.body[locale]}<Citations ids={block.sourceIds} sources={sources} sourceNumbers={sourceNumbers} /></p>
        </aside> : block.kind === "schedule" ? <section className="location-tour-schedule">
          <h2 className="sr-only">{block.heading[locale]}</h2>
          {block.introduction && <p>{block.introduction[locale]}</p>}
          <ol>{block.items.map((item, index) => <li key={item.title.en}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p className="location-tour-time">{item.time[locale]}</p>
            <h3>{item.title[locale]}</h3>
            <p>{item.body[locale]}<Citations ids={item.sourceIds} sources={sources} sourceNumbers={sourceNumbers} /></p>
          </li>)}</ol>
        </section> : <section className="location-tour-decisions">
          <h2 className="sr-only">{block.heading[locale]}</h2>
          {block.introduction && <p>{block.introduction[locale]}</p>}
          <div>{block.items.map((item) => <article key={item.label.en}>
            <h3>{item.label[locale]}</h3>
            <p>{item.body[locale]}<Citations ids={item.sourceIds} sources={sources} sourceNumbers={sourceNumbers} /></p>
          </article>)}</div>
        </section>}
      </details>)}
    </article>

    <details className="location-tour-sources" id="tour-sources">
      <summary>
        <span><span className="eyebrow">{isGerman ? "Geprüfte Primärquellen" : "Reviewed primary sources"}</span><strong>{isGerman ? "Zugang am Reisetag erneut prüfen" : "Recheck access on the day of travel"}</strong></span>
        <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Quellen anzeigen" : "Show sources"}</span><span>{isGerman ? "Quellen schließen" : "Close sources"}</span></span>
      </summary>
      <div className="location-tour-sources-content">
        <p>
          {isGerman ? "Redaktionell geprüft von " : "Editorially reviewed by "}
          <Link href={`${localizedLinks.about(locale)}#about-editorial-title`}>{legal.owner}</Link>
          {isGerman ? ` am ${tour.lastReviewedAt}. Buchungen, Öffnungszeiten, Torzeiten und Schutzgebietsregeln können sich ändern.` : ` on ${tour.lastReviewedAt}. Bookings, opening times, gate hours and protected-area rules can change.`}
        </p>
        <ol>{[...sources.values()].map((source) => <li key={source.id} id={`tour-source-${source.id}`}>
          <a href={source.url} rel="noreferrer">{source.publisher}: {source.title}</a>
          <span>{source.authority.replaceAll("-", " ")} · {source.checkedAt}</span>
        </li>)}</ol>
      </div>
    </details>
  </>;
}
