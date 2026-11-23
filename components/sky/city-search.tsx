"use client";

import { useId, useMemo, useState } from "react";

import type { EstimatedCity } from "@/lib/astronomy/light-pollution";
import type { Locale } from "@/lib/i18n/config";

const maxResults = 8;

export function normalizeCityQuery(value: string) {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").toLowerCase().trim();
}

// Cities arrive sorted by population, so earlier matches are the bigger cities. Name starts
// rank before word starts, which rank before matches inside a word.
export function searchCities(cities: readonly EstimatedCity[], query: string, limit = maxResults) {
  const needle = normalizeCityQuery(query);
  if (needle.length === 0) return [];
  const ranked: { city: EstimatedCity; rank: number; order: number }[] = [];
  cities.forEach((city, order) => {
    let best = Infinity;
    for (const name of new Set([city.name.en, city.name.de])) {
      const haystack = normalizeCityQuery(name);
      const index = haystack.indexOf(needle);
      if (index === -1) continue;
      const rank = index === 0 ? 0 : /[\s\-'(]/.test(haystack[index - 1]) ? 1 : 2;
      best = Math.min(best, rank);
    }
    if (best !== Infinity) ranked.push({ city, rank: best, order });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.order - b.order).slice(0, limit).map((item) => item.city);
}

function countryName(locale: Locale, code: string) {
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code; } catch { return code; }
}

export function CitySearch({ locale, cities, selected, onSelect }: {
  locale: Locale;
  cities: readonly EstimatedCity[];
  selected: EstimatedCity;
  onSelect: (city: EstimatedCity) => void;
}) {
  const de = locale === "de";
  const id = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const results = useMemo(() => (query === null ? [] : searchCities(cities, query)), [cities, query]);
  const open = query !== null && results.length > 0;

  const choose = (city: EstimatedCity) => {
    onSelect(city);
    setQuery(null);
    setActive(0);
  };

  return (
    <div className="lp-city lp-city-search">
      <label htmlFor={`${id}-input`}>{de ? "Deine Stadt" : "Your city"}</label>
      <div className="lp-city-field">
        <input
          id={`${id}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-option-${active}` : undefined}
          placeholder={de ? "Stadt suchen …" : "Search a city …"}
          value={query ?? selected.name[locale]}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          onBlur={() => { window.setTimeout(() => setQuery(null), 150); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && open) { event.preventDefault(); setActive((value) => (value + 1) % results.length); }
            else if (event.key === "ArrowUp" && open) { event.preventDefault(); setActive((value) => (value - 1 + results.length) % results.length); }
            else if (event.key === "Enter" && open) { event.preventDefault(); choose(results[active]); event.currentTarget.blur(); }
            else if (event.key === "Escape") { setQuery(null); }
          }}
        />
        {open ? (
          <ul className="lp-city-results" id={`${id}-list`} role="listbox" aria-label={de ? "Passende Städte" : "Matching cities"}>
            {results.map((city, index) => (
              <li
                key={city.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? "active" : undefined}
                onMouseDown={(event) => { event.preventDefault(); choose(city); }}
                onMouseEnter={() => setActive(index)}
              >
                <strong>{city.name[locale]}</strong>
                <span>{countryName(locale, city.country)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {query !== null && normalizeCityQuery(query).length > 0 && results.length === 0 ? (
        <p className="lp-city-empty" role="status">{de ? "Keine passende Stadt. Wähle die nächste größere Stadt." : "No matching city. Pick the nearest larger city."}</p>
      ) : <span className="lp-city-country">{countryName(locale, selected.country)}</span>}
    </div>
  );
}
