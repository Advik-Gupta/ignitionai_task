import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../utils/http-error";
import { parsePointBatch } from "../utils/parse-points";
import { serializeEvent, serializeTrip } from "../views/trip.view";
import { TripModel, type TripDocument } from "../models/trip.model";
import { TripEventModel } from "../models/trip-event.model";
import { TripPointModel } from "../models/trip-point.model";
import {
  detectEvents,
  summarizeEvents,
  type DetectionPoint,
} from "../services/event-detection.service";
import { scoreTrip } from "../services/scoring.service";
import { routeDistanceMeters } from "../services/route-distance.service";

const TRIP_LIST_LIMIT = 50;

type TripParams = { id: string };

async function loadTrip(id: string): Promise<TripDocument> {
  if (!isValidObjectId(id)) {
    throw HttpError.badRequest(`"${id}" is not a valid trip id`);
  }
  const trip = await TripModel.findById(id);
  if (!trip) {
    throw HttpError.notFound(`No trip with id ${id}`);
  }
  return trip;
}

async function loadDetectionPoints(
  trip: TripDocument,
): Promise<DetectionPoint[]> {
  const points = await TripPointModel.find({ tripId: trip._id })
    .sort({ timestamp: 1 })
    .lean();

  return points.map((point) => ({
    timestamp: point.timestamp,
    lat: point.lat,
    lng: point.lng,
    speed: point.speed ?? null,
    accelX: point.accelX ?? null,
    accelY: point.accelY ?? null,
    accelZ: point.accelZ ?? null,
  }));
}

// starts a trip
export const startTrip: RequestHandler = async (_req, res) => {
  const trip = await TripModel.create({ startTime: new Date() });
  res.status(201).json({ trip: serializeTrip(trip) });
};

// get raw sensor samples
export const ingestPoints: RequestHandler<TripParams> = async (req, res) => {
  const trip = await loadTrip(req.params.id);

  if (trip.status !== "active") {
    throw HttpError.conflict(
      "Trip has already ended and cannot accept more points",
    );
  }

  const points = parsePointBatch(req.body);
  await TripPointModel.insertMany(
    points.map((point) => ({ ...point, tripId: trip._id })),
  );

  // $inc rather than save() so overlapping batches from a flaky connection
  // cannot clobber each other's count.
  const updated = await TripModel.findByIdAndUpdate(
    trip._id,
    { $inc: { rawPointCount: points.length } },
    { new: true },
  );

  res.status(201).json({
    inserted: points.length,
    rawPointCount: updated?.rawPointCount ?? trip.rawPointCount,
  });
};

// end trip
export const endTrip: RequestHandler<TripParams> = async (req, res) => {
  const trip = await loadTrip(req.params.id);

  if (trip.status === "completed") {
    throw HttpError.conflict("Trip has already ended");
  }

  const points = await loadDetectionPoints(trip);
  const detected = detectEvents(points);
  const summary = summarizeEvents(detected);
  const { score, totalPenalty, penalties } = scoreTrip(detected);

  await TripEventModel.deleteMany({ tripId: trip._id });
  const events = await TripEventModel.insertMany(
    detected.map((event) => ({ ...event, tripId: trip._id })),
  );

  trip.endTime = new Date();
  trip.status = "completed";
  trip.score = points.length > 0 ? score : null;
  trip.distanceMeters = points.length > 0 ? routeDistanceMeters(points) : null;
  await trip.save();

  console.log(
    `Trip ${trip.id} ended with ${points.length} points, score ${trip.score ?? "n/a"} (-${totalPenalty}):`,
    Object.entries(summary)
      .map(([type, count]) => `${type}=${count}`)
      .join(" "),
  );

  res.json({
    trip: serializeTrip(trip),
    summary,
    penalties,
    totalPenalty,
    events: events.map(serializeEvent),
  });
};

// get all treps
export const listTrips: RequestHandler = async (_req, res) => {
  const trips = await TripModel.find()
    .sort({ startTime: -1 })
    .limit(TRIP_LIST_LIMIT);
  res.json({ trips: trips.map(serializeTrip) });
};

// get trip by id
export const getTrip: RequestHandler<TripParams> = async (req, res) => {
  const trip = await loadTrip(req.params.id);
  const events = await TripEventModel.find({ tripId: trip._id }).sort({
    timestamp: 1,
  });
  const { penalties, totalPenalty } = scoreTrip(events);

  res.json({
    trip: serializeTrip(trip),
    summary: summarizeEvents(events),
    penalties,
    totalPenalty,
    events: events.map(serializeEvent),
  });
};
