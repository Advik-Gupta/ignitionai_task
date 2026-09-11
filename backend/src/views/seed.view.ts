import type { SeedResult } from "../services/sample-data.service";

export function serializeSeedResult({ removed, inserted }: SeedResult) {
  return {
    removed,
    inserted: inserted.length,
    trips: inserted.map((trip) => ({
      id: trip.id,
      driverName: trip.driverName,
      startTime: trip.startTime.toISOString(),
      score: trip.score,
    })),
  };
}
