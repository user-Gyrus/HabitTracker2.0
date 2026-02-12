import express from "express";
import { protect } from "../middleware/authMiddleware";
import { 
    searchUser, 
    addFriend, 
    removeFriend, 
    getFriends,
    getFriendHabits,
    getSuggestedFriends,
    sendFireReaction
} from "../controllers/friendController";

const router = express.Router();

router.get("/search", protect, searchUser);
router.get("/suggestions", protect, getSuggestedFriends);
router.post("/add", protect, addFriend);
router.post("/remove", protect, removeFriend);
router.post("/react", protect, sendFireReaction);
router.get("/", protect, getFriends);
router.get("/:friendId/habits", protect, getFriendHabits);

export default router;
