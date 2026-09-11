import { TripModel } from "../models/trip.model";
import { TripEventModel } from "../models/trip-event.model";
import { TripPointModel } from "../models/trip-point.model";
import { simulateDrive, type DrivingStyle } from "./drive-simulator.service";
import {
  detectEvents,
  summarizeEvents,
  type EventSummary,
} from "./event-detection.service";
import { routeDistanceMeters } from "./route-distance.service";
import { scoreTrip } from "./scoring.service";

type SampleTrip = {
  driverName: string;
  style: DrivingStyle;
  daysAgo: number;
  startHour: number;
  minutes: number;
};

export type SampleTripSummary = {
  id: string;
  driverName: string;
  startTime: Date;
  score: number | null;
  eventCounts: EventSummary;
};

export type SeedResult = {
  removed: number;
  inserted: SampleTripSummary[];
};

const ORIGIN = { lat: 12.9716, lng: 77.5946 };

const SAMPLE_TRIPS: SampleTrip[] = [
  { driverName: "Meera", style: "careful", daysAgo: 0, startHour: 8, minutes: 14 },
  { driverName: "Meera", style: "careful", daysAgo: 1, startHour: 9, minutes: 18 },
  { driverName: "Meera", style: "careful", daysAgo: 2, startHour: 8, minutes: 11 },
  { driverName: "Meera", style: "careful", daysAgo: 3, startHour: 18, minutes: 22 },
  { driverName: "Meera", style: "average", daysAgo: 4, startHour: 19, minutes: 16 },
  { driverName: "Aarav", style: "average", daysAgo: 0, startHour: 10, minutes: 12 },
  { driverName: "Aarav", style: "careful", daysAgo: 1, startHour: 17, minutes: 20 },
  { driverName: "Aarav", style: "average", daysAgo: 3, startHour: 9, minutes: 15 },
  { driverName: "Aarav", style: "aggressive", daysAgo: 6, startHour: 22, minutes: 9 },
  { driverName: "Kabir", style: "aggressive", daysAgo: 1, startHour: 23, minutes: 13 },
  { driverName: "Kabir", style: "average", daysAgo: 2, startHour: 7, minutes: 10 },
  { driverName: "Kabir", style: "aggressive", daysAgo: 5, startHour: 20, minutes: 17 },
];

let resetInProgress: Promise<SeedResult> | null = null;

function tripStart(sample: SampleTrip, now: Date): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - sample.daysAgo);
  start.setHours(sample.startHour, 0, 0, 0);
  const latestPossibleStart = now.getTime() - (sample.minutes + 5) * 60_000;
  return new Date(Math.min(start.getTime(), latestPossibleStart));
}

function originFor(index: number) {
  return {
    lat: ORIGIN.lat + ((index % 4) - 1.5) * 0.01,
    lng: ORIGIN.lng + ((index % 3) - 1) * 0.012,
  };
}

async function removeSampleTrips(): Promise<number> {
  const trips = await TripModel.find({ demo: true }).select({ _id: 1 }).lean();
  const tripIds = trips.map((trip) => trip._id);

  await TripPointModel.deleteMany({ tripId: { $in: tripIds } });
  await TripEventModel.deleteMany({ tripId: { $in: tripIds } });
  await TripModel.deleteMany({ _id: { $in: tripIds } });

  return tripIds.length;
}

async function insertSampleTrip(
  sample: SampleTrip,
  index: number,
  now: Date,
): Promise<SampleTripSummary> {
  const startTime = tripStart(sample, now);
  const points = simulateDrive({
    style: sample.style,
    start: startTime,
    durationSeconds: sample.minutes * 60,
    origin: originFor(index),
    seed: index + 1,
  });
  const events = detectEvents(points);
  const { score } = scoreTrip(events);

  const trip = await TripModel.create({
    driverName: sample.driverName,
    demo: true,
    startTime,
    endTime: new Date(startTime.getTime() + points.length * 1000),
    status: "completed",
    rawPointCount: points.length,
    distanceMeters: routeDistanceMeters(points),
    score,
  });

  await TripPointModel.insertMany(
    points.map((point) => ({ ...point, tripId: trip._id })),
  );
  await TripEventModel.insertMany(
    events.map((event) => ({ ...event, tripId: trip._id })),
  );

  return {
    id: trip.id as string,
    driverName: sample.driverName,
    startTime,
    score: trip.score ?? null,
    eventCounts: summarizeEvents(events),
  };
}

async function replaceSampleTrips(): Promise<SeedResult> {
  const removed = await removeSampleTrips();
  const now = new Date();
  const inserted: SampleTripSummary[] = [];

  for (const [index, sample] of SAMPLE_TRIPS.entries()) {
    inserted.push(await insertSampleTrip(sample, index, now));
  }

  return { removed, inserted };
}

export function resetSampleTrips(): Promise<SeedResult> {
  resetInProgress ??= replaceSampleTrips().finally(() => {
    resetInProgress = null;
  });
  return resetInProgress;
}

export async function seedIfEmpty(): Promise<SeedResult | null> {
  const hasTrips = await TripModel.exists({});
  return hasTrips ? null : resetSampleTrips();
}
