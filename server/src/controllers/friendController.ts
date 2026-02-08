import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import Streak from "../models/Streak";

// @desc    Search for a user by Friend Code
// @route   GET /api/friends/search?code=HABIT-XXXXXX
// @access  Private
export const searchUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      res.status(400).json({ message: "Friend code is required" });
      return;
    }

    const user = await User.findOne({ 
        friendCode: code.toUpperCase() 
    }).select("displayName username friendCode _id"); // Removed stale streak/lastCompletedDate

    if (!user) {
       res.status(404).json({ message: "User not found" });
       return;
    }

    // Don't return self
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400).json({ message: "You cannot add yourself" });
        return;
    }

    // Fetch real streak
    const streakDoc = await Streak.findOne({ user: user._id });
    const streakCount = streakDoc ? streakDoc.streakCount : 0;
    const lastCompletedDate = streakDoc ? streakDoc.lastCompletedDate : null;

    res.json({
        _id: user._id,
        displayName: user.displayName,
        username: user.username,
        friendCode: user.friendCode,
        streak: streakCount,
        lastCompletedDate
    });
  } catch (error) {
    next(error); 
  }
};

// @desc    Add a friend (Mutual)
// @route   POST /api/friends/add
// @access  Private
export const addFriend = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { friendId } = req.body;

        const currentUser = await User.findById(req.user._id);
        const friendToAdd = await User.findById(friendId);

        if (!currentUser || !friendToAdd) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check if already friends
        if (currentUser.friends.includes(friendId)) {
            res.status(400).json({ message: "User is already your friend" });
            return;
        }

        // Mutual Add
        currentUser.friends.push(friendId);
        friendToAdd.friends.push(currentUser._id);

        await currentUser.save();
        await friendToAdd.save();

        // Fetch real streak for the added friend
        const streakDoc = await Streak.findOne({ user: friendToAdd._id });
        const streakCount = streakDoc ? streakDoc.streakCount : 0;
        const lastCompletedDate = streakDoc ? streakDoc.lastCompletedDate : null;

        res.json({ 
            message: "Friend added successfully",
            friend: {
                _id: friendToAdd._id,
                displayName: friendToAdd.displayName,
                username: friendToAdd.username,
                friendCode: friendToAdd.friendCode,
                streak: streakCount,
                lastCompletedDate: lastCompletedDate
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a friend (Mutual)
// @route   POST /api/friends/remove
// @access  Private
export const removeFriend = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { friendId } = req.body;

        const currentUser = await User.findById(req.user._id);
        const friendToRemove = await User.findById(friendId);

        if (!currentUser || !friendToRemove) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Remove from both lists
        currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
        friendToRemove.friends = friendToRemove.friends.filter(id => id.toString() !== currentUser._id.toString());

        await currentUser.save();
        await friendToRemove.save();

        res.json({ message: "Friend removed successfully" });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        // First populate user friends data (basic info)
        const user = await User.findById(req.user._id).populate("friends", "displayName username friendCode");
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const friendsList: any[] = user.friends;
        
        // Extract friend IDs
        const friendIds = friendsList.map(f => f._id);

        // Fetch Streaks for all friends
        const streakDocs = await Streak.find({ user: { $in: friendIds } });

        // Map streaks to a dictionary for O(1) lookup
        const streakMap: { [key: string]: { streakCount: number, lastCompletedDate: any, lastCompletedDateIST: string, streakState?: string } } = {};
        streakDocs.forEach(doc => {
            streakMap[doc.user.toString()] = {
                streakCount: doc.streakCount,
                lastCompletedDate: doc.lastCompletedDate,
                lastCompletedDateIST: doc.lastCompletedDateIST || "",
                streakState: doc.streakState // Add this
            };
        });

        // Merge data
        const friendsWithStreak = friendsList.map(f => ({
            _id: f._id,
            displayName: f.displayName,
            username: f.username,
            friendCode: f.friendCode,
            streak: streakMap[f._id.toString()] ? streakMap[f._id.toString()].streakCount : 0,
            lastCompletedDate: streakMap[f._id.toString()] ? streakMap[f._id.toString()].lastCompletedDate : null,
            lastCompletedDateIST: streakMap[f._id.toString()] ? streakMap[f._id.toString()].lastCompletedDateIST : null,
            streakState: streakMap[f._id.toString()] ? streakMap[f._id.toString()].streakState : 'extinguished' // Add this
        }));

        res.json(friendsWithStreak);
    } catch (error) {
        next(error);
    }
};

// @desc    Get a friend's public habits for a specific date
// @route   GET /api/friends/:friendId/habits?date=YYYY-MM-DD
// @access  Private
export const getFriendHabits = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { friendId } = req.params;
        const requestedDate = req.query.date as string;

        // Verify the users are friends
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check if they are friends
        if (!currentUser.friends.includes(friendId)) {
            res.status(403).json({ message: "You can only view habits of your friends" });
            return;
        }

        // Import date utilities and Habit model
        const { getISTDate } = require("../utils/dateUtils");
        const Habit = require("../models/Habit").default;

        // Use provided date or default to today (IST)
        const targetDate = requestedDate || getISTDate();

        // Fetch all habits for the friend
        const allHabits = await Habit.find({ user: friendId });

        // Filter for public habits only
        const publicHabits = allHabits.filter((h: any) => h.visibility === 'public');

        // Get target date info for filtering
        const targetDateObj = new Date(targetDate);
        const dayOfWeek = targetDateObj.getDay(); // 0-6
        const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 format

        // Filter habits that are active for the target date
        const activeHabitsForDate = publicHabits.filter((h: any) => {
            // A. Duration Check - Based on COMPLETIONS, not calendar days
            if (h.duration) {
                const completionCount = h.completions ? h.completions.length : 0;
                // If habit has been completed >= duration times, it's finished
                if (completionCount >= h.duration) return false;
            }

            // B. Active Day Check - only show habits scheduled for this day
            if (h.activeDays && !h.activeDays.includes(todayNum)) return false;

            return true;
        });

        // Map to frontend-friendly format with completion status
        const habitsWithCompletion = activeHabitsForDate.map((h: any) => {
            // Use the actual completion count from the habit's completions array
            const completionCount = h.completions ? h.completions.length : 0;
            
            return {
                id: h._id,
                name: h.name,
                micro_identity: h.microIdentity,
                goal: h.goal,
                type: h.type,
                completed_today: h.completions && h.completions.includes(targetDate),
                duration: h.duration,
                current_day: completionCount
            };
        });

        res.json({
            date: targetDate,
            habits: habitsWithCompletion
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get suggested friends (friends of friends)
// @route   GET /api/friends/suggestions
// @access  Private
export const getSuggestedFriends = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const currentUserId = req.user._id;
        
        // Get current user with friends populated
        const currentUser = await User.findById(currentUserId).populate("friends", "_id");
        
        if (!currentUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Get IDs of current user's friends
        const friendIds = currentUser.friends.map((f: any) => f._id.toString());
        
        // Find friends of friends
        const friendsOfFriends = await User.find({
            _id: { $in: friendIds }
        }).populate("friends", "_id displayName username friendCode");

        // Aggregate potential suggestions with mutual friend counts
        const suggestionMap = new Map<string, { user: any; mutualCount: number }>();

        friendsOfFriends.forEach((friend: any) => {
            friend.friends.forEach((potentialFriend: any) => {
                const potentialId = potentialFriend._id.toString();
                
                // Exclude self and existing friends
                if (
                    potentialId !== currentUserId.toString() &&
                    !friendIds.includes(potentialId)
                ) {
                    if (suggestionMap.has(potentialId)) {
                        suggestionMap.get(potentialId)!.mutualCount++;
                    } else {
                        suggestionMap.set(potentialId, {
                            user: potentialFriend,
                            mutualCount: 1
                        });
                    }
                }
            });
        });

        // Convert to array and sort by mutual friend count
        const suggestions = Array.from(suggestionMap.values())
            .sort((a, b) => b.mutualCount - a.mutualCount)
            .slice(0, 5); // Top 5 suggestions

        // Fetch streak data for suggestions
        const suggestionIds = suggestions.map(s => s.user._id);
        const streakDocs = await Streak.find({ user: { $in: suggestionIds } });
        
        const streakMap: { [key: string]: number } = {};
        streakDocs.forEach(doc => {
            streakMap[doc.user.toString()] = doc.streakCount;
        });

        // Format response
        const formattedSuggestions = suggestions.map(s => ({
            _id: s.user._id,
            displayName: s.user.displayName,
            username: s.user.username,
            friendCode: s.user.friendCode,
            streak: streakMap[s.user._id.toString()] || 0,
            mutualFriends: s.mutualCount
        }));

        res.json(formattedSuggestions);
    } catch (error) {
        next(error);
    }
};

