"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SkyCanvas } from "./sky-canvas";
import { brightStars } from "@/lib/astronomy/catalog";
import {
  computeSkyComparison, darkestSky, defaultReferenceCity, defaultSituationId, distanceKm, findReferenceCity, findSituation,
  referenceCities, referenceCityLocation, selectComparisonInstant, skySituations, type ReferenceCity, type SkySituation,
} from "@/lib/astronomy/light-pollution";
import { roundedCurrentMinuteIso } from "@/lib/astronomy/selection";
import { formatLocalClockTime } from "@/lib/astronomy/time";
import type { CatalogStar, FaintStarCatalog } from "@/lib/astronomy/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";

export type ComparisonDestination = { slug: string; name: string; countryName: string; lat: number; lon: number };

type Choice = { city: ReferenceCity; situation: SkySituation; nowIso: string };

const faintStarsUrl = "/data/stargazing/astronomy/faint-stars.json";

function readChoiceFromUrl(locale: Locale): Choice {
  const params = new URLSearchParams(window.location.search);
  let timeZone: string | null = null;
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { timeZone = null; }
  return {
    city: findReferenceCity(params.get("city")) ?? defaultReferenceCity(locale, timeZone),
    situation: findSituation(params.get("sky")) ?? (findSituation(defaultSituationId) as SkySituation),
    nowIso: roundedCurrentMinuteIso(),
  };
}

function formatCount(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US").format(value);
}

function shareUrl(locale: Locale, choice: Choice) {
  const url = new URL(localizedLinks.lightPollutionComparison(locale), window.location.origin);
  url.searchParams.set("sky", choice.situation.id);
  url.searchParams.set("city", choice.city.id);
  return url.toString();
}

export function LightPollutionComparison({ locale, destinations }: { locale: Locale; destinations: ComparisonDestination[] }) {
  const de = locale === "de";
  const [choice, setChoice] = useState<Choice | null>(null);
  const [stars, setStars] = useState<readonly CatalogStar[] | null>(null);
  const [split, setSplit] = useState(50);
  const [status, setStatus] = useState<string | null>(null);
  const yoursRef = useRef<HTMLDivElement>(null);
  const darkestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChoice(readChoiceFromUrl(locale));
    let cancelled = false;
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

  const update = (next: Partial<Omit<Choice, "nowIso">>) => {
    if (!choice) return;
    const merged = { ...choice, ...next };
    setChoice(merged);
    setStatus(null);
    try { window.history.replaceState(null, "", `${window.location.pathname}?sky=${merged.situation.id}&city=${merged.city.id}`); } catch { /* history blocked */ }
  };

  const result = useMemo(() => {
    if (!choice || !stars) return null;
    const timing = selectComparisonInstant(referenceCityLocation(choice.city, darkestSky.limitingMagnitude), choice.nowIso);
    return { timing, ...computeSkyComparison({ city: choice.city, situation: choice.situation, instantIso: timing.instantIso, stars }) };
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
  const situationName = choice.situation.label[locale];
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
    context.fillText(de ? `Mein Himmel · ${situationName}, ${cityName}` : `My sky · ${situationName}, ${cityName}`, 300, 56);
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
        <fieldset className="lp-situations">
          <legend>{de ? "Wo wohnst du?" : "Where do you live?"}</legend>
          {skySituations.map((situation) => (
            <label key={situation.id} className={situation.id === choice.situation.id ? "active" : undefined}>
              <input type="radio" name="lp-situation" value={situation.id} checked={situation.id === choice.situation.id} onChange={() => update({ situation })} />
              <strong>{situation.label[locale]}</strong>
              <span>{situation.hint[locale]}</span>
            </label>
          ))}
        </fieldset>
        <label className="lp-city">
          <span>{de ? "Nächste Großstadt (für Sternbilder und Uhrzeit)" : "Nearest big city (sets which stars are up)"}</span>
          <select value={choice.city.id} onChange={(event) => { const next = findReferenceCity(event.target.value); if (next) update({ city: next }); }}>
            {[...referenceCities].sort((left, right) => left.name[locale].localeCompare(right.name[locale], locale)).map((item) => <option key={item.id} value={item.id}>{item.name[locale]}</option>)}
          </select>
        </label>
      </div>

      <p className="lp-headline" aria-live="polite">
        {de
          ? <>Du siehst etwa <strong>{yoursCount}</strong> Sterne. Unter dem dunkelsten Himmel wären es <strong>{darkestCount}</strong>. Das sind nur <strong>{percent} %</strong>.</>
          : <>You can see about <strong>{yoursCount}</strong> stars. Under the darkest sky it would be <strong>{darkestCount}</strong>. That is just <strong>{percent}%</strong>.</>}
      </p>

      <div className="lp-stage" style={{ ["--lp-split" as string]: `${split}%` }}>
        <div className="lp-layer" ref={yoursRef}>
          <SkyCanvas snapshot={result.yours.snapshot} variant="destination" locale={locale} showConstellations={false} activeConstellationId={null} skyglow={choice.situation.skyglow} />
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
          ? `${result.timing.live ? "Jetzt" : "Heute Nacht"}, ${time} Uhr Ortszeit in ${cityName}${result.timing.live ? "" : " (dunkelster Moment der Nacht)"}. Links: ${situationName}, Bortle ${choice.situation.bortle}, Sterne bis Helligkeit ${choice.situation.limitingMagnitude.toFixed(1).replace(".", ",")}. Rechts: Bortle ${darkestSky.bortle}, Sterne bis ${darkestSky.limitingMagnitude.toFixed(1).replace(".", ",")}.`
          : `${result.timing.live ? "Now" : "Tonight"}, ${time} local time in ${cityName}${result.timing.live ? "" : " (darkest moment of the night)"}. Left: ${situationName}, Bortle ${choice.situation.bortle}, stars to magnitude ${choice.situation.limitingMagnitude.toFixed(1)}. Right: Bortle ${darkestSky.bortle}, stars to ${darkestSky.limitingMagnitude.toFixed(1)}.`}
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
