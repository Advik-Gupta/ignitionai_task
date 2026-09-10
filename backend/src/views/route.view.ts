export type RouteSourcePoint = {
  lat: number;
  lng: number;
};

export function serializeRoute(
  points: RouteSourcePoint[],
  maxPoints: number,
): Array<[number, number]> {
  const stride = Math.max(1, Math.ceil(points.length / maxPoints));
  const lastIndex = points.length - 1;

  return points
    .filter((_, index) => index % stride === 0 || index === lastIndex)
    .map((point) => [point.lat, point.lng]);
}
