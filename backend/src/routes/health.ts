import { Router } from 'express';
import { databaseState } from '../db/connection';

const router = Router();

router.get('/health', (_req, res) => {
  const database = databaseState();
  res.json({
    status: 'ok',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
