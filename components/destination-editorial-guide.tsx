import Link from "next/link";

import type { DestinationEditorialGuide, DestinationEditorialSource } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { legal } from "@/lib/legal/config";

function SourceLinks({ ids, sources, locale }: { ids: string[]; sources: Map<string, DestinationEditorialSource>; locale: Locale }) {
  return (
    <span className="editorial-citations" aria-label={locale === "de" ? "Quellen" : "Sources"}>
      {ids.map((id) => {
        const source = sources.get(id);
        if (!source) return null;
        return <a key={id} href={`#source-${id}`} title={`${source.publisher}: ${source.title}`}>[{[...sources.keys()].indexOf(id) + 1}]</a>;
      })}
    </span>
  );
}

export function DestinationEditorialGuideView({ guide, locale }: { guide: DestinationEditorialGuide; locale: Locale }) {
  const sources = new Map(guide.sources.map((source) => [source.id, source]));
  const isGerman = locale === "de";
  return (
    <article className="destination-editorial" aria-labelledby="destination-editorial-title">
      <header className="destination-editorial-intro">
        <p className="eyebrow">{isGerman ? "Vor Ort planen" : "Field guide"}</p>
        <h2 id="destination-editorial-title">{guide.seoTitle[locale]}</h2>
        <p className="destination-editorial-angle">{guide.editorialAngle[locale]}</p>
      </header>

      <div className="destination-editorial-sections">
        {guide.sections.map((section, index) => (
          <section key={section.id} aria-labelledby={`guide-${section.id}`}>
            <span className="editorial-section-number">{String(index + 1).padStart(2, "0")}</span>
            <h3 id={`guide-${section.id}`}>{section.heading[locale]}</h3>
            {section.paragraphs[locale].map((paragraph, paragraphIndex) => (
              <p key={paragraph}>{paragraph}{paragraphIndex === section.paragraphs[locale].length - 1 && <SourceLinks ids={section.sourceIds} sources={sources} locale={locale} />}</p>
            ))}
          </section>
        ))}
      </div>

      <section className="destination-tour" aria-labelledby="destination-tour-title">
        <div className="destination-tour-heading">
          <p className="eyebrow">{isGerman ? "Eigenständige Nachtroute" : "Independent night route"}</p>
          <h2 id="destination-tour-title">{guide.tour.title[locale]}</h2>
          <p>{guide.tour.summary[locale]}<SourceLinks ids={guide.tour.sourceIds} sources={sources} locale={locale} /></p>
          <dl>
            <div><dt>{isGerman ? "Dauer" : "Duration"}</dt><dd>{guide.tour.duration[locale]}</dd></div>
            <div><dt>{isGerman ? "Geeignet für" : "Suitable for"}</dt><dd>{guide.tour.suitability[locale]}</dd></div>
          </dl>
        </div>
        <ol className="destination-tour-steps">
          {guide.tour.steps.map((step, index) => (
            <li key={step.id}>
              <span className="editorial-section-number">{String(index + 1).padStart(2, "0")}</span>
              <p className="destination-tour-time">{step.timeHint[locale]}</p>
              <h3>{step.title[locale]}</h3>
              <p>{step.body[locale]}<SourceLinks ids={step.sourceIds} sources={sources} locale={locale} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section className="destination-field-notes" aria-labelledby="destination-field-notes-title">
        <div>
          <p className="eyebrow">{isGerman ? "Vor Ort" : "In the field"}</p>
          <h2 id="destination-field-notes-title">{guide.fieldNotesTitle[locale]}</h2>
        </div>
        <div className="destination-field-note-grid">
          {guide.fieldNotes.map((note) => (
            <article key={note.id}>
              <h3>{note.title[locale]}</h3>
              <p>{note.body[locale]}<SourceLinks ids={note.sourceIds} sources={sources} locale={locale} /></p>
            </article>
          ))}
        </div>
      </section>

      <section className="destination-faq" aria-labelledby="destination-faq-title">
        <p className="eyebrow">{isGerman ? "Praktische Fragen" : "Practical questions"}</p>
        <h2 id="destination-faq-title">{isGerman ? "Vor der Fahrt wissen" : "Know before you go"}</h2>
        {guide.faq.map((item) => (
          <details key={item.question.en}>
            <summary>{item.question[locale]}</summary>
            <p>{item.answer[locale]}<SourceLinks ids={item.sourceIds} sources={sources} locale={locale} /></p>
          </details>
        ))}
      </section>

      <footer className="destination-editorial-sources">
        <div>
          <p className="eyebrow">{isGerman ? "Primärquellen" : "Primary sources"}</p>
          <h2>{isGerman ? "Geprüfte Informationen" : "Reviewed information"}</h2>
          <p>
            {isGerman ? "Redaktionell geprüft von " : "Editorially reviewed by "}
            <Link href={`${localizedLinks.about(locale)}#about-editorial-title`}>{legal.owner}</Link>
            {isGerman ? ` am ${guide.lastReviewedAt}. Zugang, Öffnungszeiten und Schutzgebietsregeln können sich ändern; prüfe die verlinkten Originalquellen am Reisetag.` : ` on ${guide.lastReviewedAt}. Access, operating hours and protected-area rules can change; recheck the linked originals on the day of travel.`}
          </p>
        </div>
        <ol>
          {guide.sources.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
              <a href={source.url} rel="noreferrer">{source.publisher}: {source.title}</a>
              <span>{source.authority.replaceAll("-", " ")} · {source.checkedAt}</span>
            </li>
          ))}
        </ol>
      </footer>
    </article>
  );
}
