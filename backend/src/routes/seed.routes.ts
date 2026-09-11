import { Router } from "express";
import { seedSampleTrips } from "../controllers/seed.controller";

const router = Router();

router.post("/seed", seedSampleTrips);

export default router;
