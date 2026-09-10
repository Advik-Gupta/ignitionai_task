import mongoose from "mongoose";
import { env } from "../config/env";
import { connectToDatabase } from "../config/database";
import { TripModel } from "../models/trip.model";
import { TripEventModel } from "../models/trip-event.model";
import { TripPointModel } from "../models/trip-point.model";
import {
  detectEvents,
  summarizeEvents,
} from "../services/event-detection.service";
import { routeDistanceMeters } from "../services/route-distance.service";
import { scoreTrip } from "../services/scoring.service";
import { simulateDrive, type DrivingStyle } from "./simulate-drive";

type SampleTrip = {
  driverName: string;
  style: DrivingStyle;
  daysAgo: number;
  startHour: number;
  minutes: number;
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

async function removePreviousSamples(): Promise<number> {
  const trips = await TripModel.find({ demo: true }).select({ _id: 1 }).lean();
  const tripIds = trips.map((trip) => trip._id);

  await TripPointModel.deleteMany({ tripId: { $in: tripIds } });
  await TripEventModel.deleteMany({ tripId: { $in: tripIds } });
  await TripModel.deleteMany({ _id: { $in: tripIds } });

  return tripIds.length;
}

async function insertSampleTrip(sample: SampleTrip, index: number, now: Date) {
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

  return { trip, events };
}

async function seed() {
  await connectToDatabase(env.mongoUri);

  const removed = await removePreviousSamples();
  if (removed > 0) {
    console.log(`Removed ${removed} previous sample trips`);
  }

  const now = new Date();
  for (const [index, sample] of SAMPLE_TRIPS.entries()) {
    const { trip, events } = await insertSampleTrip(sample, index, now);
    const counts = Object.entries(summarizeEvents(events))
      .map(([type, count]) => `${type}=${count}`)
      .join(" ");
    console.log(
      `${sample.driverName.padEnd(6)} ${trip.startTime.toLocaleString()}  score ${String(trip.score).padStart(3)}  ${counts}`,
    );
  }

  console.log(`Inserted ${SAMPLE_TRIPS.length} sample trips`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
