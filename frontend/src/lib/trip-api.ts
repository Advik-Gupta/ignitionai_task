import { apiFetch } from "@/lib/api";

export type TripStatus = "active" | "completed";

export type TripEventType =
  | "harsh_braking"
  | "sharp_turn"
  | "over_speeding"
  | "idle";

export type Trip = {
  id: string;
  driverName: string | null;
  demo: boolean;
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

export type StreakResponse = {
  driverName: string | null;
  timeZone: string;
  minScore: number;
  streak: {
    current: number;
    best: number;
    lastQualifyingDay: string | null;
  };
};

export type TripRoute = {
  tripId: string;
  pointCount: number;
  path: Array<[number, number]>;
};

export type LeaderboardEntry = {
  rank: number;
  driverName: string;
  averageScore: number;
  bestScore: number;
  tripCount: number;
  lastTripAt: string;
};

export async function startTrip(driverName: string | null): Promise<Trip> {
  const { trip } = await apiFetch<{ trip: Trip }>("/api/trips/start", {
    method: "POST",
    body: JSON.stringify({ driverName }),
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

export function getStreak(driverName: string | null): Promise<StreakResponse> {
  const params = new URLSearchParams({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (driverName) params.set("driver", driverName);
  return apiFetch<StreakResponse>(`/api/streak?${params.toString()}`);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { drivers } = await apiFetch<{ drivers: LeaderboardEntry[] }>(
    "/api/leaderboard",
  );
  return drivers;
}

export function getTripRoute(tripId: string): Promise<TripRoute> {
  return apiFetch<TripRoute>(`/api/trips/${tripId}/route`);
}
