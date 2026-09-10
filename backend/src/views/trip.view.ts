import type { TripDocument } from '../models/trip.model';
import type { TripEventDocument } from '../models/trip-event.model';

function durationSeconds(start: Date, end: Date | null | undefined): number | null {
  if (!end) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

export function serializeTrip(trip: TripDocument) {
  return {
    id: trip.id as string,
    startTime: trip.startTime.toISOString(),
    endTime: trip.endTime ? trip.endTime.toISOString() : null,
    durationSeconds: durationSeconds(trip.startTime, trip.endTime),
    status: trip.status,
    rawPointCount: trip.rawPointCount,
    distanceMeters: trip.distanceMeters ?? null,
    score: trip.score,
    createdAt: trip.createdAt.toISOString(),
  };
}

export function serializeEvent(event: TripEventDocument) {
  return {
    id: event.id as string,
    tripId: event.tripId.toString(),
    type: event.type,
    timestamp: event.timestamp.toISOString(),
    lat: event.lat,
    lng: event.lng,
    severity: event.severity,
    rawValue: event.rawValue,
  };
}
