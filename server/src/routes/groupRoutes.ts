import express from "express";
import { protect } from "../middleware/authMiddleware";
import { createGroup, getUserGroups, leaveGroup, deleteGroup, addMemberToGroup, linkHabitToGroup, getGroupById, joinGroupByCode, transferOwnership } from "../controllers/groupController";

const router = express.Router();

router.post("/create", protect, createGroup);
router.get("/", protect, getUserGroups);
router.post("/join", protect, joinGroupByCode);
router.get("/:groupId", protect, getGroupById);
router.post("/leave", protect, leaveGroup);
router.post("/add-member", protect, addMemberToGroup);
router.post("/link-habit", protect, linkHabitToGroup);
router.delete("/:groupId", protect, deleteGroup);
router.put("/:groupId/transfer-ownership", protect, transferOwnership);

export default router;
