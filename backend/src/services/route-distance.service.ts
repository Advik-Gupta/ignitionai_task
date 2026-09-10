import { DETECTION } from "../config/detection";

export type RoutePoint = {
  lat: number;
  lng: number;
  speed: number | null;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(from: RoutePoint, to: RoutePoint): number {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

function isStationary(point: RoutePoint): boolean {
  return point.speed !== null && point.speed <= DETECTION.idle.maxSpeedMps;
}

export function routeDistanceMeters(points: RoutePoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (isStationary(previous) && isStationary(current)) continue;
    total += haversineMeters(previous, current);
  }
  return Math.round(total);
}
