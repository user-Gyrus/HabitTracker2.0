import express from "express";
import { protect } from "../middleware/authMiddleware";
import { 
    createHabit, 
    getHabits, 
    updateHabit, 
    deleteHabit,
    applyStreakFreeze
} from "../controllers/habitController";

const router = express.Router();

router.route("/")
    .post(protect, createHabit)
    .get(protect, getHabits);

router.route("/freeze")
    .post(protect, applyStreakFreeze);

router.route("/:id")
    .put(protect, updateHabit)
    .delete(protect, deleteHabit);

export default router;
