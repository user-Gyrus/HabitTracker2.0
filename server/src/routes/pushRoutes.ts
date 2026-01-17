import express from "express";
import { subscribe, unsubscribe } from "../controllers/pushController";

const router = express.Router();

// POST /api/push/subscribe
router.post("/subscribe", subscribe);

// POST /api/push/unsubscribe
router.post("/unsubscribe", unsubscribe);

export default router;
