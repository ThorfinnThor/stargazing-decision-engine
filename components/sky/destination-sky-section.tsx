"use client";

import { useEffect, useState } from "react";

import { AstronomicalSky } from "./astronomical-sky";
import { roundedCurrentMinuteIso } from "@/lib/astronomy/selection";
import { resolveDestinationPreview } from "@/lib/astronomy/previews";
import type { NightPreview, SkyLocation } from "@/lib/astronomy/types";
import { shouldScheduleSkyRefresh } from "@/lib/astronomy/time";
import type { Locale } from "@/lib/i18n/config";

export function DestinationSkySection({ location, previews, locale }: { location: SkyLocation; previews: NightPreview[]; locale: Locale }) {
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<NightPreview | null>(null);
  const [liveInstant, setLiveInstant] = useState(roundedCurrentMinuteIso(0));
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setPreview(resolveDestinationPreview({ previewId: search.get("skyPreview"), previews, location }));
    setLiveInstant(roundedCurrentMinuteIso());
    setReady(true);
  }, [location, previews]);
  useEffect(() => {
    if (!ready || !shouldScheduleSkyRefresh(preview ? "night-preview" : "live-night")) return;
    const refresh = () => setLiveInstant(roundedCurrentMinuteIso());
    const delay = 60_000 - (Date.now() % 60_000) + 25;
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => { refresh(); interval = setInterval(refresh, 60_000); }, delay);
    const visibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); document.removeEventListener("visibilitychange", visibility); };
  }, [preview, ready]);
  if (!ready) return <div className="sky-loading" role="status">{locale === "de" ? "Astronomischer Himmel wird berechnet …" : "Calculating astronomical sky …"}</div>;
  const showPreview = (next: NightPreview) => {
    const url = new URL(window.location.href); url.searchParams.set("skyPreview", next.id); url.hash = "night-sky"; window.history.replaceState(null, "", url); setPreview(next);
  };
  const showLive = () => {
    const url = new URL(window.location.href); url.searchParams.delete("skyPreview"); url.hash = "night-sky"; window.history.replaceState(null, "", url); setLiveInstant(roundedCurrentMinuteIso()); setPreview(null);
  };
  return <div className="destination-sky-shell">
    <AstronomicalSky location={location} instantIso={preview?.instantIso ?? liveInstant} mode={preview ? "night-preview" : "live-night"} locale={locale} variant="destination" />
    <div className="sky-actions">
      {preview ? <button type="button" onClick={showLive}>{locale === "de" ? "Zum Live-Himmel" : "Show live sky"}</button>
        : previews[0] && <button type="button" onClick={() => showPreview(previews[0])}>{locale === "de" ? "Nachtvorschau anzeigen" : "Show night preview"}</button>}
    </div>
  </div>;
}
