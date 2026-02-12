import express from "express";
import { authUser, registerUser, updateUserProfile, googleMobileLogin } from "../controllers/authController";
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
  // Use CLIENT_URL from environment, fallback to referer, then localhost
  const origin = referer ? new URL(referer).origin : (process.env.CLIENT_URL || "http://localhost:5173");
  const state = Buffer.from(JSON.stringify({ origin })).toString('base64');
  
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    prompt: "select_account",
    state: state 
  })(req, res, next);
});

import Streak from "../models/Streak"; // Ensure this import exists at top
import { calculateCurrentStreak } from "../utils/streakUtils";

router.post("/google/callback", googleMobileLogin);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    // Successful authentication, redirect home with token
    const user: any = req.user;
    
    // Fetch user's streak
    let streakCount = 0;
    let streakFreezes = 0;
    let lastCompletedDate: Date | null = null;
    try {
        const streakDoc = await Streak.findOne({ user: user._id });
        if (streakDoc) {
            streakCount = streakDoc.streakCount;
            streakFreezes = streakDoc.streakFreezes || 0;
            lastCompletedDate = streakDoc.lastCompletedDate || null;
        } else {
             // Create initial streak doc if it doesn't exist (e.g. new google user)
             await Streak.create({
                 user: user._id,
                 username: user.username || user.displayName || "Unknown", // Ensure username is present
                 streakCount: 0,
                 streakFreezes: 0,
                 frozenDays: [],
                 history: []
             });
        }
    } catch (err) {
        console.error("Error fetching streak in google callback", err);
    }
    
    // Recalculate streak if we have a valid user
    if (user) {
        try {
             const streakDoc = await Streak.findOne({ user: user._id });
             if (streakDoc) {
                 const calculatedStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays);
                 if (streakDoc.streakCount !== calculatedStreak) {
                     streakDoc.streakCount = calculatedStreak;
                     await streakDoc.save();
                 }
                 streakCount = calculatedStreak;
                 streakFreezes = streakDoc.streakFreezes || 0;
             }
        } catch (e) { console.error(e); }
    }

     const token = require("../utils/generateToken").default(user._id.toString());
     
     // Redirect to frontend with token, streak, streakFreezes, and lastCompletedDate
     const dateStr = lastCompletedDate ? lastCompletedDate.toISOString() : "";
     
     // Decode origin from state
     let origin = process.env.CLIENT_URL || "http://localhost:5173";
     if (req.query.state) {
        try {
           const decoded = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
           if (decoded.origin) origin = decoded.origin;
        } catch(e) {
           console.error("Error decoding state:", e);
        }
     }

     res.redirect(`${origin}/login?token=${token}&id=${user._id}&username=${user.username}&displayName=${user.displayName}&friendCode=${user.friendCode}&streak=${streakCount}&streakFreezes=${streakFreezes}&lastCompletedDate=${dateStr}`);
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
        // Use robust calculation utility with frozenDays
        const calculatedStreak = calculateCurrentStreak(streakHistory, streakDoc.frozenDays);
        
        if (streakCount !== calculatedStreak) {
            console.log(`[Streak Check] Correcting streak for user ${user.username}. Old: ${streakCount}, New: ${calculatedStreak}`);
            streakDoc.streakCount = calculatedStreak;
            await streakDoc.save();
            streakCount = calculatedStreak;
        }

        // Filter for today's reactions
        const todayIST = getISTDate();
        const receivedReactions = user.fireReactionsReceived ? user.fireReactionsReceived.filter((r: any) => r.date === todayIST) : [];

        res.json({
            _id: user._id,
            username: user.username,
            displayName: user.displayName, // Return both for compatibility or just camelCase
            display_name: user.displayName, // Keep for ProfileScreen interface
            email: user.email,
            friendCode: user.friendCode, // FIX: Frontend expects friendCode
            friend_code: user.friendCode, // Keep for safety
            streak: streakCount,
            streakHistory: streakHistory, // New field for calendar
            streakFreezes: streakDoc.streakFreezes || 0, // Add freeze count
            frozenDays: streakDoc.frozenDays || [], // Add frozen days
            lastCompletedDate: lastCompletedDate,
            receivedReactions: receivedReactions // Add this
        });
    } catch (error) {
        console.error("Error in /me:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
