"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/config";
import { formatMonth } from "@/lib/i18n/months";

type CatalogDestination = {
  id: string;
  href: string;
  name: string;
  countryCode: string;
  countryName: string;
  continent: string;
  tags: string[];
  nightAccessStatus: "eligible" | "closed" | "unverified";
  score: number | null;
  scoreLabel: string;
  bestMonthLabel: string;
  bestMonth: number | null;
};

const continentLabels: Record<Locale, Record<string, string>> = {
  en: {
    africa: "Africa",
    asia: "Asia",
    europe: "Europe",
    "north-america": "North America",
    oceania: "Oceania",
    "south-america": "South America",
  },
  de: {
    africa: "Afrika",
    asia: "Asien",
    europe: "Europa",
    "north-america": "Nordamerika",
    oceania: "Ozeanien",
    "south-america": "Südamerika",
  },
};

export function DestinationCatalogFilter({ destinations, locale, bestMonthLabel }: {
  destinations: CatalogDestination[];
  locale: Locale;
  bestMonthLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [month, setMonth] = useState("all");
  const [access, setAccess] = useState("all");
  const [minimumScore, setMinimumScore] = useState("all");
  const [hydrated, setHydrated] = useState(false);
  const isGerman = locale === "de";
  const continents = useMemo(() => [...new Set(destinations.map((destination) => destination.continent))].sort(), [destinations]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const requestedContinent = search.get("region") ?? "all";
    setQuery(search.get("q") ?? "");
    setContinent(continents.includes(requestedContinent) ? requestedContinent : "all");
    setMonth(/^([1-9]|1[0-2])$/.test(search.get("month") ?? "") ? search.get("month")! : "all");
    setAccess(["eligible", "closed", "unverified"].includes(search.get("access") ?? "") ? search.get("access")! : "all");
    setMinimumScore(["70", "80", "90"].includes(search.get("score") ?? "") ? search.get("score")! : "all");
    setHydrated(true);
  }, [continents]);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    const trimmedQuery = query.trim();
    if (trimmedQuery) url.searchParams.set("q", trimmedQuery);
    else url.searchParams.delete("q");
    if (continent !== "all") url.searchParams.set("region", continent);
    else url.searchParams.delete("region");
    if (month !== "all") url.searchParams.set("month", month);
    else url.searchParams.delete("month");
    if (access !== "all") url.searchParams.set("access", access);
    else url.searchParams.delete("access");
    if (minimumScore !== "all") url.searchParams.set("score", minimumScore);
    else url.searchParams.delete("score");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [access, continent, hydrated, minimumScore, month, query]);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visibleDestinations = useMemo(() => destinations.filter((destination) => {
    if (continent !== "all" && destination.continent !== continent) return false;
    if (month !== "all" && destination.bestMonth !== Number(month)) return false;
    if (access !== "all" && destination.nightAccessStatus !== access) return false;
    if (minimumScore !== "all" && (destination.score === null || destination.score < Number(minimumScore))) return false;
    if (!normalizedQuery) return true;
    const searchable = [destination.name, destination.countryName, destination.countryCode, destination.continent, continentLabels[locale][destination.continent], ...destination.tags]
      .join(" ")
      .toLocaleLowerCase(locale);
    return searchable.includes(normalizedQuery);
  }), [access, continent, destinations, locale, minimumScore, month, normalizedQuery]);
  const hasFilters = Boolean(normalizedQuery) || continent !== "all" || month !== "all" || access !== "all" || minimumScore !== "all";

  return (
    <div>
      <div className="catalog-filter" role="group" aria-label={isGerman ? "Ziele filtern" : "Filter destinations"}>
        <label>
          <span>{isGerman ? "Ziel suchen" : "Search destinations"}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isGerman ? "Name, Land oder Merkmal" : "Name, country, or feature"}
          />
        </label>
        <label>
          <span>{isGerman ? "Bester Monat" : "Best month"}</span>
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="all">{isGerman ? "Alle Monate" : "All months"}</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{formatMonth(value, locale)}</option>)}
          </select>
        </label>
        <label>
          <span>{isGerman ? "Nachtzugang" : "Night access"}</span>
          <select value={access} onChange={(event) => setAccess(event.target.value)}>
            <option value="all">{isGerman ? "Jeder Status" : "Any status"}</option>
            <option value="eligible">{isGerman ? "Öffentlich zugänglich" : "Public access"}</option>
            <option value="unverified">{isGerman ? "Nicht verifiziert" : "Not verified"}</option>
            <option value="closed">{isGerman ? "Nicht öffentlich" : "Not public"}</option>
          </select>
        </label>
        <label>
          <span>{isGerman ? "Mindestwert" : "Minimum score"}</span>
          <select value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)}>
            <option value="all">{isGerman ? "Jeder Wert" : "Any score"}</option>
            <option value="70">70+</option><option value="80">80+</option><option value="90">90+</option>
          </select>
        </label>
        <label>
          <span>{isGerman ? "Region" : "Region"}</span>
          <select value={continent} onChange={(event) => setContinent(event.target.value)}>
            <option value="all">{isGerman ? "Alle Regionen" : "All regions"}</option>
            {continents.map((item) => <option value={item} key={item}>{continentLabels[locale][item] ?? item}</option>)}
          </select>
        </label>
        <div className="catalog-filter-summary">
          <p aria-live="polite">
            <strong>{visibleDestinations.length}</strong> {isGerman ? `von ${destinations.length} Zielen` : `of ${destinations.length} destinations`}
          </p>
          {hasFilters ? (
            <button type="button" onClick={() => { setQuery(""); setContinent("all"); setMonth("all"); setAccess("all"); setMinimumScore("all"); }}>
              {isGerman ? "Filter löschen" : "Clear filters"}
            </button>
          ) : null}
        </div>
      </div>

      {visibleDestinations.length > 0 ? (
        <div className="catalog-grid">
          {visibleDestinations.map((destination) => (
            <a className="destination-card" href={destination.href} key={destination.id}>
              <div className="card-topline">
                <span>{destination.countryCode}</span>
                <span>{continentLabels[locale][destination.continent] ?? destination.continent}</span>
              </div>
              <h3>{destination.name}</h3>
              <p>{destination.tags.slice(0, 2).join(" · ")}{destination.nightAccessStatus === "closed"
                ? ` · ${isGerman ? "kein öffentlicher Nachtzugang" : "no public night access"}`
                : destination.nightAccessStatus === "unverified" ? ` · ${isGerman ? "Nachtzugang nicht verifiziert" : "night access not verified"}` : ""}</p>
              <div className="card-score">
                <span className="score-value">{destination.score ?? "—"}</span>
                <span className="score-label">{destination.scoreLabel}<br />{bestMonthLabel} {destination.bestMonthLabel}</span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="catalog-empty">{isGerman ? "Keine Ziele entsprechen diesen Filtern." : "No destinations match these filters."}</p>
      )}
    </div>
  );
}
