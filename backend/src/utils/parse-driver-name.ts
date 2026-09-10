import { HttpError } from "./http-error";

export const MAX_DRIVER_NAME_LENGTH = 40;

export function normalizeDriverName(
  value: unknown,
  field = "driverName",
): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== "string") {
    throw HttpError.badRequest(`${field} must be a string`);
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (name.length === 0) return null;

  if (name.length > MAX_DRIVER_NAME_LENGTH) {
    throw HttpError.badRequest(
      `${field} must be at most ${MAX_DRIVER_NAME_LENGTH} characters`,
    );
  }

  return name;
}
