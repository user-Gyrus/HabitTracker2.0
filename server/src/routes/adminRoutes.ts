import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  setStreakCount,
  setStreakFreezes,
  setStreakState,
  addHistoryDays,
  resetStreakData,
  applyPreset,
  seedTestFriends,
} from "../controllers/adminController";

const router = express.Router();

/**
 * ADMIN ROUTES FOR DEVELOPMENT/STAGING
 * These routes allow manual manipulation of streak data for testing.
 * All routes require authentication.
 */

router.post("/streak/set-count", protect, setStreakCount);
router.post("/streak/set-freezes", protect, setStreakFreezes);
router.post("/streak/set-state", protect, setStreakState);
router.post("/streak/add-history", protect, addHistoryDays);
router.post("/streak/reset", protect, resetStreakData);
router.post("/streak/preset", protect, applyPreset);
router.post("/seed-friends", protect, seedTestFriends);

export default router;
