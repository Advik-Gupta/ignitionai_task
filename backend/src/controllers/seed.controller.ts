import type { RequestHandler } from "express";
import { resetSampleTrips } from "../services/sample-data.service";
import { serializeSeedResult } from "../views/seed.view";

export const seedSampleTrips: RequestHandler = async (_req, res) => {
  const result = await resetSampleTrips();
  res.status(201).json(serializeSeedResult(result));
};
