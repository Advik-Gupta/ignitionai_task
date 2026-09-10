import type { RequestHandler } from "express";
import { LEADERBOARD_LIMIT, STREAK_MIN_SCORE } from "../config/gamification";
import { TripModel } from "../models/trip.model";
import {
  computeStreak,
  isValidTimeZone,
  toDayKey,
} from "../services/streak.service";
import { HttpError } from "../utils/http-error";
import { normalizeDriverName } from "../utils/parse-driver-name";
import {
  serializeLeaderboard,
  type LeaderboardRow,
} from "../views/driver.view";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getStreak: RequestHandler = async (req, res) => {
  const driverName = normalizeDriverName(req.query.driver, "driver");
  const timeZone =
    typeof req.query.timeZone === "string" ? req.query.timeZone : "UTC";

  if (!isValidTimeZone(timeZone)) {
    throw HttpError.badRequest(`"${timeZone}" is not a valid time zone`);
  }

  const trips = await TripModel.find({
    status: "completed",
    score: { $gte: STREAK_MIN_SCORE },
    ...(driverName
      ? { driverName: new RegExp(`^${escapeRegex(driverName)}$`, "i") }
      : {}),
  })
    .select({ startTime: 1 })
    .lean();

  const streak = computeStreak(
    trips.map((trip) => toDayKey(trip.startTime, timeZone)),
    toDayKey(new Date(), timeZone),
  );

  res.json({ driverName, timeZone, minScore: STREAK_MIN_SCORE, streak });
};

export const getLeaderboard: RequestHandler = async (_req, res) => {
  const rows = await TripModel.aggregate<LeaderboardRow>([
    {
      $match: {
        status: "completed",
        score: { $ne: null },
        driverName: { $ne: null },
      },
    },
    { $sort: { startTime: -1 } },
    {
      $group: {
        _id: { $toLower: "$driverName" },
        driverName: { $first: "$driverName" },
        averageScore: { $avg: "$score" },
        bestScore: { $max: "$score" },
        tripCount: { $sum: 1 },
        lastTripAt: { $max: "$startTime" },
      },
    },
    { $sort: { averageScore: -1, tripCount: -1 } },
    { $limit: LEADERBOARD_LIMIT },
  ]);

  res.json({ drivers: serializeLeaderboard(rows) });
};
