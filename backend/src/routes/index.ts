import { Router } from "express";
import driverRouter from "./driver.routes";
import healthRouter from "./health.routes";
import tripRouter from "./trip.routes";

const router = Router();

router.use(healthRouter);
router.use(tripRouter);
router.use(driverRouter);

export default router;
