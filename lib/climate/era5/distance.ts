const earthRadiusKm = 6371.0088;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function haversineKm(latA: number, lonA: number, latB: number, lonB: number) {
  const deltaLat = radians(latB - latA);
  const deltaLon = radians(lonB - lonA);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
