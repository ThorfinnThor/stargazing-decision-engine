"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildConstellationSummaries } from "@/lib/astronomy/constellation-summary";
import { computeSky } from "@/lib/astronomy/compute-sky";
import type { Locale } from "@/lib/i18n/config";
import type { SkyLocation } from "@/lib/astronomy/types";
import { formatSkyLocalTime } from "@/lib/astronomy/time";
import { SkyCanvas } from "./sky-canvas";

const statusCopy = {
  en: { daylight: "Daylight", "civil-twilight": "Civil twilight", "nautical-twilight": "Nautical twilight", "astronomical-twilight": "Astronomical twilight", night: "Astronomical night" },
  de: { daylight: "Tageslicht", "civil-twilight": "Bürgerliche Dämmerung", "nautical-twilight": "Nautische Dämmerung", "astronomical-twilight": "Astronomische Dämmerung", night: "Astronomische Nacht" },
} as const;

export function AstronomicalSky(props: {
  location: SkyLocation;
  instantIso: string;
  mode: "live-night" | "night-preview";
  locale: Locale;
  variant: "homepage" | "destination";
  destinationHref?: string;
}) {
  const [showConstellations, setShowConstellations] = useState(true);
  const [activeConstellationId, setActiveConstellationId] = useState<string | null>(null);
  const result = useMemo(() => {
    try { return { snapshot: computeSky(props.location, props.instantIso), error: null }; }
    catch (error) { return { snapshot: null, error: error instanceof Error ? error.message : "Sky unavailable" }; }
  }, [props.location, props.instantIso]);
  if (!result.snapshot) return <div className="sky-unavailable" role="status">{props.locale === "de" ? "Astronomische Simulation nicht verfügbar." : "Astronomical simulation unavailable."}</div>;
  const snapshot = result.snapshot;
  const localTime = formatSkyLocalTime(props.locale, props.location.timeZone, props.instantIso);
  const allConstellationSummaries = buildConstellationSummaries(snapshot.constellations, props.locale, snapshot.constellations.length, props.variant === "destination");
  const recognizableConstellationSummaries = allConstellationSummaries.filter((item) => item.visibilityState === "recognizable");
  const constellationSummaries = recognizableConstellationSummaries.slice(0, 3);
  const featuredConstellationIds = new Set(constellationSummaries.map((item) => item.constellationId));
  const additionalConstellationSummaries = allConstellationSummaries.filter((item) => !featuredConstellationIds.has(item.constellationId));
  const partlyVisibleConstellationSummaries = allConstellationSummaries.filter((item) => item.visibilityState === "partly-visible");
  const percent = Math.round(snapshot.moon.illuminatedFraction * 100);
  const modeLabel = props.mode === "live-night" ? props.locale === "de" ? "Live-Himmel" : "Live sky" : props.locale === "de" ? "Nachtvorschau" : "Night preview";
  const disclaimer = props.locale === "de"
    ? "Ideale Sternsicht bis Magnitude 6; lokale Lichtverschmutzung, Wetter und Horizontabschattungen sind nicht berücksichtigt."
    : "Ideal magnitude-6 star depth; local light pollution, weather, and horizon obstructions are not included.";
  const summary = props.locale === "de"
    ? `${props.mode === "live-night" ? "Live-Astronomiesimulation" : "Astronomische Nachtvorschau"} des Himmels über ${props.location.label} um ${localTime} Ortszeit. Der Mond ist zu ${percent} Prozent beleuchtet und befindet sich ${snapshot.moon.aboveHorizon ? "über" : "unter"} dem Horizont. ${recognizableConstellationSummaries.length ? `Erkennbare westliche Sternbilder: ${recognizableConstellationSummaries.map((item) => item.name).join(", ")}.` : "Keine vollständige westliche Sternbildfigur ist ausreichend prominent."} ${partlyVisibleConstellationSummaries.length ? `Teilweise sichtbare Figuren: ${partlyVisibleConstellationSummaries.map((item) => item.name).join(", ")}.` : ""} ${disclaimer}`
    : `${props.mode === "live-night" ? "Live astronomical simulation" : "Astronomical night preview"} of the sky over ${props.location.label} at ${localTime} local time. The Moon is ${percent} percent illuminated and is ${snapshot.moon.aboveHorizon ? "above" : "below"} the horizon. ${recognizableConstellationSummaries.length ? `Recognizable Western constellations: ${recognizableConstellationSummaries.map((item) => item.name).join(", ")}.` : "No complete Western constellation figure is sufficiently prominent."} ${partlyVisibleConstellationSummaries.length ? `Partly visible figures: ${partlyVisibleConstellationSummaries.map((item) => item.name).join(", ")}.` : ""} ${disclaimer}`;
  return <figure className={`astronomical-sky astronomical-sky-${props.variant}`} data-location-id={props.location.id} data-site-id={props.location.siteId} data-mode={props.mode} data-instant={props.instantIso}>
    <SkyCanvas snapshot={snapshot} variant={props.variant} locale={props.locale} showConstellations={showConstellations} activeConstellationId={activeConstellationId} />
    <div className="sky-details">
      <div className="sky-caption">
        <span className="sky-mode">{modeLabel}</span>
        <strong>{props.location.destinationName}</strong>
        <span>{props.location.siteName} · {localTime}</span>
        <span>{statusCopy[props.locale][snapshot.skyCondition]} · {snapshot.stars.length} {props.locale === "de" ? "sichtbare Katalogsterne" : "visible catalog stars"}</span>
        <span className="sky-moon-status">{props.locale === "de"
          ? `Mond ${snapshot.moon.aboveHorizon ? "über" : "unter"} dem Horizont · ${percent} % beleuchtet`
          : `Moon ${snapshot.moon.aboveHorizon ? "above" : "below"} the horizon · ${percent}% illuminated`}</span>
        {props.variant === "homepage" && constellationSummaries.length > 0 ? <span className="sky-featured-names">{props.locale === "de" ? "Sternbilder" : "Constellations"}: {constellationSummaries.slice(0, 2).map((item) => item.name).join(" · ")}</span> : null}
        {props.destinationHref && <Link href={props.destinationHref}>{props.locale === "de" ? "Location ansehen →" : "View location →"}</Link>}
        <small>{disclaimer}</small>
        <small className="sky-culture-note">{props.locale === "de" ? "Sternbildlinien · westliche Himmelskultur" : "Constellation lines · Western sky culture"} · <a href="https://github.com/Stellarium/stellarium-skycultures/tree/014fbb5e59233d133c22f9811af96b67d05a95c9/western" target="_blank" rel="noreferrer">Stellarium, CC BY-SA 4.0</a></small>
      </div>
      {props.variant === "destination" ? <div className="constellation-panel">
        <button className="constellation-toggle" type="button" aria-pressed={showConstellations} onClick={() => setShowConstellations((visible) => !visible)}>
          <span aria-hidden="true" className="constellation-toggle-mark" />
          {props.locale === "de" ? "Sternbilder anzeigen" : "Show constellations"}
        </button>
        <section className="constellation-summary" aria-labelledby={`constellation-summary-${props.location.id}`}>
          <h3 id={`constellation-summary-${props.location.id}`}>{props.locale === "de" ? "Was du siehst" : "What you can see"}</h3>
          {constellationSummaries.length > 0 ? <div className="constellation-summary-grid">{constellationSummaries.map((item) => <button
            type="button"
            key={item.constellationId}
            className="constellation-summary-card"
            aria-pressed={activeConstellationId === item.constellationId}
            onClick={() => setActiveConstellationId(item.constellationId)}
            onFocus={() => setActiveConstellationId(item.constellationId)}
          >
            <strong>{item.name}</strong>
            <span>{item.directionLabel} · {item.altitudeLabel}</span>
            <span>{item.recognitionHint}</span>
            <small>{item.shortDescription}</small>
          </button>)}</div> : <p className="constellation-empty">{props.locale === "de"
            ? "Für diesen Zeitpunkt ist keine vollständige Sternbildfigur ausreichend deutlich über dem Horizont. Einzelne Sterne oder Teilformen können dennoch sichtbar sein."
            : "No complete constellation figure is sufficiently prominent above the horizon at this time. Individual stars or partial patterns may still be visible."}</p>}
          {additionalConstellationSummaries.length > 0 ? <div className="constellation-secondary">
            <h4>{props.locale === "de" ? "Außerdem am Himmel" : "Also in the sky"}</h4>
            <p>{props.locale === "de"
              ? "Alle weiteren oben gezeichneten Figuren; teilweise sichtbare Formen sind entsprechend markiert."
              : "Every other figure drawn above; partial shapes are marked accordingly."}</p>
            <div className="constellation-secondary-grid">{additionalConstellationSummaries.map((item) => <button
              type="button"
              key={item.constellationId}
              className="constellation-secondary-card"
              aria-pressed={activeConstellationId === item.constellationId}
              onClick={() => setActiveConstellationId(item.constellationId)}
              onFocus={() => setActiveConstellationId(item.constellationId)}
            >
              <strong>{item.name}</strong>
              <span>{item.visibilityState === "recognizable"
                ? props.locale === "de" ? "erkennbar" : "recognizable"
                : props.locale === "de" ? "teilweise sichtbar" : "partly visible"} · {item.directionLabel} · {item.altitudeLabel}</span>
            </button>)}</div>
          </div> : null}
          {snapshot.skyCondition === "daylight" ? <p className="constellation-daylight-note">{props.locale === "de" ? "Sterne können astronomisch über dem Horizont liegen, sind im hellen Himmel aber nicht sichtbar." : "Stars may be astronomically above the horizon, but they are not visible in the bright sky."}</p> : null}
        </section>
      </div> : null}
      <p className="sr-only">{summary}</p>
    </div>
  </figure>;
}
