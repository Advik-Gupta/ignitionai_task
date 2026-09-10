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

export function getTrip(tripId: string) {
  return apiFetch<{ trip: Trip; events: TripEvent[] }>(`/api/trips/${tripId}`);
}
