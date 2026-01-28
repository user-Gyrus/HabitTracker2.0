import { Request, Response } from "express";
import Streak from "../models/Streak";
import { getISTDate } from "../utils/dateUtils";

/**
 * DEVELOPER ADMIN ENDPOINTS
 * These endpoints allow manual manipulation of streak data for testing purposes.
 * Should only be used in development/staging environments.
 */

// @desc    Set streak count manually
// @route   POST /api/admin/streak/set-count
// @access  Private
export const setStreakCount = async (req: any, res: Response): Promise<void> => {
  try {
    const { count } = req.body;

    // Validate count
    if (typeof count !== 'number' || count < 0 || count > 999) {
      res.status(400).json({ message: 'Invalid streak count. Must be between 0 and 999.' });
      return;
    }

    // Find or create streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
        streakCount: count,
      });
    } else {
      streak.streakCount = count;
      await streak.save();
    }

    res.json({
      message: `Streak count set to ${count}`,
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
      },
    });
  } catch (error: any) {
    console.error('Error setting streak count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Set streak freezes manually
// @route   POST /api/admin/streak/set-freezes
// @access  Private
export const setStreakFreezes = async (req: any, res: Response): Promise<void> => {
  try {
    const { freezes } = req.body;

    // Validate freezes
    if (typeof freezes !== 'number' || freezes < 0 || freezes > 10) {
      res.status(400).json({ message: 'Invalid freeze count. Must be between 0 and 10.' });
      return;
    }

    // Find or create streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
        streakFreezes: freezes,
      });
    } else {
      streak.streakFreezes = freezes;
      await streak.save();
    }

    res.json({
      message: `Streak freezes set to ${freezes}`,
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
      },
    });
  } catch (error: any) {
    console.error('Error setting streak freezes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Set streak state manually
// @route   POST /api/admin/streak/set-state
// @access  Private
export const setStreakState = async (req: any, res: Response): Promise<void> => {
  try {
    const { state } = req.body;

    // Validate state
    const validStates = ['active', 'frozen', 'extinguished'];
    if (!validStates.includes(state)) {
      res.status(400).json({ message: 'Invalid state. Must be: active, frozen, or extinguished.' });
      return;
    }

    // Find or create streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
        streakState: state,
      });
    } else {
      streak.streakState = state as 'active' | 'frozen' | 'extinguished';
      await streak.save();
    }

    res.json({
      message: `Streak state set to ${state}`,
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
      },
    });
  } catch (error: any) {
    console.error('Error setting streak state:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add dates to history for testing
// @route   POST /api/admin/streak/add-history
// @access  Private
export const addHistoryDays = async (req: any, res: Response): Promise<void> => {
  try {
    const { dates } = req.body;

    // Validate dates array
    if (!Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({ message: 'Invalid dates. Must be an array of date strings (YYYY-MM-DD).' });
      return;
    }

    // Find or create streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
        history: dates,
      });
    } else {
      // Add new dates to history (avoid duplicates)
      const existingDates = new Set(streak.history);
      dates.forEach((date: string) => existingDates.add(date));
      streak.history = Array.from(existingDates).sort();
      await streak.save();
    }

    res.json({
      message: `Added ${dates.length} dates to history`,
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
        historyCount: streak.history.length,
      },
    });
  } catch (error: any) {
    console.error('Error adding history days:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset all streak data
// @route   POST /api/admin/streak/reset
// @access  Private
export const resetStreakData = async (req: any, res: Response): Promise<void> => {
  try {
    // Find streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
      });
    } else {
      // Reset all fields to defaults
      streak.streakCount = 0;
      streak.streakFreezes = 0;
      streak.awardedMilestones = []; // Reset awarded milestones
      streak.streakState = 'extinguished';
      streak.history = [];
      streak.emberDays = [];
      streak.frozenDays = [];
      streak.completionPercentage = 0;
      streak.lastCompletedDate = undefined;
      streak.lastCompletedDateIST = undefined;
      await streak.save();
    }

    res.json({
      message: 'Streak data reset to defaults',
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
      },
    });
  } catch (error: any) {
    console.error('Error resetting streak data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Apply a preset test scenario
// @route   POST /api/admin/streak/preset
// @access  Private
export const applyPreset = async (req: any, res: Response): Promise<void> => {
  try {
    const { preset } = req.body;

    let updates: any = {};
    let historyDates: string[] = [];

    // Helper to generate date strings going backwards from today
    const generateHistory = (days: number, skipLast: number = 0): string[] => {
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = skipLast; i < days + skipLast; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Format as YYYY-MM-DD in IST
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
        dates.push(istDate.toISOString().split('T')[0]);
      }
      
      return dates.reverse(); // Oldest to newest
    };

    switch (preset) {
      case 'test-freeze':
        // Active 7-day streak with 2 freezes available
        historyDates = generateHistory(7);
        updates = {
          streakCount: 7,
          streakFreezes: 2,
          awardedMilestones: [1], // Awarded milestone 1 (day 7)
          streakState: 'active',
          history: historyDates,
          lastCompletedDateIST: historyDates[historyDates.length - 1],
          lastCompletedDate: new Date(),
        };
        break;
        
      case 'test-recovery':
        // Broken streak scenario: had a 5-day streak, missed yesterday (gap), has 1 freeze to recover
        // History: 6 days ago to 2 days ago (5 days), then gap yesterday, nothing today
        historyDates = generateHistory(5, 2); // 5 days, starting from 6 days ago
        updates = {
          streakCount: 0, // Broken because of the gap
          streakFreezes: 1,
          awardedMilestones: [], // Reset because streak broke
          streakState: 'extinguished',
          history: historyDates,
          lastCompletedDateIST: historyDates[historyDates.length - 1],
          lastCompletedDate: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)), // 2 days ago
          emberDays: [],
          frozenDays: [],
        };
        break;
        
      case 'test-long-streak':
        // Long 30-day streak, no freezes (earned 4 already, used them)
        historyDates = generateHistory(30);
        updates = {
          streakCount: 30,
          streakFreezes: 0,
          awardedMilestones: [1, 2, 3, 4], // Awarded milestones for days 7, 14, 21, 28
          streakState: 'active',
          history: historyDates,
          lastCompletedDateIST: historyDates[historyDates.length - 1],
          lastCompletedDate: new Date(),
        };
        break;
        
      default:
        res.status(400).json({ message: 'Invalid preset. Options: test-freeze, test-recovery, test-long-streak' });
        return;
    }

    // Find or create streak document
    let streak = await Streak.findOne({ user: req.user._id });
    
    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        username: req.user.username,
        ...updates,
      });
    } else {
      Object.assign(streak, updates);
      await streak.save();
    }

    res.json({
      message: `Applied preset: ${preset}`,
      streak: {
        streakCount: streak.streakCount,
        streakFreezes: streak.streakFreezes,
        streakState: streak.streakState,
        completionPercentage: streak.completionPercentage,
        historyLength: streak.history?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error applying preset:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Seed test friend accounts with habits
// @route   POST /api/admin/seed-friends
// @access  Private
export const seedTestFriends = async (req: any, res: Response): Promise<void> => {
  try {
    const User = require("../models/User").default;
    const Habit = require("../models/Habit").default;
    const bcrypt = require("bcryptjs");
    const { getISTDate } = require("../utils/dateUtils");

    const todayIST = getISTDate();
    
    // Helper to generate past dates
    const getPastDate = (daysAgo: number): string => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Test friend data
    const testFriends = [
      {
        username: "testfriend1",
        email: "testfriend1@test.com",
        displayName: "Alex Runner",
        emoji: "🏃",
        habits: [
          {
            name: "Morning Run",
            microIdentity: "I am a runner",
            type: "build",
            goal: 1,
            visibility: "public",
            duration: 30,
            completions: [todayIST, getPastDate(1), getPastDate(2)]
          },
          {
            name: "Read Books",
            microIdentity: "I am a reader",
            type: "build",
            goal: 1,
            visibility: "public",
            duration: 21,
            completions: [todayIST]
          }
        ]
      },
      {
        username: "testfriend2",
        email: "testfriend2@test.com",
        displayName: "Sam Fitness",
        emoji: "💪",
        habits: [
          {
            name: "Gym Workout",
            microIdentity: "I am fit",
            type: "build",
            goal: 1,
            visibility: "public",
            duration: 60,
            completions: [getPastDate(1), getPastDate(2), getPastDate(3), getPastDate(4)]
          },
          {
            name: "Quit Smoking",
            microIdentity: "I am smoke-free",
            type: "break",
            goal: 1,
            visibility: "public",
            duration: 90,
            completions: [todayIST, getPastDate(1)]
          }
        ]
      },
      {
        username: "testfriend3",
        email: "testfriend3@test.com",
        displayName: "Jordan Coder",
        emoji: "💻",
        habits: [
          {
            name: "Code Daily",
            microIdentity: "I am a developer",
            type: "build",
            goal: 2,
            visibility: "public",
            duration: 100,
            completions: Array.from({length: 15}, (_, i) => getPastDate(i))
          },
          {
            name: "No Social Media",
            microIdentity: "I am focused",
            type: "break",
            goal: 1,
            visibility: "public",
            duration: 30,
            completions: [todayIST]
          }
        ]
      }
    ];

    const createdFriends = [];
    const hashedPassword = await bcrypt.hash("testpass123", 10);

    for (const friendData of testFriends) {
      // Check if user already exists
      let user = await User.findOne({ username: friendData.username });
      
      if (!user) {
        // Create user
        user = await User.create({
          username: friendData.username,
          email: friendData.email,
          password: hashedPassword,
          displayName: friendData.displayName,
          emoji: friendData.emoji,
          friends: []
        });
      }

      // Delete existing habits for this user
      await Habit.deleteMany({ user: user._id });

      // Create habits
      for (const habitData of friendData.habits) {
        await Habit.create({
          user: user._id,
          name: habitData.name,
          microIdentity: habitData.microIdentity,
          type: habitData.type,
          goal: habitData.goal,
          visibility: habitData.visibility,
          duration: habitData.duration,
          completions: habitData.completions,
          activeDays: [1, 2, 3, 4, 5, 6, 7]
        });
      }

      // Add as friend to current user
      const currentUser = await User.findById(req.user._id);
      if (currentUser && !currentUser.friends.includes(user._id)) {
        currentUser.friends.push(user._id);
        await currentUser.save();
      }

      // Add current user as friend to test user
      if (!user.friends.includes(req.user._id)) {
        user.friends.push(req.user._id);
        await user.save();
      }

      // Create streak for test friend
      const streakDoc = await Streak.findOne({ user: user._id });
      if (streakDoc) {
        await streakDoc.deleteOne();
      }
      
      await Streak.create({
        user: user._id,
        username: user.username,
        streakCount: friendData.habits[0].completions.length,
        history: friendData.habits[0].completions,
        streakState: 'active',
        lastCompletedDateIST: todayIST,
        lastCompletedDate: new Date()
      });

      createdFriends.push({
        username: user.username,
        displayName: user.displayName,
        habitsCount: friendData.habits.length
      });
    }

    res.json({
      message: `Created ${createdFriends.length} test friends with habits`,
      friends: createdFriends,
      note: "All test friends have been added to your friends list"
    });
  } catch (error: any) {
    console.error('Error seeding test friends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
