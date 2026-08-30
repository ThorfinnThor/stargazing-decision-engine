"use client";

import { useEffect, useMemo, useState } from "react";

import type { FinderDestination, MonthNumber } from "@/lib/data/types";
import {
  analyzeDestinations,
  type FinderAccess,
  type FinderPreferences,
  type FinderPriority,
  type FinderTemperature,
} from "@/lib/finder/finder";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { formatMonth } from "@/lib/i18n/months";

const defaults: FinderPreferences = {
  month: "all",
  region: "all",
  temperature: "any",
  priority: "balanced",
  access: "reviewed",
};

const temperatures: FinderTemperature[] = ["any", "cold", "cool", "mild", "warm"];
const priorities: FinderPriority[] = ["balanced", "darkness", "comfort", "clear"];
const accessOptions: FinderAccess[] = ["reviewed", "public"];

const labels = {
  en: {
    month: "Month", allMonths: "Best month", region: "Region", allRegions: "All regions",
    temperature: "Night temperature", priority: "Preference focus", access: "Night access",
    loading: "Loading the destination index…", loadError: "The destination index could not be loaded.", retry: "Retry loading destinations", browseCatalog: "Browse the static destination catalog",
    result: "matching destinations", methodology: "The match keeps 60% of the historical trip score, then adds 25% preference fit and 15% source confidence. It is not a weather forecast.",
    lowConfidenceOne: "additional destination has positive data for these filters, but its evidence does not meet the publication-confidence threshold.",
    lowConfidenceMany: "additional destinations have positive data for these filters, but their evidence does not meet the publication-confidence threshold.",
    temperatures: { any: "Any", cold: "Cold · around 0 °C", cool: "Cool · around 7 °C", mild: "Mild · around 14 °C", warm: "Warm · around 21 °C" },
    priorities: { balanced: "Balanced", darkness: "Darkest sky", comfort: "Trip comfort", clear: "Clear-sky history" },
    accessOptions: { reviewed: "Public + booking-only", public: "Unrestricted public only" },
    confidenceLevels: { high: "high", moderate: "moderate", low: "low" },
    match: "match", trip: "historical trip", sky: "sky quality", comfort: "comfort", darkness: "darkness", confidence: "confidence", bestSite: "Best validated site", nightMean: "mean night temperature", noResults: "No reviewed destination matches all filters.",
  },
  de: {
    month: "Monat", allMonths: "Bester Monat", region: "Region", allRegions: "Alle Regionen",
    temperature: "Nachttemperatur", priority: "Präferenzschwerpunkt", access: "Nachtzugang",
    loading: "Zielübersicht wird geladen…", loadError: "Die Zielübersicht konnte nicht geladen werden.", retry: "Ziele erneut laden", browseCatalog: "Statischen Zielkatalog öffnen",
    result: "passende Ziele", methodology: "Der Match behält 60 % des historischen Reisewerts und ergänzt 25 % Präferenzpassung sowie 15 % Quellenkonfidenz. Er ist keine Wettervorhersage.",
    lowConfidenceOne: "weiteres Ziel hat für diese Filter positive Daten, erfüllt aber nicht die Konfidenzschwelle für eine Veröffentlichung.",
    lowConfidenceMany: "weitere Ziele haben für diese Filter positive Daten, erfüllen aber nicht die Konfidenzschwelle für eine Veröffentlichung.",
    temperatures: { any: "Egal", cold: "Kalt · etwa 0 °C", cool: "Kühl · etwa 7 °C", mild: "Mild · etwa 14 °C", warm: "Warm · etwa 21 °C" },
    priorities: { balanced: "Ausgewogen", darkness: "Dunkelster Himmel", comfort: "Reisekomfort", clear: "Historisch klarer Himmel" },
    accessOptions: { reviewed: "Öffentlich + buchungspflichtig", public: "Nur frei öffentlich" },
    confidenceLevels: { high: "hoch", moderate: "mittel", low: "niedrig" },
    match: "Match", trip: "historischer Reisewert", sky: "Himmelsqualität", comfort: "Komfort", darkness: "Dunkelheit", confidence: "Konfidenz", bestSite: "Bester validierter Ort", nightMean: "mittlere Nachttemperatur", noResults: "Kein geprüftes Ziel erfüllt alle Filter.",
  },
} as const;

function titleCase(value: string, locale: Locale) {
  const localized: Record<string, { en: string; de: string }> = {
    africa: { en: "Africa", de: "Afrika" }, asia: { en: "Asia", de: "Asien" }, europe: { en: "Europe", de: "Europa" },
    "north-america": { en: "North America", de: "Nordamerika" }, "south-america": { en: "South America", de: "Südamerika" },
    oceania: { en: "Oceania", de: "Ozeanien" },
  };
  return localized[value]?.[locale] ?? value.replaceAll("-", " ");
}

function readPreferences(search: URLSearchParams, regions: string[]): FinderPreferences {
  const monthValue = Number(search.get("month"));
  const temperature = search.get("temperature") as FinderTemperature;
  const priority = search.get("priority") as FinderPriority;
  const access = search.get("access") as FinderAccess;
  const region = search.get("region") ?? "all";
  return {
    month: Number.isInteger(monthValue) && monthValue >= 1 && monthValue <= 12 ? monthValue as MonthNumber : "all",
    region: region === "all" || regions.includes(region) ? region : "all",
    temperature: temperatures.includes(temperature) ? temperature : defaults.temperature,
    priority: priorities.includes(priority) ? priority : defaults.priority,
    access: accessOptions.includes(access) ? access : defaults.access,
  };
}

