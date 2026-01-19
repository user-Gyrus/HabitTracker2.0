import express from "express";
import { subscribe, unsubscribe, sendTestNotification } from "../controllers/pushController";

const router = express.Router();

// POST /api/push/subscribe
router.post("/subscribe", subscribe);

// POST /api/push/unsubscribe
router.post("/unsubscribe", unsubscribe);

// POST /api/push/test
router.post("/test", sendTestNotification);

export default router;
