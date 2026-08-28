"use client";

import { useEffect, useMemo, useState } from "react";

import { buildNightPlan, shouldRefreshLiveNightPlan } from "@/lib/astronomy/night-planner";
import { formatLocalClockTime, hasTimeZoneOffsetTransition } from "@/lib/astronomy/time";
import type { DestinationNightContext, NightPlan, RecommendationReasonCode, RecommendationQuality, SkyLocation } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";

import { NightTimeline } from "./night-timeline";

const qualityCopy: Record<Locale, Record<RecommendationQuality, string>> = {
  de: { excellent: "Sehr gute astronomische Bedingungen", good: "Gute astronomische Bedingungen", fair: "Brauchbare astronomische Bedingungen", limited: "Durch Mondlicht eingeschränkt" },
  en: { excellent: "Excellent astronomical conditions", good: "Good astronomical conditions", fair: "Fair astronomical conditions", limited: "Limited by moonlight" },
};

const reasonCopy: Record<Locale, Record<RecommendationReasonCode, string>> = {
  de: {
    "astronomical-darkness": "Astronomische Dunkelheit",
    "moon-below-horizon": "Mond unter dem Horizont",
    "starts-after-moonset": "Beginnt nach Monduntergang",
    "ends-before-moonrise": "Endet vor Mondaufgang",
    "moon-low": "Mond steht niedrig",
    "thin-moon": "Gering beleuchteter Mond",
    "bright-moon-remains": "Heller Mond bleibt sichtbar",
    "short-darkness-window": "Kurze astronomische Nacht",
    "best-remaining-window": "Beste verbleibende Zeit",
  },
  en: {
    "astronomical-darkness": "Astronomical darkness",
    "moon-below-horizon": "Moon below the horizon",
    "starts-after-moonset": "Starts after moonset",
    "ends-before-moonrise": "Ends before moonrise",
    "moon-low": "Moon stays low",
    "thin-moon": "Thinly illuminated Moon",
    "bright-moon-remains": "Bright Moon remains visible",
    "short-darkness-window": "Short astronomical night",
    "best-remaining-window": "Best remaining window",
  },
};

const eventCopy: Record<Locale, Record<string, string>> = {
  de: { sunset: "Sonnenuntergang", "astronomical-dusk": "Astronomische Dunkelheit beginnt", moonrise: "Mondaufgang", moonset: "Monduntergang", "astronomical-dawn": "Astronomische Dunkelheit endet", sunrise: "Sonnenaufgang" },
  en: { sunset: "Sunset", "astronomical-dusk": "Astronomical darkness begins", moonrise: "Moonrise", moonset: "Moonset", "astronomical-dawn": "Astronomical darkness ends", sunrise: "Sunrise" },
};

function formatNightDate(locale: Locale, timeZone: string, plan: NightPlan) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "long" });
  const start = formatter.format(new Date(plan.timelineStartIso));
  const end = formatter.format(new Date(plan.timelineEndIso));
  return start === end ? start : `${start} – ${end}`;
}

