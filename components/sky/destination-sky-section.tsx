"use client";

import { useEffect, useState } from "react";

import { AstronomicalSky } from "./astronomical-sky";
import { NightPlanningPanel } from "./night-planning-panel";
import { findNextAstronomicalNight, selectInitialDestinationSky } from "@/lib/astronomy/next-night";
import { roundedCurrentMinuteIso } from "@/lib/astronomy/selection";
import { resolveDestinationPreview } from "@/lib/astronomy/previews";
import type { DestinationNightContext, NightPreview, SkyLocation } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";

export function DestinationSkySection({ location, previews, locale }: { location: SkyLocation; previews: NightPreview[]; locale: Locale }) {
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<NightPreview | null>(null);
  const [nextNightInstant, setNextNightInstant] = useState<string | null>(null);
  const [liveInstant, setLiveInstant] = useState(roundedCurrentMinuteIso(0));
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const linkedPreview = resolveDestinationPreview({ previewId: search.get("skyPreview"), previews, location });
    const nowIso = roundedCurrentMinuteIso();
    const initialSelection = linkedPreview ? null : selectInitialDestinationSky(location, nowIso);
    setPreview(linkedPreview);
    setLiveInstant(nowIso);
    setNextNightInstant(initialSelection?.mode === "night-preview" ? initialSelection.instantIso : null);
    setReady(true);
  }, [location, previews]);
  useEffect(() => {
    if (!ready || preview) return;
    const refresh = () => {
      const nowIso = roundedCurrentMinuteIso();
      setLiveInstant(nowIso);
    };
    const delay = 60_000 - (Date.now() % 60_000) + 25;
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => { refresh(); interval = setInterval(refresh, 60_000); }, delay);
    const visibility = () => { if (document.visibilityState === "visible") refresh(); };
    const restore = () => refresh();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", restore);
    window.addEventListener("focus", restore);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("focus", restore);
    };
  }, [preview, ready]);
  if (!ready) return <div className="sky-loading" role="status">{locale === "de" ? "Astronomischer Himmel wird berechnet …" : "Calculating astronomical sky …"}</div>;
  const showLive = () => {
    const nowIso = roundedCurrentMinuteIso();
    const url = new URL(window.location.href); url.searchParams.delete("skyPreview"); url.hash = "night-sky"; window.history.replaceState(null, "", url);
    setLiveInstant(nowIso);
    setPreview(null);
    setNextNightInstant(null);
  };
  const showNextNight = () => {
    const nowIso = roundedCurrentMinuteIso();
    const nextNight = findNextAstronomicalNight(location, nowIso);
    const url = new URL(window.location.href); url.searchParams.delete("skyPreview"); url.hash = "night-sky"; window.history.replaceState(null, "", url);
    setLiveInstant(nowIso); setPreview(null); setNextNightInstant(nextNight?.instantIso ?? previews[0]?.instantIso ?? null);
  };
  const previewInstant = nextNightInstant ?? preview?.instantIso ?? null;
  const context: DestinationNightContext = {
    mode: previewInstant ? "night-preview" : "live-night",
    source: nextNightInstant ? "next-night" : preview ? "linked-preview" : "live",
    instantIso: previewInstant ?? liveInstant,
  };
  return <div className="destination-sky-shell">
    <AstronomicalSky location={location} instantIso={context.instantIso} mode={context.mode} locale={locale} variant="destination" />
    <div className="sky-actions">
      {previewInstant
        ? <button type="button" onClick={showLive}>{locale === "de" ? "Zum Live-Himmel" : "Show live sky"}</button>
      : <button type="button" onClick={showNextNight}>{locale === "de" ? "Nächste Nacht anzeigen" : "Show next night"}</button>}
    </div>
    <NightPlanningPanel key={`${location.id}-${context.mode}`} location={location} context={context} currentInstantIso={liveInstant} locale={locale} />
  </div>;
}
