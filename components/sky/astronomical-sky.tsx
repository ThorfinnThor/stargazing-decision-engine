"use client";

import Link from "next/link";
import { useMemo } from "react";

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
  const result = useMemo(() => {
    try { return { snapshot: computeSky(props.location, props.instantIso), error: null }; }
    catch (error) { return { snapshot: null, error: error instanceof Error ? error.message : "Sky unavailable" }; }
  }, [props.location, props.instantIso]);
  if (!result.snapshot) return <div className="sky-unavailable" role="status">{props.locale === "de" ? "Astronomische Simulation nicht verfügbar." : "Astronomical simulation unavailable."}</div>;
  const snapshot = result.snapshot;
  const localTime = formatSkyLocalTime(props.locale, props.location.timeZone, props.instantIso);
  const percent = Math.round(snapshot.moon.illuminatedFraction * 100);
  const modeLabel = props.mode === "live-night" ? props.locale === "de" ? "Live-Himmel" : "Live sky" : props.locale === "de" ? "Nachtvorschau" : "Night preview";
  const disclaimer = props.locale === "de"
    ? "Ideale Sternsicht bis Magnitude 6; lokale Lichtverschmutzung, Wetter und Horizontabschattungen sind nicht berücksichtigt."
    : "Ideal magnitude-6 star depth; local light pollution, weather, and horizon obstructions are not included.";
  const summary = props.locale === "de"
    ? `${props.mode === "live-night" ? "Live-Astronomiesimulation" : "Astronomische Nachtvorschau"} des Himmels über ${props.location.label} um ${localTime} Ortszeit. Der Mond ist zu ${percent} Prozent beleuchtet und befindet sich ${snapshot.moon.aboveHorizon ? "über" : "unter"} dem Horizont. ${disclaimer}`
    : `${props.mode === "live-night" ? "Live astronomical simulation" : "Astronomical night preview"} of the sky over ${props.location.label} at ${localTime} local time. The Moon is ${percent} percent illuminated and is ${snapshot.moon.aboveHorizon ? "above" : "below"} the horizon. ${disclaimer}`;
  return <figure className={`astronomical-sky astronomical-sky-${props.variant}`} data-location-id={props.location.id} data-site-id={props.location.siteId} data-mode={props.mode} data-instant={props.instantIso}>
    <SkyCanvas snapshot={snapshot} variant={props.variant} />
    <figcaption className="sky-caption">
      <span className="sky-mode">{modeLabel}</span>
      <strong>{props.location.destinationName}</strong>
      <span>{props.location.siteName} · {localTime}</span>
      <span>{statusCopy[props.locale][snapshot.skyCondition]} · {snapshot.stars.length} {props.locale === "de" ? "sichtbare Katalogsterne" : "visible catalog stars"}</span>
      {props.destinationHref && <Link href={props.destinationHref}>{props.locale === "de" ? "Location ansehen →" : "View location →"}</Link>}
      <small>{disclaimer}</small>
    </figcaption>
    <p className="sr-only">{summary}</p>
  </figure>;
}