export function NightPlanningPanel({ location, context, currentInstantIso, locale }: { location: SkyLocation; context: DestinationNightContext; currentInstantIso: string; locale: Locale }) {
  const [livePlanAnchorIso, setLivePlanAnchorIso] = useState(() => context.instantIso);
  const planningInstantIso = context.mode === "live-night" ? livePlanAnchorIso : context.instantIso;
  const nowIso = context.source === "linked-preview" ? null : currentInstantIso;
  const result = useMemo(() => {
    try {
      return { plan: buildNightPlan({ location, mode: context.mode, instantIso: planningInstantIso, nowIso: planningInstantIso }), error: null };
    } catch (error) {
      return { plan: null, error: error instanceof Error ? error.message : "Night planning unavailable" };
    }
  }, [context.mode, location, planningInstantIso]);

  useEffect(() => {
    if (context.mode !== "live-night" || !result.plan) return;
    if (shouldRefreshLiveNightPlan({ plan: result.plan, location, nowIso: context.instantIso })) {
      setLivePlanAnchorIso((current) => current === context.instantIso ? current : context.instantIso);
    }
  }, [context.instantIso, context.mode, location, result.plan]);

  if (result.error || !result.plan) return <section className="night-planning-panel night-planning-error" role="status"><p>{locale === "de" ? "Nachtplanung nicht verfügbar." : "Night planning unavailable."}</p></section>;
  const plan = result.plan;
  const recommendation = plan.displayedRecommendation;
  const includeUtcOffset = hasTimeZoneOffsetTransition(plan.timeZone, plan.timelineStartIso, plan.timelineEndIso);
  const formatTime = (instantIso: string) => formatLocalClockTime(locale, location.timeZone, instantIso, includeUtcOffset);
  const heading = context.mode === "live-night"
    ? locale === "de" ? "Beste Zeit heute Nacht" : "Best time tonight"
    : locale === "de" ? "Beste Zeit in dieser Nacht" : "Best time this night";
  const disclaimer = locale === "de"
    ? "Rein astronomische Empfehlung; Wetter und lokale Horizontabschattungen sind nicht berücksichtigt."
    : "Astronomical recommendation only; weather and local horizon obstructions are not included.";
  const statusMessage = plan.status === "no-astronomical-night"
    ? locale === "de" ? "Keine astronomische Nacht: Die Sonne sinkt in dieser Nacht nicht tiefer als −18°." : "No astronomical night: the Sun does not sink below −18° during this night."
    : plan.status === "night-finished"
      ? locale === "de" ? "Die astronomische Nacht ist für heute beendet." : "The astronomical night has ended."
      : null;
  const reasons = recommendation?.reasonCodes.slice(0, 2).map((reason) => reasonCopy[locale][reason]) ?? [];
  const polarNightContext = plan.polarNight ? locale === "de" ? "Polarnacht. " : "Polar night. " : "";
  const accessibleSummary = recommendation
    ? locale === "de"
      ? `${polarNightContext}Für ${location.siteName} ist die beste astronomische Beobachtungszeit in der Nacht ${formatNightDate(locale, location.timeZone, plan)} von ${formatTime(recommendation.startIso)} bis ${formatTime(recommendation.endIso)} Uhr Ortszeit. ${reasons.join(" und ")}. ${plan.events.map((event) => `${eventCopy[locale][event.kind] ?? event.kind}: ${formatTime(event.instantIso)}`).join(". ")}. Wetter ist nicht berücksichtigt.`
      : `${polarNightContext}For ${location.siteName}, the best astronomical observing time on the night of ${formatNightDate(locale, location.timeZone, plan)} is ${formatTime(recommendation.startIso)} to ${formatTime(recommendation.endIso)} local time. ${reasons.join(" and ")}. ${plan.events.map((event) => `${eventCopy[locale][event.kind] ?? event.kind}: ${formatTime(event.instantIso)}`).join(". ")}. Weather is not included.`
    : statusMessage ?? disclaimer;
  return <section className="night-planning-panel" data-location-id={plan.locationId} data-site-id={plan.siteId} data-night-date={plan.nightDateLocal} data-plan-anchor={planningInstantIso} data-sample-count={plan.samples.length} aria-labelledby={`night-planning-title-${plan.locationId}`}>
    <div className="night-recommendation">
      <p className="eyebrow">{context.mode === "live-night" ? locale === "de" ? "Heute Nacht" : "Tonight" : locale === "de" ? "Nachtvorschau" : "Night preview"}</p>
      <h2 id={`night-planning-title-${plan.locationId}`}>{heading}</h2>
      <p className="night-plan-date">{plan.polarNight ? locale === "de" ? "Polarnacht · " : "Polar night · " : null}{locale === "de" ? `Nacht ${formatNightDate(locale, location.timeZone, plan)}` : `Night of ${formatNightDate(locale, location.timeZone, plan)}`}</p>
      {recommendation ? <>
        <p className="night-plan-time"><time dateTime={recommendation.startIso}>{formatTime(recommendation.startIso)}</time>–<time dateTime={recommendation.endIso}>{formatTime(recommendation.endIso)}</time> {locale === "de" ? "Uhr" : "local time"}</p>
        <p className="night-plan-reasons">{reasons.join(" · ")}</p>
        <p className="night-plan-quality">{qualityCopy[locale][recommendation.quality]}</p>
      </> : <p className="night-plan-status">{statusMessage}</p>}
      <p className="night-plan-disclaimer">{disclaimer}</p>
      <p className="sr-only">{accessibleSummary}</p>
    </div>
    <NightTimeline plan={plan} locale={locale} nowIso={nowIso} />
  </section>;
}
