"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SkyCanvas } from "./sky-canvas";
import { brightStars } from "@/lib/astronomy/catalog";
import { CitySearch } from "./city-search";
import {
  bortleForLimitingMagnitude, computeSkyComparison, darkestSky, defaultReferenceCity, defaultSituationId, distanceKm,
  findReferenceCity, findSituation, parseCitySkyRows, referenceCities, referenceCityLocation, selectComparisonInstant,
  skyglowForLimitingMagnitude, skySituations, type CitySkyFile, type EstimatedCity, type ReferenceCity, type SkySituation,
} from "@/lib/astronomy/light-pollution";
import { roundedCurrentMinuteIso } from "@/lib/astronomy/selection";
import { formatLocalClockTime } from "@/lib/astronomy/time";
import type { CatalogStar, FaintStarCatalog } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export type ComparisonDestination = { slug: string; name: string; countryName: string; lat: number; lon: number };

type ComparisonCity = ReferenceCity | EstimatedCity;
// "estimate" uses the satellite estimate for the chosen city; otherwise one of the five settings.
type Choice = { city: ComparisonCity; sky: "estimate" | SkySituation; nowIso: string; touched?: boolean };

const faintStarsUrl = "/data/stargazing/astronomy/faint-stars.json";
const citySkyUrl = "/data/stargazing/astronomy/city-sky.json";

function hasEstimate(city: ComparisonCity): city is EstimatedCity {
  return "limitingMagnitude" in city;
}

function readTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; }
}

// Resolves the URL (or the reader's time zone) against whichever city list is loaded.
// Without a sky in the URL, a city with an estimate shows the estimate; Phase 1 links
// with ?sky=<setting> keep their setting.
function resolveChoice(locale: Locale, cities: readonly ComparisonCity[] | null, nowIso: string): Choice {
  const params = new URLSearchParams(window.location.search);
  const fallback = defaultReferenceCity(locale, readTimeZone());
  const list = cities ?? referenceCities;
  const city = list.find((item) => item.id === params.get("city")) ?? list.find((item) => item.id === fallback.id) ?? fallback;
  const situation = findSituation(params.get("sky"));
  const sky = situation ?? (hasEstimate(city) ? "estimate" : (findSituation(defaultSituationId) as SkySituation));
  return { city, sky, nowIso };
}

function skyOf(choice: Choice) {
  if (choice.sky === "estimate" && hasEstimate(choice.city)) {
    const limitingMagnitude = choice.city.limitingMagnitude;
    return { id: "estimate", limitingMagnitude, bortle: bortleForLimitingMagnitude(limitingMagnitude), skyglow: skyglowForLimitingMagnitude(limitingMagnitude) };
  }
  const situation = choice.sky === "estimate" ? (findSituation(defaultSituationId) as SkySituation) : choice.sky;
  return { id: situation.id, limitingMagnitude: situation.limitingMagnitude, bortle: situation.bortle, skyglow: situation.skyglow, situation };
}

function formatMagnitude(locale: Locale, value: number) {
  return locale === "de" ? value.toFixed(1).replace(".", ",") : value.toFixed(1);
}

function formatCount(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US").format(value);
}

function shareUrl(locale: Locale, choice: Choice) {
  const url = new URL(localizedLinks.lightPollutionComparison(locale), window.location.origin);
  url.searchParams.set("city", choice.city.id);
  url.searchParams.set("sky", skyOf(choice).id);
  return url.toString();
}

