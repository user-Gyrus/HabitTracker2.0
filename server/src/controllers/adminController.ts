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

    switch (preset) {
      case 'test-freeze':
        updates = {
          streakCount: 7,
          streakFreezes: 2,
          streakState: 'active',
        };
        break;
      case 'test-recovery':
        updates = {
          streakCount: 0,
          streakFreezes: 1,
          streakState: 'extinguished',
        };
        break;
      case 'test-long-streak':
        updates = {
          streakCount: 30,
          streakFreezes: 0,
          streakState: 'active',
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
      },
    });
  } catch (error: any) {
    console.error('Error applying preset:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
