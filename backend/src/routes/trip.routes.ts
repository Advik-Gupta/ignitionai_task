import { Router } from 'express';
import { endTrip, getTrip, ingestPoints, listTrips, startTrip } from '../controllers/trip.controller';

const router = Router();

router.post('/trips/start', startTrip);
router.post('/trips/:id/points', ingestPoints);
router.post('/trips/:id/end', endTrip);
router.get('/trips', listTrips);
router.get('/trips/:id', getTrip);

export default router;
