"use client";

import { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/config";

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
  const isGerman = locale === "de";
  const continents = useMemo(() => [...new Set(destinations.map((destination) => destination.continent))].sort(), [destinations]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visibleDestinations = useMemo(() => destinations.filter((destination) => {
    if (continent !== "all" && destination.continent !== continent) return false;
    if (!normalizedQuery) return true;
    const searchable = [destination.name, destination.countryName, destination.countryCode, destination.continent, ...destination.tags]
      .join(" ")
      .toLocaleLowerCase(locale);
    return searchable.includes(normalizedQuery);
  }), [continent, destinations, locale, normalizedQuery]);
  const hasFilters = Boolean(normalizedQuery) || continent !== "all";

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
            <button type="button" onClick={() => { setQuery(""); setContinent("all"); }}>
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
                <span>{destination.continent}</span>
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
