import type { RequestHandler } from "express";
import { databaseState } from "../config/database";

export const getHealth: RequestHandler = (_req, res) => {
  const database = databaseState();
  const healthy = database === "connected";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
