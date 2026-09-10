import { apiFetch } from "@/lib/api";

export type TripStatus = "active" | "completed";

export type TripEventType =
  | "harsh_braking"
  | "sharp_turn"
  | "over_speeding"
  | "idle";

export type Trip = {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  status: TripStatus;
  rawPointCount: number;
  distanceMeters: number | null;
  score: number | null;
  createdAt: string;
};

export type TripEvent = {
  id: string;
  tripId: string;
  type: TripEventType;
  timestamp: string;
  lat: number;
  lng: number;
  severity: number;
  rawValue: number;
};

export type EventTypeTotals = Record<TripEventType, number>;

export type TripDetail = {
  trip: Trip;
  summary: EventTypeTotals;
  penalties: EventTypeTotals;
  totalPenalty: number;
  events: TripEvent[];
};

export type TripPointPayload = {
  timestamp: number;
  lat: number;
  lng: number;
  speed: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
};

export async function startTrip(): Promise<Trip> {
  const { trip } = await apiFetch<{ trip: Trip }>("/api/trips/start", {
    method: "POST",
  });
  return trip;
}

export function uploadPoints(
  tripId: string,
  points: TripPointPayload[],
  options: { keepalive?: boolean } = {},
) {
  return apiFetch<{ inserted: number; rawPointCount: number }>(
    `/api/trips/${tripId}/points`,
    {
      method: "POST",
      body: JSON.stringify({ points }),
      keepalive: options.keepalive,
    },
  );
}

export async function endTrip(tripId: string): Promise<Trip> {
  const { trip } = await apiFetch<{ trip: Trip }>(`/api/trips/${tripId}/end`, {
    method: "POST",
  });
  return trip;
}

export async function listTrips(): Promise<Trip[]> {
  const { trips } = await apiFetch<{ trips: Trip[] }>("/api/trips");
  return trips;
}

export function getTrip(tripId: string): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/api/trips/${tripId}`);
}
