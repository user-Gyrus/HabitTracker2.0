import { Request, Response } from "express";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import { generateFriendCode } from "../utils/generateFriendCode";
import Streak from "../models/Streak"; // New Streak model
import { calculateCurrentStreak } from "../utils/streakUtils";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // We no longer use user.checkStreak() here as logic is moved to updateHabit/Streak Model
    
    // Fetch Streak Data
    let streakDoc = await Streak.findOne({ user: user._id });
    
    if (!streakDoc) {
        // Create if missing (migration)
        streakDoc = await Streak.create({
            user: user._id,
            username: user.username,
            streakCount: 0,
            history: []
        });
    }

    // Recalculate streak to ensure consistency (e.g. if user missed yesterday)
    const calculatedStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays);
    // If mismatch, update DB (Self-healing)
    if (streakDoc.streakCount !== calculatedStreak) {
        streakDoc.streakCount = calculatedStreak;
        await streakDoc.save();
    }

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      friendCode: user.friendCode,
      email: user.email,
      streak: streakDoc.streakCount, // Return from Streak collection
      streakFreezes: streakDoc.streakFreezes,
      lastCompletedDate: streakDoc.lastCompletedDate,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { username, displayName, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  const user = await User.create({
    username,
    displayName,
    email,
    password,
    friendCode: generateFriendCode(),
  });

  if (user) {
    // Create initial Streak document
    const streakDoc = await Streak.create({
        user: user._id,
        username: user.username,
        streakCount: 0,
        history: [],
        streakFreezes: 0,
        frozenDays: []
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      friendCode: user.friendCode,
      email: user.email,
      streak: streakDoc.streakCount,
      streakFreezes: streakDoc.streakFreezes,
      lastCompletedDate: null,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Fetch Streak Data
    let streakDoc = await Streak.findOne({ user: user._id });
    
    // Recalculate streak to ensure consistenc
    let currentStreak = 0;
    let streakFreezes = 0;
    
    if (streakDoc) {
         currentStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays);
         streakFreezes = streakDoc.streakFreezes || 0;
         
         // Auto-repair if needed
         if (streakDoc.streakCount !== currentStreak) {
             streakDoc.streakCount = currentStreak;
             await streakDoc.save();
         }
    }

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      friendCode: user.friendCode,
      email: user.email,
      streak: currentStreak,
      streakFreezes: streakFreezes,
      lastCompletedDate: streakDoc ? streakDoc.lastCompletedDate : null,
      friend_code: user.friendCode // For safety/compatibility
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: any, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.displayName = req.body.displayName || user.displayName;
    if (req.body.email) {
        user.email = req.body.email;
    }
    if (req.body.username) {
        user.username = req.body.username;
        
        // Also update username in Streak collection for consistency
        await Streak.findOneAndUpdate({ user: user._id }, { username: req.body.username });
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    // Fetch latest streak
    let streakDoc = await Streak.findOne({ user: updatedUser._id });
    
    // Recalculate streak
    let currentStreak = 0;
    let streakFreezes = 0;
    if (streakDoc) {
        currentStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays);
        streakFreezes = streakDoc.streakFreezes || 0;
        
        if (streakDoc.streakCount !== currentStreak) {
            streakDoc.streakCount = currentStreak;
            await streakDoc.save();
        }
    } else {
        // Should not happen, but safe fallback
        currentStreak = 0;
    }

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      friendCode: updatedUser.friendCode,
      email: updatedUser.email,
      streak: currentStreak,
      streakFreezes: streakFreezes,
      token: generateToken(updatedUser._id.toString()),
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};
