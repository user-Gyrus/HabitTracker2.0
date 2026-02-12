import { Request, Response } from "express";
import Habit from "../models/Habit";
import User from "../models/User";
import Group from "../models/Group";
import Streak from "../models/Streak"; // New Streak model
import { getISTDate, getYesterdayISTDate } from "../utils/dateUtils";
import { calculateCurrentStreak } from "../utils/streakUtils";

// --- Centralized Streak Sync Logic ---
// This function is the single source of truth for streak updates.
// Implements Weighted Consistency Model:
// - 100% completion (Full Flame): Increment streak
// - 1-99% completion (Embers/Frozen): Maintain streak (freeze)
// - 0% completion (Extinguished): Reset streak to 0
export const syncStreakInternal = async (userId: string) => {
    const todayIST = getISTDate();
    
    // 1. Fetch ALL active habits for this user
    const allHabits = await Habit.find({ user: userId } as any);

    // 2. Fetch or create streak document (needed for rest day logic)
    let streakDoc: any = await Streak.findOne({ user: userId });
    
    // Initialize if missing
    if (!streakDoc) {
        const user = await User.findById(userId);
         streakDoc = await Streak.create({
             user: userId,
             username: user?.username || "User",
             streakCount: 0,
             history: [],
             emberDays: [],
             streakState: 'extinguished'
         });
    }

    // 3. Check completion status for TODAY (IST)
    // Filter habits that are applicable for today (Recurrence + Duration)
    const todayDateObj = new Date(todayIST);
    const dayOfWeek = todayDateObj.getDay(); // 0-6
    const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // 1-7

    const activeHabitsForToday = allHabits.filter((h: any) => {
        // A. Duration Check - Based on COMPLETIONS, not calendar days
        if (h.duration) {
             const completionCount = h.completions ? h.completions.length : 0;
             // If habit has been completed >= duration times, it's finished
             if (completionCount >= h.duration) return false;
        }

        // B. Active Day Check
        if (h.activeDays && !h.activeDays.includes(todayNum)) return false;

        return true;
    });

    // 4. Calculate completion percentage
    let completionPercentage = 0;
    let completedCount = 0;
    let streakState: 'active' | 'frozen' | 'extinguished' = 'extinguished';
    
    if (activeHabitsForToday.length > 0) {
        completedCount = activeHabitsForToday.filter((h: any) => 
            h.completions && h.completions.includes(todayIST)
        ).length;
        completionPercentage = (completedCount / activeHabitsForToday.length) * 100;
        
        // Determine streak state based on completion percentage
        if (completionPercentage === 100) {
            streakState = 'active'; // Full Flame
        } else if (completionPercentage > 0) {
            streakState = 'frozen'; // Embers
        } else {
            streakState = 'extinguished'; // No completion
        }
    } else {
        // If there are NO active habits for today (e.g. rest day), 
        // Don't update streak state at all - rest days are neutral.
        // This maintains the existing streak without incrementing it.
        if (allHabits.length > 0) {
             // Rest day: Don't modify history, don't change state
             // Just skip the update and return current streak info
             const currentStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays, streakDoc.emberDays || []);
             
             return {
                 streak: currentStreak,
                 streakUpdated: false,
                 lastCompletedDate: streakDoc.lastCompletedDate,
                 streakHistory: streakDoc.history || [],
                 lastCompletedDateIST: streakDoc.lastCompletedDateIST,
                 streakFreezes: streakDoc.streakFreezes,
                 frozenDays: streakDoc.frozenDays,
                 emberDays: streakDoc.emberDays || [],
                 streakState: streakDoc.streakState,
                 completionPercentage: 0,
                 completedHabits: 0,
                 totalHabits: 0
             };
        }
    }

    // 5. Update Streak Collection Logic
    // streakDoc is already fetched/initialized above.
    
    let streakUpdated = false;
    let historyChanged = false;

    // 6. Update History and Ember Days Based on Completion Status
    if (streakState === 'active') {
         // Full Flame: Add today to history if not present
         if (!streakDoc.history.includes(todayIST)) {
             streakDoc.history.push(todayIST);
             historyChanged = true;
             
             // Update timestamp variables
             streakDoc.lastCompletedDate = new Date();
             streakDoc.lastCompletedDateIST = todayIST;
         }
         
         // Remove from emberDays if it was there (user completed remaining habits)
         const emberIndex = streakDoc.emberDays.indexOf(todayIST);
         if (emberIndex > -1) {
             streakDoc.emberDays.splice(emberIndex, 1);
             historyChanged = true;
         }
         
    } else if (streakState === 'frozen') {
         // Embers/Frozen: Add today to emberDays if not present
         if (!streakDoc.emberDays.includes(todayIST)) {
             streakDoc.emberDays.push(todayIST);
             historyChanged = true;
             
             // Update timestamp to show activity
             streakDoc.lastCompletedDate = new Date();
             streakDoc.lastCompletedDateIST = todayIST;
         }
         
         // Remove from history if it was there (user uncompleted a habit)
         const histIndex = streakDoc.history.indexOf(todayIST);
         if (histIndex > -1) {
             streakDoc.history.splice(histIndex, 1);
             historyChanged = true;
         }
         
    } else {
         // Extinguished: Remove today from both history and emberDays
         const histIndex = streakDoc.history.indexOf(todayIST);
         if (histIndex > -1) {
             streakDoc.history.splice(histIndex, 1);
             historyChanged = true;
         }
         
         const emberIndex = streakDoc.emberDays.indexOf(todayIST);
         if (emberIndex > -1) {
             streakDoc.emberDays.splice(emberIndex, 1);
             historyChanged = true;
         }
         
         // Revert timestamp if we just removed "today"
         if (historyChanged) {
             const newLastDate = streakDoc.history.length > 0
                 ? streakDoc.history[streakDoc.history.length - 1]
                 : null;
                 
             streakDoc.lastCompletedDateIST = newLastDate;
             if (!newLastDate) streakDoc.lastCompletedDate = null;
         }
    }

    // 6. Recalculate Streak from History (State Correction)
    // The streak calculation now considers emberDays as "continuation" days
    const currentStreak = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays, streakDoc.emberDays);
    
    // Check for Freeze Award (Every 7 days) - FIXED: Only award for NEW milestones
    const oldStreak = streakDoc.streakCount;
    
    // Initialize awardedMilestones if it doesn't exist (for existing users)
    if (!streakDoc.awardedMilestones) {
        streakDoc.awardedMilestones = [];
    }
    
    // Reset awarded milestones if streak broke to 0
    if (currentStreak === 0 && oldStreak > 0) {
        streakDoc.awardedMilestones = [];
    }
    
    // Only award milestones when:
    // 1. Streak increased
    // 2. History was actually modified (not just recalculation)
    // 3. Milestone hasn't been awarded yet
    // This prevents exploits from rapid toggling
    if (currentStreak > oldStreak && historyChanged) {
        const currentMilestone = Math.floor(currentStreak / 7);
        
        // Only award if this milestone hasn't been awarded yet
        if (currentMilestone > 0 && !streakDoc.awardedMilestones.includes(currentMilestone)) {
            streakDoc.streakFreezes = (streakDoc.streakFreezes || 0) + 1;
            streakDoc.awardedMilestones.push(currentMilestone);
        }
    }

    // Check for changes in Ember Progress
    if (streakDoc.completionPercentage !== Math.round(completionPercentage)) {
        streakDoc.completionPercentage = Math.round(completionPercentage);
        streakUpdated = true;
    }

    if (streakDoc.streakCount !== currentStreak) {
        streakDoc.streakCount = currentStreak;
        streakUpdated = true;
    }
    
    // Update streak state
    if (streakDoc.streakState !== streakState) {
        streakDoc.streakState = streakState;
        streakUpdated = true;
    }

    if (streakUpdated || historyChanged) {
        await streakDoc.save();
    }
    
    return {
        streak: streakDoc.streakCount,
        streakUpdated,
        lastCompletedDate: streakDoc.lastCompletedDate,
        streakHistory: streakDoc.history || [],
        lastCompletedDateIST: streakDoc.lastCompletedDateIST,
        streakFreezes: streakDoc.streakFreezes,
        frozenDays: streakDoc.frozenDays,
        emberDays: streakDoc.emberDays || [],
        streakState: streakDoc.streakState,
        completionPercentage: Math.round(completionPercentage),
        completedHabits: completedCount,
        totalHabits: activeHabitsForToday.length
    };
};


// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req: any, res: Response): Promise<void> => {
  try {
    const {
      name,
      microIdentity,
      type,
      goal,
      days, 
      visibility,
      duration,
      associatedGroup // New parameter
    } = req.body;

    let finalDuration = duration;
    let group: any = null;

    // SQUAD LOGIC: If associated with a group, validation & sync
    if (associatedGroup) {
        group = await Group.findById(associatedGroup);
        if (!group) {
             res.status(404).json({ message: "Associated squad not found" });
             return;
        }
        // Force duration to match group
        finalDuration = group.duration;
    }

    const habit = await Habit.create({
      user: req.user._id,
      name,
      microIdentity,
      type,
      goal,
      activeDays: days,
      visibility,
      duration: finalDuration,
      completions: [],
      associatedGroup // Save the link
    });

    // AUTO-LINK: Add to Group memberHabits
    if (group) {
        if (!group.memberHabits) {
            group.memberHabits = [];
        }
        
        // Remove old link if exists (though usually creating new means new link)
        const existingIndex = group.memberHabits.findIndex((mh: any) => mh.user.toString() === req.user._id.toString());
        if (existingIndex > -1) {
            group.memberHabits[existingIndex].habit = habit._id;
        } else {
            group.memberHabits.push({ user: req.user._id, habit: habit._id });
        }
        
        await group.save();
    }

    // Sync streak (Adding a new habit might break "All Done" status)
    const streakInfo = await syncStreakInternal(req.user._id);

    res.status(201).json({
        ...habit.toObject(),
        streak: streakInfo.streak,
        streakHistory: streakInfo.streakHistory,
        lastCompletedDate: streakInfo.lastCompletedDate,
        streakState: streakInfo.streakState,
        emberDays: streakInfo.emberDays,
        completionPercentage: streakInfo.completionPercentage
    });
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user habits
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req: any, res: Response): Promise<void> => {
    try {
        const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(habits);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update habit (e.g. completions)
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req: any, res: Response): Promise<void> => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (!habit) {
            res.status(404).json({ message: "Habit not found" });
            return;
        }

        // Authorize
        if (habit.user.toString() !== req.user._id.toString()) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }

        // Update fields if provided
        if (req.body.name) habit.name = req.body.name;
        if (req.body.microIdentity) habit.microIdentity = req.body.microIdentity;
        if (req.body.goal) habit.goal = req.body.goal;
        if (req.body.duration) habit.duration = req.body.duration;
        if (req.body.type) habit.type = req.body.type;
        if (req.body.visibility) habit.visibility = req.body.visibility;
        if (req.body.days) habit.activeDays = req.body.days;
        
        // Check for completion update
        if (req.body.completions) {
            habit.completions = req.body.completions;
        }

        const updatedHabit = await habit.save();
        
        // Sync streak (Toggling completion might change "All Done" status)
        const streakInfo = await syncStreakInternal(req.user._id);
        
        res.json({
            ...updatedHabit.toObject(),
            streak: streakInfo.streak,
            streakHistory: streakInfo.streakHistory,
            streakUpdated: streakInfo.streakUpdated,
            lastCompletedDate: streakInfo.lastCompletedDate,
            streakState: streakInfo.streakState,
            emberDays: streakInfo.emberDays,
            completionPercentage: streakInfo.completionPercentage
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
}

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req: any, res: Response): Promise<void> => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (!habit) {
             res.status(404).json({ message: "Habit not found" });
             return;
        }

        if (habit.user.toString() !== req.user._id.toString()) {
             res.status(401).json({ message: "Not authorized" });
             return;
        }

        // --- Group Cleanup ---
        // TODO: Move this to a service or reusable function if it grows
        const groupsWithHabit = await Group.find({ "memberHabits.habit": req.params.id });
        const todayIST = getISTDate();
        const yesterdayIST = getYesterdayISTDate(todayIST);

        for (const group of groupsWithHabit) {
            // Remove the linked habit entry
            if (group.memberHabits) {
                group.memberHabits = group.memberHabits.filter((mh: any) => mh.habit.toString() !== req.params.id);
            }
            
            // Revert Group Streak Logic if needed:
            // This logic allows deleting a habit to REVERT a group streak if it was the only one contributing?
            // Or maybe just leave it safe. 
            // Existing logic was: if group last completed date is TODAY, revert it.
            if (group.lastCompletedDateIST === todayIST) {
                if (group.groupStreak > 0) {
                    group.groupStreak -= 1;
                }
                group.lastCompletedDateIST = yesterdayIST;
            }
            
            await group.save();
        }

        await habit.deleteOne();

        // Sync streak (Deleting a blocker might trigger "All Done" status)
        const streakInfo = await syncStreakInternal(req.user._id);

        res.json({ 
            message: "Habit removed", 
            streak: streakInfo.streak,
            streakHistory: streakInfo.streakHistory,
            lastCompletedDate: streakInfo.lastCompletedDate,
            streakState: streakInfo.streakState,
            emberDays: streakInfo.emberDays,
            completionPercentage: streakInfo.completionPercentage
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}

// @desc    Apply streak freeze to recover streak
// @route   POST /api/habits/freeze
// @access  Private
export const applyStreakFreeze = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const streakDoc = await Streak.findOne({ user: userId });

        if (!streakDoc) {
             res.status(404).json({ message: "Streak record not found" });
             return;
        }

        const { checkStreakRecovery, calculateCurrentStreak } = require("../utils/streakUtils");
        const recoveryInfo = checkStreakRecovery(streakDoc.history, streakDoc.frozenDays);

        if (!recoveryInfo.recoverable) {
             res.status(400).json({ message: "Streak is not recoverable or no gap found." });
             return;
        }

        const cost = recoveryInfo.daysNeeded;
        if ((streakDoc.streakFreezes || 0) < cost) {
             res.status(400).json({ message: "Not enough streak freezes available." });
             return;
        }

        // Apply freeze
        streakDoc.streakFreezes -= cost;
        streakDoc.frozenDays = [...(streakDoc.frozenDays || []), ...recoveryInfo.missingDates];
        
        // Recalculate streak immediately to reflect recovery
        streakDoc.streakCount = calculateCurrentStreak(streakDoc.history, streakDoc.frozenDays, streakDoc.emberDays || []);

        await streakDoc.save();

        res.json({
            message: "Streak recovered successfully",
            streak: streakDoc.streakCount,
            streakFreezes: streakDoc.streakFreezes,
            frozenDays: streakDoc.frozenDays,
            streakHistory: streakDoc.history
        });

    } catch (error) {
        console.error("Error applying freeze:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
