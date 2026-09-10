import { HttpError } from "./http-error";

export const MAX_POINTS_PER_BATCH = 500;

export type ParsedPoint = {
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
};

function requireNumber(value: unknown, field: string, index: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw HttpError.badRequest(
      `points[${index}].${field} must be a finite number`,
    );
  }
  return value;
}

function optionalNumber(
  value: unknown,
  field: string,
  index: number,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw HttpError.badRequest(
      `points[${index}].${field} must be a finite number or null`,
    );
  }
  return value;
}

function requireTimestamp(value: unknown, index: number): Date {
  const date =
    typeof value === "number"
      ? new Date(value)
      : typeof value === "string"
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw HttpError.badRequest(
      `points[${index}].timestamp must be an ISO date string or epoch milliseconds`,
    );
  }
  return date;
}

export function parsePointBatch(body: unknown): ParsedPoint[] {
  const points = (body as { points?: unknown } | null)?.points;

  if (!Array.isArray(points)) {
    throw HttpError.badRequest("Body must be { points: [...] }");
  }

  if (points.length === 0) {
    throw HttpError.badRequest("points must contain at least one sample");
  }

  if (points.length > MAX_POINTS_PER_BATCH) {
    throw HttpError.badRequest(
      `points may contain at most ${MAX_POINTS_PER_BATCH} samples per request`,
    );
  }

  return points.map((raw, index) => {
    if (typeof raw !== "object" || raw === null) {
      throw HttpError.badRequest(`points[${index}] must be an object`);
    }
    const point = raw as Record<string, unknown>;

    const lat = requireNumber(point.lat, "lat", index);
    const lng = requireNumber(point.lng, "lng", index);
    if (lat < -90 || lat > 90)
      throw HttpError.badRequest(`points[${index}].lat is out of range`);
    if (lng < -180 || lng > 180)
      throw HttpError.badRequest(`points[${index}].lng is out of range`);

    return {
      timestamp: requireTimestamp(point.timestamp, index),
      lat,
      lng,
      speed: optionalNumber(point.speed, "speed", index),
      accelX: optionalNumber(point.accelX, "accelX", index),
      accelY: optionalNumber(point.accelY, "accelY", index),
      accelZ: optionalNumber(point.accelZ, "accelZ", index),
    };
  });
}
