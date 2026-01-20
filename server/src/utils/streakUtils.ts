import { getISTDate, getYesterdayISTDate } from "./dateUtils";

/**
 * Calculates the current streak based on a history of completion dates.
 * 
 * Logic (Weighted Consistency Model):
 * 1. Sorts history dates in descending order (newest first).
 * 2. Checks if the most recent completion is either Today or Yesterday (IST).
 * 3. If not, streak is broken -> 0.
 * 4. If yes, iterates backwards to count consecutive days.
 * 5. Ember days (partial completion) count as continuation days but don't increment streak.
 * 
 * @param history Array of date strings "YYYY-MM-DD" with 100% completion
 * @param frozenDays Array of date strings "YYYY-MM-DD" where freeze was used
 * @param emberDays Array of date strings "YYYY-MM-DD" with partial completion (1-99%)
 * @returns number The calculated streak count
 */
export const calculateCurrentStreak = (
    history: string[], 
    frozenDays: string[] = [], 
    emberDays: string[] = []
): number => {
    // Merge history, frozenDays, and emberDays for checking continuity
    // But only count history (100% completion days) toward the streak number
    const allActivityDays = new Set([...(history || []), ...(frozenDays || []), ...(emberDays || [])]);
    const fullCompletionDays = new Set([...(history || []), ...(frozenDays || [])]);
    
    if (allActivityDays.size === 0) return 0;

    // 1. Sort all activity days descending and remove duplicates
    const sortedActivityDays = Array.from(allActivityDays).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    if (sortedActivityDays.length === 0) return 0;

    const today = getISTDate();
    const yesterday = getYesterdayISTDate(today);
    const lastActivity = sortedActivityDays[0];

    // 2. Check if streak is alive (Last activity must be Today or Yesterday)
    if (lastActivity !== today && lastActivity !== yesterday) {
        return 0;
    }

    // 3. Count consecutive days, but only increment for full completion days
    let streak = 0;
    let expectedDate = lastActivity;

    for (const dateStr of sortedActivityDays) {
        if (dateStr === expectedDate) {
            // Only increment streak if this is a full completion day (not just ember)
            if (fullCompletionDays.has(dateStr)) {
                streak++;
            }
            // Move to next expected date (ember days maintain continuity)
            expectedDate = getYesterdayISTDate(dateStr);
        } else {
            // Gap found, stop counting
            break;
        }
    }

    return streak;
};

/**
 * Checks if a broken streak can be recovered using freezes.
 * 
 * @param history Actual history of completion
 * @param frozenDays Existing frozen days
 * @returns Object with recovery info
 */
export const checkStreakRecovery = (history: string[], frozenDays: string[] = []): { 
    recoverable: boolean, 
    missingDates: string[],
    daysNeeded: number
} => {
    // Merge and sort
    const effectiveHistory = new Set([...(history || []), ...(frozenDays || [])]);
    const today = getISTDate();
    const yesterday = getYesterdayISTDate(today);
    
    // We scan backwards starting from Yesterday.
    // 1. Skip over any contiguous streak days connected to Yesterday (or Yesterday itself)
    //    (If Yesterday is missing, we start capturing immediately)
    
    let checkDate = yesterday;
    
    // Skip immediately preceding valid days (The "Current Streak" tail)
    while (effectiveHistory.has(checkDate)) {
        checkDate = getYesterdayISTDate(checkDate);
    }
    
    // Now `checkDate` is the first MISSING day (start of the gap)
    // We collect missing days until we find an "Anchor" (a day that IS in history)
    
    const missingDates: string[] = [];
    let daysChecked = 0;
    let anchorFound = false;

    // Safety Cap: Don't scan back more than 30 days of gaps
    while (daysChecked < 30) {
        if (effectiveHistory.has(checkDate)) {
            anchorFound = true;
            break;
        }
        
        missingDates.push(checkDate);
        checkDate = getYesterdayISTDate(checkDate);
        daysChecked++;
    }

    if (anchorFound && missingDates.length > 0) {
        return {
            recoverable: true,
            missingDates: missingDates, // These are ordered newest-missing to oldest-missing
            daysNeeded: missingDates.length
        };
    }

    return { recoverable: false, missingDates: [], daysNeeded: 0 };
};
