"use client";

import { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/config";

type TourCard = {
  id: string;
  href: string;
  number: string;
  destinationName: string;
  countryName: string;
  continent: string;
  title: string;
  description: string;
};

const continentLabels: Record<Locale, Record<string, string>> = {
  en: { africa: "Africa", asia: "Asia", europe: "Europe", "north-america": "North America", oceania: "Oceania", "south-america": "South America" },
  de: { africa: "Afrika", asia: "Asien", europe: "Europa", "north-america": "Nordamerika", oceania: "Ozeanien", "south-america": "Südamerika" },
};

export function LocationTourIndexFilter({ locale, tours }: { locale: Locale; tours: TourCard[] }) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [limit, setLimit] = useState(12);
  const isGerman = locale === "de";
  const continents = useMemo(() => [...new Set(tours.map((tour) => tour.continent))].sort(), [tours]);
  const normalized = query.trim().toLocaleLowerCase(locale);
  const visible = useMemo(() => tours.filter((tour) => {
    if (continent !== "all" && tour.continent !== continent) return false;
    if (!normalized) return true;
    return [tour.destinationName, tour.countryName, tour.title, tour.description].join(" ").toLocaleLowerCase(locale).includes(normalized);
  }), [continent, locale, normalized, tours]);

  return <>
    <div className="tour-index-filter">
      <label><span>{isGerman ? "Nachtplan suchen" : "Search night plans"}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(12); }} placeholder={isGerman ? "Ort, Land oder Thema" : "Place, country, or topic"} /></label>
      <label><span>{isGerman ? "Region" : "Region"}</span><select value={continent} onChange={(event) => { setContinent(event.target.value); setLimit(12); }}><option value="all">{isGerman ? "Alle Regionen" : "All regions"}</option>{continents.map((item) => <option value={item} key={item}>{continentLabels[locale][item] ?? item}</option>)}</select></label>
      <div className="tour-index-filter-count"><strong>{visible.length}</strong><span>{isGerman ? `von ${tours.length} Nachtplänen` : `of ${tours.length} night plans`}</span>{query || continent !== "all" ? <button type="button" onClick={() => { setQuery(""); setContinent("all"); setLimit(12); }}>{isGerman ? "Filter löschen" : "Clear filters"}</button> : null}</div>
    </div>
    {visible.length ? <><section className="location-tour-index-grid" aria-label={isGerman ? "Standort-Touren" : "Location tours"}>{visible.map((tour, index) => <a key={tour.id} href={tour.href} hidden={index >= limit}>
      <span>{tour.number}</span><small>{tour.destinationName} · {tour.countryName}</small><h2>{tour.title}</h2><p>{tour.description}</p>
    </a>)}</section>{limit < visible.length ? <div className="tour-index-load-more"><p>{isGerman ? `${Math.min(limit, visible.length)} von ${visible.length} Nachtplänen sichtbar` : `${Math.min(limit, visible.length)} of ${visible.length} night plans shown`}</p><button type="button" onClick={() => setLimit((current) => current + 12)}>{isGerman ? "12 weitere anzeigen" : "Show 12 more"}</button></div> : null}</> : <p className="tour-index-empty">{isGerman ? "Keine Nachtpläne entsprechen diesen Filtern." : "No night plans match these filters."}</p>}
  </>;
}
