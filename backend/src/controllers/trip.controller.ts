import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../utils/http-error";
import { parsePointBatch } from "../utils/parse-points";
import { serializeEvent, serializeTrip } from "../views/trip.view";
import { TripModel, type TripDocument } from "../models/trip.model";
import { TripEventModel } from "../models/trip-event.model";
import { TripPointModel } from "../models/trip-point.model";

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

  trip.endTime = new Date();
  trip.status = "completed";
  await trip.save();

  res.json({ trip: serializeTrip(trip) });
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

  res.json({
    trip: serializeTrip(trip),
    events: events.map(serializeEvent),
  });
};
