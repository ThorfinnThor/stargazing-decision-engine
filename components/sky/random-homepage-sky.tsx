"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AstronomicalSky } from "./astronomical-sky";
import { computeSunHorizontal } from "@/lib/astronomy/compute-sky";
import { buildDestinationSkyHref } from "@/lib/astronomy/navigation";
import { roundedCurrentMinuteIso, selectHomepageSky, shouldKeepLiveSelection } from "@/lib/astronomy/selection";
import type { HomepageSkyCandidate, HomepageSkySelection, NightPreview } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";

type State = { selection: HomepageSkySelection; instantIso: string };

function randomUnit() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = new Uint32Array(1); crypto.getRandomValues(value); return value[0] / 0x1_0000_0000;
  }
  return Math.random();
}

export function RandomHomepageSky({ candidates, previews, locale }: { candidates: HomepageSkyCandidate[]; previews: NightPreview[]; locale: Locale }) {
  const signature = useMemo(() => candidates.map((candidate) => candidate.id).join("|"), [candidates]);
  const [state, setState] = useState<State | null>(null);
  const stateRef = useRef<State | null>(null);
  useEffect(() => {
    const storageKey = `stargazing-home-sky:${signature}`;
    const choose = (instantIso: string) => {
      const selection = selectHomepageSky({ candidates, previews, instantIso, locationRandomUnit: randomUnit(), previewRandomUnit: randomUnit() });
      if (!selection) return null;
      const next = { selection, instantIso: selection.mode === "night-preview" ? selection.instantIso : instantIso };
      try { sessionStorage.setItem(storageKey, JSON.stringify({ ...next, expiresAt: Date.now() + 30 * 60_000 })); } catch {}
      return next;
    };
    const nowIso = roundedCurrentMinuteIso();
    let initial: State | null = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as (State & { expiresAt: number }) | null;
      const candidate = saved && saved.expiresAt > Date.now() ? candidates.find((item) => item.id === saved.selection.candidateId) : null;
      if (saved && candidate) {
        const selection = saved.selection;
        const valid = selection.mode === "night-preview"
          ? previews.some((preview) => preview.id === selection.previewId && preview.destinationId === candidate.location.destinationId && preview.siteId === candidate.location.siteId)
          : shouldKeepLiveSelection(computeSunHorizontal(candidate.location, nowIso).altitudeDeg);
        if (valid) initial = { selection, instantIso: selection.mode === "night-preview" ? selection.instantIso : nowIso };
      }
    } catch {}
    const commit = (next: State | null) => { stateRef.current = next; setState(next); };
    commit(initial ?? choose(nowIso));
    const refresh = () => {
      const instantIso = roundedCurrentMinuteIso();
      const current = stateRef.current;
      if (!current || current.selection.mode === "night-preview") return;
      const candidate = candidates.find((item) => item.id === current.selection.candidateId);
      try {
        if (candidate && shouldKeepLiveSelection(computeSunHorizontal(candidate.location, instantIso).altitudeDeg)) commit({ ...current, instantIso });
        else commit(choose(instantIso));
      } catch {
        commit(choose(instantIso));
      }
    };
    const delay = 60_000 - (Date.now() % 60_000) + 25;
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => { refresh(); interval = setInterval(refresh, 60_000); }, delay);
    const visibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); document.removeEventListener("visibilitychange", visibility); };
  }, [candidates, previews, signature]);
  if (!state) return <div className="sky-loading" role="status">{locale === "de" ? "Astronomischer Himmel wird berechnet …" : "Calculating astronomical sky …"}</div>;
  const candidate = candidates.find((item) => item.id === state.selection.candidateId);
  if (!candidate) return <div className="sky-unavailable">{locale === "de" ? "Keine geeignete Location verfügbar." : "No suitable location available."}</div>;
  const href = buildDestinationSkyHref({ baseHref: candidate.destinationHref, mode: state.selection.mode, previewId: state.selection.mode === "night-preview" ? state.selection.previewId : undefined });
  return <AstronomicalSky location={candidate.location} instantIso={state.instantIso} mode={state.selection.mode} locale={locale} variant="homepage" destinationHref={href} />;
}