export function FinderClient({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  const temperatureFormat = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const [index, setIndex] = useState<FinderDestination[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const regions = useMemo(() => [...new Set(index.map((destination) => destination.continent))].sort(), [index]);
  const [preferences, setPreferences] = useState<FinderPreferences>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    fetch("/data/stargazing/search/destination-index.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Finder index returned ${response.status}`);
        return response.json() as Promise<FinderDestination[]>;
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Finder index is not an array");
        setIndex(data);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadState("error");
      });
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    if (loadState !== "ready" || hydrated) return;
    setPreferences(readPreferences(new URLSearchParams(window.location.search), regions));
    setHydrated(true);
  }, [hydrated, loadState, regions]);

  useEffect(() => {
    if (!hydrated) return;
    const query = new URLSearchParams();
    if (preferences.month !== "all") query.set("month", String(preferences.month));
    if (preferences.region !== "all") query.set("region", preferences.region);
    if (preferences.temperature !== defaults.temperature) query.set("temperature", preferences.temperature);
    if (preferences.priority !== defaults.priority) query.set("priority", preferences.priority);
    if (preferences.access !== defaults.access) query.set("access", preferences.access);
    window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`);
  }, [hydrated, preferences]);

  const analysis = useMemo(() => analyzeDestinations(index, preferences), [index, preferences]);
  const matches = analysis.matches;
  const set = <Key extends keyof FinderPreferences>(key: Key, value: FinderPreferences[Key]) => setPreferences((current) => ({ ...current, [key]: value }));

  return (
    <>
      <form className="finder-controls" onSubmit={(event) => event.preventDefault()}>
        <label>{copy.month}<select value={preferences.month} onChange={(event) => set("month", event.target.value === "all" ? "all" : Number(event.target.value) as MonthNumber)}><option value="all">{copy.allMonths}</option>{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option value={month} key={month}>{formatMonth(month as MonthNumber, locale)}</option>)}</select></label>
        <label>{copy.region}<select value={preferences.region} onChange={(event) => set("region", event.target.value)}><option value="all">{copy.allRegions}</option>{regions.map((region) => <option value={region} key={region}>{titleCase(region, locale)}</option>)}</select></label>
        <label>{copy.temperature}<select value={preferences.temperature} onChange={(event) => set("temperature", event.target.value as FinderTemperature)}>{temperatures.map((value) => <option value={value} key={value}>{copy.temperatures[value]}</option>)}</select></label>
        <label>{copy.priority}<select value={preferences.priority} onChange={(event) => set("priority", event.target.value as FinderPriority)}>{priorities.map((value) => <option value={value} key={value}>{copy.priorities[value]}</option>)}</select></label>
        <label>{copy.access}<select value={preferences.access} onChange={(event) => set("access", event.target.value as FinderAccess)}>{accessOptions.map((value) => <option value={value} key={value}>{copy.accessOptions[value]}</option>)}</select></label>
      </form>

      <div className="finder-result-heading"><p aria-live="polite" role={loadState === "error" ? "alert" : undefined}>{loadState === "loading" ? copy.loading : loadState === "error" ? copy.loadError : <><strong>{matches.length}</strong> {copy.result}</>}</p><p>{copy.methodology}</p></div>
      {loadState === "error" ? <div className="finder-error-actions"><button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>{copy.retry}</button><a href={`${localizedLinks.home(locale)}#catalog`}>{copy.browseCatalog}</a></div> : null}
      {loadState === "ready" && analysis.exclusions.lowConfidence > 0 ? <p className="finder-exclusion-notice"><strong>{analysis.exclusions.lowConfidence}</strong> {analysis.exclusions.lowConfidence === 1 ? copy.lowConfidenceOne : copy.lowConfidenceMany}</p> : null}
      {loadState === "ready" && (matches.length === 0 ? <p className="finder-empty">{copy.noResults}</p> : <div className="finder-results">
        {matches.map(({ destination, month, matchScore }) => (
          <a className="finder-result" href={localizedLinks.destination(locale, destination.slug)} key={destination.id}>
            <div className="finder-result-top"><span>{destination.countryCode} · {titleCase(destination.continent, locale)}</span><strong>{matchScore} <small>{copy.match}</small></strong></div>
            <h2>{destination.name}</h2>
            <p>{formatMonth(month.month, locale)} · {destination.bestSiteName}</p>
            <dl>
              <div><dt>{copy.trip}</dt><dd>{month.stargazingTrip}</dd></div>
              <div><dt>{copy.sky}</dt><dd>{month.skyQuality}</dd></div>
              <div><dt>{copy.comfort}</dt><dd>{month.tripComfort}</dd></div>
              <div><dt>{copy.darkness}</dt><dd>{month.darknessScore}</dd></div>
            </dl>
            <p className="finder-result-meta">{copy.nightMean}: {month.nightTempMeanC === null ? "—" : `${temperatureFormat.format(month.nightTempMeanC)} °C`} · {copy.confidence}: {copy.confidenceLevels[month.confidenceLevel]}</p>
          </a>
        ))}
      </div>)}
    </>
  );
}
