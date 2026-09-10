import type { RequestHandler } from 'express';
import { databaseState } from '../config/database';

export const getHealth: RequestHandler = (_req, res) => {
  res.json({
    status: 'ok',
    database: databaseState(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
