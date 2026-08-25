"use client";

import { useEffect, useState } from "react";

import { AstronomicalSky } from "./astronomical-sky";
import { findNextAstronomicalNight, isAstronomicalNight, selectInitialDestinationSky } from "@/lib/astronomy/next-night";
import { roundedCurrentMinuteIso } from "@/lib/astronomy/selection";
import { resolveDestinationPreview } from "@/lib/astronomy/previews";
import type { NightPreview, SkyLocation } from "@/lib/astronomy/types";
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
    setPreview(linkedPreview);
    setLiveInstant(nowIso);
    if (linkedPreview) {
      setNextNightInstant(null);
    } else {
      const initial = selectInitialDestinationSky(location, nowIso);
      setNextNightInstant(initial.mode === "night-preview" ? initial.instantIso : null);
    }
    setReady(true);
  }, [location, previews]);
  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      const nowIso = roundedCurrentMinuteIso();
      setLiveInstant(nowIso);
      if (!preview && !nextNightInstant) {
        const selection = selectInitialDestinationSky(location, nowIso);
        if (selection.mode === "night-preview") setNextNightInstant(selection.instantIso);
      }
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
  }, [location, nextNightInstant, preview, ready]);
  if (!ready) return <div className="sky-loading" role="status">{locale === "de" ? "Astronomischer Himmel wird berechnet …" : "Calculating astronomical sky …"}</div>;
  const showLive = () => {
    const nowIso = roundedCurrentMinuteIso();
    const selection = selectInitialDestinationSky(location, nowIso);
    const url = new URL(window.location.href); url.searchParams.delete("skyPreview"); url.hash = "night-sky"; window.history.replaceState(null, "", url);
    setLiveInstant(nowIso);
    setPreview(null);
    setNextNightInstant(selection.mode === "night-preview" ? selection.instantIso : null);
  };
  const showNextNight = () => {
    const nowIso = roundedCurrentMinuteIso();
    const nextNight = findNextAstronomicalNight(location, nowIso);
    const url = new URL(window.location.href); url.searchParams.delete("skyPreview"); url.hash = "night-sky"; window.history.replaceState(null, "", url);
    setLiveInstant(nowIso); setPreview(null); setNextNightInstant(nextNight?.instantIso ?? previews[0]?.instantIso ?? null);
  };
  const previewInstant = nextNightInstant ?? preview?.instantIso ?? null;
  const liveSkyAvailable = isAstronomicalNight(location, liveInstant);
  return <div className="destination-sky-shell">
    <AstronomicalSky location={location} instantIso={previewInstant ?? liveInstant} mode={previewInstant ? "night-preview" : "live-night"} locale={locale} variant="destination" />
    <div className="sky-actions">
      {previewInstant ? liveSkyAvailable
        ? <button type="button" onClick={showLive}>{locale === "de" ? "Zum Live-Himmel" : "Show live sky"}</button>
        : <p className="sky-action-note">{locale === "de" ? "Vor Ort ist es gerade hell oder dämmrig; deshalb wird die nächste astronomische Nacht gezeigt." : "It is currently daylight or twilight on site, so the next astronomical night is shown."}</p>
        : <button type="button" onClick={showNextNight}>{locale === "de" ? "Nächste Nacht anzeigen" : "Show next night"}</button>}
    </div>
  </div>;
}