export function LightPollutionComparison({ locale, destinations }: { locale: Locale; destinations: ComparisonDestination[] }) {
  const de = locale === "de";
  const [choice, setChoice] = useState<Choice | null>(null);
  const [stars, setStars] = useState<readonly CatalogStar[] | null>(null);
  const [cities, setCities] = useState<readonly EstimatedCity[] | null>(null);
  const [split, setSplit] = useState(50);
  const [status, setStatus] = useState<string | null>(null);
  const yoursRef = useRef<HTMLDivElement>(null);
  const darkestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nowIso = roundedCurrentMinuteIso();
    setChoice(resolveChoice(locale, null, nowIso));
    let cancelled = false;
    fetch(citySkyUrl)
      .then((response) => (response.ok ? response.json() as Promise<CitySkyFile> : Promise.reject(new Error(String(response.status)))))
      .then((file) => {
        if (cancelled) return;
        const parsed = parseCitySkyRows(file.cities);
        setCities(parsed);
        // Re-resolve unless the reader already changed something.
        setChoice((current) => {
          if (!current || !current.touched) return resolveChoice(locale, parsed, nowIso);
          // The reader already chose: keep their setting and swap in the same city with its estimate.
          const city = parsed.find((item) => item.id === current.city.id);
          return city ? { ...current, city } : current;
        });
      })
      // Without the city file the page keeps the reference cities and the five settings.
      .catch(() => undefined);
    fetch(faintStarsUrl)
      .then((response) => (response.ok ? response.json() as Promise<FaintStarCatalog> : Promise.reject(new Error(String(response.status)))))
      .then((file) => {
        if (cancelled) return;
        const faint = file.stars.map(([id, xEqj, yEqj, zEqj, magnitude, colorIndex]) => ({ id, xEqj, yEqj, zEqj, magnitude, colorIndex }));
        setStars([...brightStars, ...faint]);
      })
      // Without the faint file the darkest sky stops at magnitude 6; the comparison still works.
      .catch(() => { if (!cancelled) setStars(brightStars); });
    return () => { cancelled = true; };
  }, [locale]);

  const update = (next: Partial<Pick<Choice, "city" | "sky">>) => {
    if (!choice) return;
    const merged = { ...choice, ...next, touched: true };
    setChoice(merged);
    setStatus(null);
    try { window.history.replaceState(null, "", `${window.location.pathname}?city=${merged.city.id}&sky=${skyOf(merged).id}`); } catch { /* history blocked */ }
  };

  // Picking a city with an estimate switches to it; the reader can still pick a setting afterwards.
  const pickCity = (city: ComparisonCity) => update({ city, sky: hasEstimate(city) ? "estimate" : (choice?.sky === "estimate" ? (findSituation(defaultSituationId) as SkySituation) : choice?.sky) });

  const result = useMemo(() => {
    if (!choice || !stars) return null;
    const timing = selectComparisonInstant(referenceCityLocation(choice.city, darkestSky.limitingMagnitude), choice.nowIso);
    return { timing, ...computeSkyComparison({ city: choice.city, limitingMagnitude: skyOf(choice).limitingMagnitude, instantIso: timing.instantIso, stars }) };
  }, [choice, stars]);

  const nearest = useMemo(() => {
    if (!choice) return [];
    return destinations
      .map((destination) => ({ ...destination, km: distanceKm(choice.city, destination) }))
      .sort((left, right) => left.km - right.km)
      .slice(0, 3);
  }, [choice, destinations]);

  if (!choice || !result) {
    return <div className="sky-loading lp-loading" role="status">{de ? "Sternenhimmel wird berechnet …" : "Calculating the sky …"}</div>;
  }

  const cityName = choice.city.name[locale];
  const sky = skyOf(choice);
  const estimated = sky.id === "estimate";
  const situationName = sky.situation ? sky.situation.label[locale] : (de ? "Schätzung fürs Zentrum" : "estimate for the centre");
  const estimate = hasEstimate(choice.city) ? choice.city.limitingMagnitude : null;
  const percent = Math.max(1, Math.round(result.visibleShare * 100));
  const time = formatLocalClockTime(locale, choice.city.timeZone, result.timing.instantIso);
  const yoursCount = formatCount(locale, result.yours.visibleStars);
  const darkestCount = formatCount(locale, result.darkest.visibleStars);

  async function shareImage() {
    if (!choice || !result) return;
    const yoursCanvas = yoursRef.current?.querySelector("canvas");
    const darkestCanvas = darkestRef.current?.querySelector("canvas");
    if (!yoursCanvas || !darkestCanvas) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#080b17"; context.fillRect(0, 0, 1200, 630);
    context.drawImage(yoursCanvas, 70, 92, 460, 460);
    context.drawImage(darkestCanvas, 670, 92, 460, 460);
    context.textAlign = "center"; context.fillStyle = "#e9c46a"; context.font = "600 26px Georgia, serif";
    context.fillText(estimated
      ? (de ? `Mein Himmel · ${cityName}, Bortle ${sky.bortle}` : `My sky · ${cityName}, Bortle ${sky.bortle}`)
      : (de ? `Mein Himmel · ${situationName}, ${cityName}` : `My sky · ${situationName}, ${cityName}`), 300, 56);
    context.fillText(de ? "Der dunkelste Himmel" : "The darkest sky", 900, 56);
    context.fillStyle = "#ffffff"; context.font = "400 30px Georgia, serif";
    context.fillText(de ? `${yoursCount} Sterne` : `${yoursCount} stars`, 300, 590);
    context.fillText(de ? `${darkestCount} Sterne` : `${darkestCount} stars`, 900, 590);
    context.fillStyle = "#aab2c8"; context.font = "16px ui-monospace, monospace";
    context.fillText("stargazingindex.com", 600, 615);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], de ? "mein-himmel-vs-dunkelster-himmel.png" : "my-sky-vs-darkest-sky.png", { type: "image/png" });
    const url = shareUrl(locale, choice);
    const text = de ? `Ich sehe ${yoursCount} von ${darkestCount} Sternen. Wie viele siehst du?` : `I can see ${yoursCount} of ${darkestCount} stars. How many can you see?`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url}` });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    setStatus(de ? "Bild gespeichert." : "Image saved.");
  }

  async function copyLink() {
    if (!choice) return;
    try {
      await navigator.clipboard.writeText(shareUrl(locale, choice));
      setStatus(de ? "Link kopiert." : "Link copied.");
    } catch {
      setStatus(de ? "Kopieren nicht möglich – bitte die Adresse aus der Adresszeile kopieren." : "Copying failed – please copy the address bar instead.");
    }
  }

  return (
    <div className="lp-comparison">
      <div className="lp-controls">
        {cities ? (
          <CitySearch locale={locale} cities={cities} selected={choice.city as EstimatedCity} onSelect={pickCity} />
        ) : (
          <label className="lp-city">
            <span>{de ? "Nächste Großstadt (für Sternbilder und Uhrzeit)" : "Nearest big city (sets which stars are up)"}</span>
            <select value={choice.city.id} onChange={(event) => { const next = findReferenceCity(event.target.value); if (next) pickCity(next); }}>
              {[...referenceCities].sort((left, right) => left.name[locale].localeCompare(right.name[locale], locale)).map((item) => <option key={item.id} value={item.id}>{item.name[locale]}</option>)}
            </select>
          </label>
        )}
        <fieldset className="lp-situations">
          <legend>{estimate !== null ? (de ? "Wie hell ist dein Himmel?" : "How bright is your sky?") : (de ? "Wo wohnst du?" : "Where do you live?")}</legend>
          {estimate !== null ? (
            <label className={`lp-estimate${estimated ? " active" : ""}`}>
              <input type="radio" name="lp-situation" value="estimate" checked={estimated} onChange={() => update({ sky: "estimate" })} />
              <strong>{de ? "Schätzung aus Satellitendaten" : "Satellite estimate"}</strong>
              <span>{de
                ? `Zentrum von ${cityName}: Bortle ${bortleForLimitingMagnitude(estimate)}, Sterne bis Helligkeit ${formatMagnitude(locale, estimate)}`
                : `Centre of ${cityName}: Bortle ${bortleForLimitingMagnitude(estimate)}, stars to magnitude ${formatMagnitude(locale, estimate)}`}</span>
            </label>
          ) : null}
          {estimate !== null ? <p className="lp-situations-or">{de ? "Oder wähle, wie du wohnst:" : "Or pick where you live:"}</p> : null}
          {skySituations.map((situation) => (
            <label key={situation.id} className={situation.id === sky.id ? "active" : undefined}>
              <input type="radio" name="lp-situation" value={situation.id} checked={situation.id === sky.id} onChange={() => update({ sky: situation })} />
              <strong>{situation.label[locale]}</strong>
              <span>{situation.hint[locale]}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <p className="lp-headline" aria-live="polite">
        {estimated
          ? (de
            ? <>Im Zentrum von {cityName} siehst du geschätzt etwa <strong>{yoursCount}</strong> Sterne. Unter dem dunkelsten Himmel wären es <strong>{darkestCount}</strong>. Das sind nur <strong>{percent} %</strong>.</>
            : <>In the centre of {cityName} you can see an estimated <strong>{yoursCount}</strong> stars. Under the darkest sky it would be <strong>{darkestCount}</strong>. That is just <strong>{percent}%</strong>.</>)
          : de
          ? <>Du siehst etwa <strong>{yoursCount}</strong> Sterne. Unter dem dunkelsten Himmel wären es <strong>{darkestCount}</strong>. Das sind nur <strong>{percent} %</strong>.</>
          : <>You can see about <strong>{yoursCount}</strong> stars. Under the darkest sky it would be <strong>{darkestCount}</strong>. That is just <strong>{percent}%</strong>.</>}
      </p>

      <div className="lp-stage" style={{ ["--lp-split" as string]: `${split}%` }}>
        <div className="lp-layer" ref={yoursRef}>
          <SkyCanvas snapshot={result.yours.snapshot} variant="destination" locale={locale} showConstellations={false} activeConstellationId={null} skyglow={sky.skyglow} />
        </div>
        <div className="lp-layer lp-layer-dark" ref={darkestRef}>
          <SkyCanvas snapshot={result.darkest.snapshot} variant="destination" locale={locale} showConstellations={false} activeConstellationId={null} />
        </div>
        <span className="lp-tag lp-tag-yours">{de ? "Dein Himmel" : "Your sky"}</span>
        <span className="lp-tag lp-tag-dark">{de ? "Dunkelster Himmel" : "Darkest sky"}</span>
        <span className="lp-divider" aria-hidden="true" />
        <input
          className="lp-range" type="range" min={0} max={100} step={1} value={split}
          onChange={(event) => setSplit(Number(event.target.value))}
          aria-label={de ? "Trennlinie zwischen deinem Himmel und dem dunkelsten Himmel verschieben" : "Move the divider between your sky and the darkest sky"}
        />
      </div>

      <p className="lp-meta">
        {de
          ? `${result.timing.live ? "Jetzt" : "Heute Nacht"}, ${time} Uhr Ortszeit in ${cityName}${result.timing.live ? "" : " (dunkelster Moment der Nacht)"}. Links: ${estimated ? "Satellitenschätzung fürs Zentrum" : situationName}, Bortle ${sky.bortle}, Sterne bis Helligkeit ${formatMagnitude(locale, sky.limitingMagnitude)}. Rechts: Bortle ${darkestSky.bortle}, Sterne bis ${formatMagnitude(locale, darkestSky.limitingMagnitude)}.`
          : `${result.timing.live ? "Now" : "Tonight"}, ${time} local time in ${cityName}${result.timing.live ? "" : " (darkest moment of the night)"}. Left: ${estimated ? "satellite estimate for the centre" : situationName}, Bortle ${sky.bortle}, stars to magnitude ${formatMagnitude(locale, sky.limitingMagnitude)}. Right: Bortle ${darkestSky.bortle}, stars to ${formatMagnitude(locale, darkestSky.limitingMagnitude)}.`}
        {result.yours.snapshot.moon.aboveHorizon ? (de ? " Der Mond steht gerade am Himmel und hellt ihn zusätzlich auf. Das ist hier nicht eingerechnet." : " The Moon is up and brightens the sky further. That is not included here.") : null}
      </p>

      <div className="lp-share">
        <button type="button" onClick={() => { void shareImage(); }}>{de ? "Vergleich als Bild teilen" : "Share as image"}</button>
        <button type="button" onClick={() => { void copyLink(); }}>{de ? "Link kopieren" : "Copy link"}</button>
        {status ? <span role="status">{status}</span> : null}
      </div>

      {nearest.length > 0 ? (
        <section className="lp-nearest" aria-labelledby="lp-nearest-title">
          <h2 id="lp-nearest-title">{de ? `Dunkle Himmel in der Nähe von ${cityName}` : `Dark skies near ${cityName}`}</h2>
          <div className="lp-nearest-grid">
            {nearest.map((destination) => (
              <a className="lp-nearest-card" href={localizedLinks.destination(locale, destination.slug)} key={destination.slug}>
                <span>{de ? `ca. ${formatCount(locale, Math.round(destination.km / 10) * 10)} km` : `about ${formatCount(locale, Math.round(destination.km / 10) * 10)} km`}</span>
                <strong>{destination.name} →</strong>
                <small>{destination.countryName}</small>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
