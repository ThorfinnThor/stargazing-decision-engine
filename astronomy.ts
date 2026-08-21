import { Body, Equator, Horizon, Observer } from "astronomy-engine";

/** Geometric altitude of the Sun's center. Refraction is intentionally disabled. */
export function sunAltitudeDeg(date: Date, lat: number, lon: number, elevationM = 0) {
  const observer = new Observer(lat, lon, elevationM);
  const equatorial = Equator(Body.Sun, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
}
