import express from "express";
import { authUser, registerUser, updateUserProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

import passport from "passport";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", authUser);
router.put("/profile", protect, updateUserProfile);

// Google Auth
// Google Auth
router.get("/google", (req, res, next) => {
  const referer = req.get('referer');
  // Default to localhost:5173 if no referer, but try to use the actual origin
  const origin = referer ? new URL(referer).origin : "http://localhost:5173";
  const state = Buffer.from(JSON.stringify({ origin })).toString('base64');
  
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    prompt: "select_account",
    state: state 
  })(req, res, next);
});

import Streak from "../models/Streak"; // Ensure this import exists at top

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    // Successful authentication, redirect home with token
    const user: any = req.user;
    
    // Fetch user's streak
    let streakCount = 0;
    let lastCompletedDate: Date | null = null;
    try {
        const streakDoc = await Streak.findOne({ user: user._id });
        if (streakDoc) {
            streakCount = streakDoc.streakCount;
            lastCompletedDate = streakDoc.lastCompletedDate || null;
        } else {
             // Create initial streak doc if it doesn't exist (e.g. new google user)
             await Streak.create({
                 user: user._id,
                 username: user.username || user.displayName || "Unknown", // Ensure username is present
                 streakCount: 0,
                 history: []
             });
        }
    } catch (err) {
        console.error("Error fetching streak in google callback", err);
    }

     const token = require("../utils/generateToken").default(user._id.toString());
     
     // Redirect to frontend with token, streak, and lastCompletedDate
     const dateStr = lastCompletedDate ? lastCompletedDate.toISOString() : "";
     
     // Decode origin from state
     let origin = "http://localhost:5173";
     if (req.query.state) {
        try {
           const decoded = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
           if (decoded.origin) origin = decoded.origin;
        } catch(e) {
           console.error("Error decoding state:", e);
        }
     }

     res.redirect(`${origin}/login?token=${token}&id=${user._id}&username=${user.username}&displayName=${user.displayName}&friendCode=${user.friendCode}&streak=${streakCount}&lastCompletedDate=${dateStr}`);
  }
);
import { getISTDate, getYesterdayISTDate } from "../utils/dateUtils";

// @desc    Get current user data (including streak history)
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req: any, res) => {
    try {
        const user = req.user;
        let streakCount = 0;
        let streakHistory: string[] = [];
        let lastCompletedDate: Date | null = null;
        let lastCompletedDateIST: string | null = null;
        
        let streakDoc = await Streak.findOne({ user: user._id });
        
        // Auto-create if missing
        if (!streakDoc) {
             streakDoc = await Streak.create({
                 user: user._id,
                 username: user.username || user.displayName || "User",
                 streakCount: 0,
                 history: []
             });
        }

        streakCount = streakDoc.streakCount;
        lastCompletedDate = streakDoc.lastCompletedDate || null;
        lastCompletedDateIST = streakDoc.lastCompletedDateIST || null;
        streakHistory = streakDoc.history || [];

        // --- VALIDATION: Check if streak is broken ---
        // If last completed date IST is before yesterday (meaning we missed yesterday), streak should be 0.
        // Unless streak is already 0.
        
        if (streakCount > 0 && lastCompletedDateIST) {
            const todayIST = getISTDate();
            const yesterdayIST = getYesterdayISTDate(todayIST);
            
            // If last completed is NEITHER today NOR yesterday, it's broken.
            // (e.g. 2 days ago)
            if (lastCompletedDateIST !== todayIST && lastCompletedDateIST !== yesterdayIST) {
                console.log(`[Streak Check] Resetting streak for user ${user.username}. Last: ${lastCompletedDateIST}, Today: ${todayIST}`);
                streakDoc.streakCount = 0;
                // We keep history! Just reset the counter.
                await streakDoc.save();
                streakCount = 0;
            }
        }

        res.json({
            _id: user._id,
            username: user.username,
            display_name: user.displayName, // Normalize to snake_case for frontend
            email: user.email,
            friend_code: user.friendCode,
            streak: streakCount,
            streakHistory: streakHistory, // New field for calendar
            lastCompletedDate: lastCompletedDate
        });
    } catch (error) {
        console.error("Error in /me:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
