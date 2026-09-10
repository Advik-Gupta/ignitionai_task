import { Router } from "express";
import { getLeaderboard, getStreak } from "../controllers/driver.controller";

const router = Router();

router.get("/streak", getStreak);
router.get("/leaderboard", getLeaderboard);

export default router;
