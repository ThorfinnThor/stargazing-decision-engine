import type { Locale } from "@/lib/i18n/config";
import { formatLocalClockTime, hasTimeZoneOffsetTransition } from "@/lib/astronomy/time";
import { timelineRatio } from "@/lib/astronomy/night-planner";
import type { NightPlan, NightPlanEventKind } from "@/lib/astronomy/types";

type NightTimelineProps = {
  plan: NightPlan;
  locale: Locale;
  nowIso: string | null;
};

const eventLabels: Record<Locale, Record<NightPlanEventKind, string>> = {
  de: {
    sunset: "Sonnenuntergang",
    "astronomical-dusk": "Astronomische Dunkelheit beginnt",
    moonrise: "Mondaufgang",
    moonset: "Monduntergang",
    "astronomical-dawn": "Astronomische Dunkelheit endet",
    sunrise: "Sonnenaufgang",
  },
  en: {
    sunset: "Sunset",
    "astronomical-dusk": "Astronomical darkness begins",
    moonrise: "Moonrise",
    moonset: "Moonset",
    "astronomical-dawn": "Astronomical darkness ends",
    sunrise: "Sunrise",
  },
};

function segmentLabel(kind: string, locale: Locale) {
  if (kind === "twilight") return locale === "de" ? "Dämmerung" : "Twilight";
  if (kind === "astronomical-darkness") return locale === "de" ? "Astronomische Dunkelheit" : "Astronomical darkness";
  if (kind === "moon-above") return locale === "de" ? "Mond über dem Horizont" : "Moon above the horizon";
  if (kind === "moon-below") return locale === "de" ? "Mond unter dem Horizont" : "Moon below the horizon";
  return locale === "de" ? "Empfohlenes Zeitfenster" : "Recommended window";
}

export function NightTimeline({ plan, locale, nowIso }: NightTimelineProps) {
  const isGerman = locale === "de";
  const includeUtcOffset = hasTimeZoneOffsetTransition(plan.timeZone, plan.timelineStartIso, plan.timelineEndIso);
  const formatTime = (instantIso: string) => formatLocalClockTime(locale, plan.timeZone, instantIso, includeUtcOffset);
  const nowRatio = nowIso && plan.mode === "live-night" && Date.parse(nowIso) >= Date.parse(plan.timelineStartIso) && Date.parse(nowIso) <= Date.parse(plan.timelineEndIso)
    ? timelineRatio(nowIso, plan.timelineStartIso, plan.timelineEndIso)
    : null;
  const heading = isGerman ? "Nacht-Timeline" : "Night timeline";
  const description = isGerman
    ? `${plan.polarNight ? "Polarnacht: " : ""}Sonnen- und Mondphasen erklären das empfohlene Fenster.`
    : `${plan.polarNight ? "Polar night: " : ""}Sun and Moon phases explain the recommended window.`;
  return <section className="night-timeline" aria-labelledby={`night-timeline-${plan.locationId}`}>
    <h3 id={`night-timeline-${plan.locationId}`}>{heading}</h3>
    <p className="night-timeline-intro">{description}</p>
    <div className="night-timeline-chart">
      <div className="night-timeline-row-labels" aria-hidden="true">
        <span>{isGerman ? "Himmel" : "Sky"}</span>
        <span>{isGerman ? "Mond" : "Moon"}</span>
        <span>{isGerman ? "Empfehlung" : "Recommendation"}</span>
      </div>
      <svg className="night-timeline-svg" viewBox="0 0 1000 180" role="img" aria-labelledby={`night-timeline-title-${plan.locationId}`}>
        <title id={`night-timeline-title-${plan.locationId}`}>{isGerman ? "Nachtverlauf und empfohlenes Zeitfenster" : "Night progression and recommended window"}</title>
        {[25, 75, 125].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} className="night-timeline-guide" />)}
        {plan.timelineSegments.map((item, index) => {
          const y = item.kind === "recommended" ? 132 : item.kind.startsWith("moon-") ? 72 : 12;
          const height = item.kind === "recommended" ? 24 : 26;
          return <rect key={`${item.kind}-${item.startIso}-${index}`} x={item.startRatio * 1000} y={y} width={Math.max(1, (item.endRatio - item.startRatio) * 1000)} height={height} className={`night-timeline-segment night-timeline-segment-${item.kind}`} aria-label={segmentLabel(item.kind, locale)} />;
        })}
        {plan.events.map((event) => {
          const ratio = timelineRatio(event.instantIso, plan.timelineStartIso, plan.timelineEndIso);
          return <line key={`${event.kind}-${event.instantIso}`} x1={ratio * 1000} x2={ratio * 1000} y1="0" y2="156" className={`night-timeline-event-marker night-timeline-event-${event.kind}`} />;
        })}
        {nowRatio !== null ? <line x1={nowRatio * 1000} x2={nowRatio * 1000} y1="0" y2="156" className="night-timeline-now" /> : null}
      </svg>
    </div>
    <div className="night-timeline-legend" aria-hidden="true">
      <span><i className="night-timeline-swatch night-timeline-swatch-dark" />{isGerman ? "Astronomische Dunkelheit" : "Astronomical darkness"}</span>
      <span><i className="night-timeline-swatch night-timeline-swatch-moon" />{isGerman ? "Mondstatus" : "Moon status"}</span>
      <span><i className="night-timeline-swatch night-timeline-swatch-recommended" />{isGerman ? "Empfohlen" : "Recommended"}</span>
      {nowRatio !== null ? <span><i className="night-timeline-swatch night-timeline-swatch-now" />{isGerman ? "Jetzt" : "Now"}</span> : null}
    </div>
    <ul className="night-timeline-events">
      {plan.events.map((event) => <li key={`${event.kind}-${event.instantIso}`}><span>{eventLabels[locale][event.kind]}</span><time dateTime={event.instantIso}>{formatTime(event.instantIso)}</time></li>)}
      {nowRatio !== null ? <li><span>{isGerman ? "Jetzt" : "Now"}</span><time dateTime={nowIso!}>{formatTime(nowIso!)}</time></li> : null}
    </ul>
  </section>;
}
