"use client";

import { useState } from "react";

import { DestinationSkySection } from "./destination-sky-section";
import type { DestinationMonthlySummary, PublicAccess } from "@/lib/data/types";
import type { NightPreview, SkyLocation } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";
import { formatMonth } from "@/lib/i18n/months";
import { recommendedSiteView } from "@/lib/destination/site-recommendation";

export interface DestinationSiteView {
  site: {
    id: string;
    name: string;
    publicAccess: PublicAccess;
  };
  location: SkyLocation;
  previews: NightPreview[];
  monthly: DestinationMonthlySummary;
}

function accessLabel(access: PublicAccess, locale: Locale) {
  if (locale === "de") {
    if (access === "yes") return "Öffentlich";
    if (access === "limited") return "Eingeschränkt";
    if (access === "no") return "Nicht öffentlich";
    return "Nicht verifiziert";
  }
  if (access === "yes") return "Public";
  if (access === "limited") return "Limited";
  if (access === "no") return "Not public";
  return "Unverified";
}

export function DestinationSiteExplorer({ options, locale }: { options: DestinationSiteView[]; locale: Locale }) {
  const defaultSiteId = recommendedSiteView(options)?.site.id ?? "";
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);
  const selected = options.find((option) => option.site.id === selectedSiteId) ?? options[0];
  if (!selected) return null;
  const isGerman = locale === "de";

  return <div className="destination-site-explorer">
    <section className="event-summary destination-site-selector" aria-labelledby="destination-site-selector-title">
      <h2 id="destination-site-selector-title">{isGerman ? "Beobachtungsstandort wählen" : "Choose an observation site"}</h2>
      <p>{isGerman
        ? "Himmel und Monatswerte werden für den gewählten Standort berechnet."
        : "Sky and monthly scores are calculated for the selected site."}</p>
      <div className="site-selector-grid" role="group" aria-label={isGerman ? "Beobachtungsstandorte" : "Observation sites"}>
        {options.map((option, index) => <button
          key={option.site.id}
          type="button"
          className="site-selector-button"
          aria-pressed={option.site.id === selected.site.id}
          aria-controls="night-sky destination-months"
          onClick={() => setSelectedSiteId(option.site.id)}
        >
          <span className="site-selector-index">{String(index + 1).padStart(2, "0")}</span>
          <strong>{option.site.name}</strong>
          <span>{accessLabel(option.site.publicAccess, locale)}</span>
        </button>)}
      </div>
    </section>

    <section className="destination-sky-section" id="night-sky" aria-label={isGerman ? `Astronomischer Himmel für ${selected.site.name}` : `Astronomical sky for ${selected.site.name}`}>
      <DestinationSkySection key={selected.location.id} location={selected.location} previews={selected.previews} locale={locale} />
    </section>

    <details className="event-summary destination-data-disclosure" id="destination-months">
      <summary id="destination-months-title">
        <strong>{isGerman ? `Monatliche Werte · ${selected.site.name}` : `Monthly scores · ${selected.site.name}`}</strong>
        <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Monate anzeigen" : "Show months"}</span><span>{isGerman ? "Monate schließen" : "Close months"}</span></span>
      </summary>
      <div className="event-table-wrap">
        <table className="event-table">
          <thead><tr><th>{isGerman ? "Monat" : "Month"}</th><th>{isGerman ? "Sternbeobachtung" : "Stargazing"}</th><th>{isGerman ? "Konfidenz" : "Confidence"}</th></tr></thead>
          <tbody>{selected.monthly.months.map((month) => <tr key={month.month}><td>{formatMonth(month.month, locale)}</td><td>{month.score}</td><td>{month.confidenceLevel}</td></tr>)}</tbody>
        </table>
      </div>
    </details>

    {selected.monthly.caveats.length > 0 ? <details className="event-summary destination-data-disclosure">
      <summary id="destination-caveats-title">
        <strong>{isGerman ? "Datengrenzen" : "Data limitations"}</strong>
        <span className="content-disclosure-state" aria-hidden="true"><span>{isGerman ? "Hinweise anzeigen" : "Show limitations"}</span><span>{isGerman ? "Hinweise schließen" : "Close limitations"}</span></span>
      </summary>
      <ul>{selected.monthly.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>
    </details> : null}
  </div>;
}
