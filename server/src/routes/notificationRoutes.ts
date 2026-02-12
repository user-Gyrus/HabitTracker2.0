import express from "express";
import { getNotifications, markNotificationsRead } from "../controllers/notificationController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markNotificationsRead);

export default router;
