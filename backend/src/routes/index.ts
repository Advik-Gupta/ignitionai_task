import { Router } from 'express';
import healthRouter from './health.routes';
import tripRouter from './trip.routes';

const router = Router();

router.use(healthRouter);
router.use(tripRouter);

export default router;
