import { getISTDate, getYesterdayISTDate } from "./dateUtils";

/**
 * Calculates the current streak based on a history of completion dates.
 * 
 * Logic:
 * 1. Sorts history dates in descending order (newest first).
 * 2. Checks if the most recent completion is either Today or Yesterday (IST).
 * 3. If not, streak is broken -> 0.
 * 4. If yes, iterates backwards to count consecutive days.
 * 
// @param frozenDays Array of date strings "YYYY-MM-DD" where freeze was used
 * @returns number The calculated streak count
 */
export const calculateCurrentStreak = (history: string[], frozenDays: string[] = []): number => {
    // Merge history and frozenDays for calculation
    const effectiveHistory = [...(history || []), ...(frozenDays || [])];
    
    if (!effectiveHistory || effectiveHistory.length === 0) return 0;

    // 1. Sort descending and remove duplicates
    const uniqueHistory = Array.from(new Set(effectiveHistory)).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    if (uniqueHistory.length === 0) return 0;

    const today = getISTDate();
    const yesterday = getYesterdayISTDate(today);
    const lastCompleted = uniqueHistory[0];

    // 2. Check if streak is alive (Last completed must be Today or Yesterday)
    // If last completed date is BEFORE yesterday, streak is broken.
    if (lastCompleted !== today && lastCompleted !== yesterday) {
        return 0;
    }

    // 3. Count consecutive days
    let streak = 0;
    let expectedDate = lastCompleted;

    // We start counting from the last completed date
    // Note: If lastCompleted is Today, we count it.
    // If lastCompleted is Yesterday, we count it.
    
    // Iterate through history
    for (const dateStr of uniqueHistory) {
        if (dateStr === expectedDate) {
            streak++;
            // Set next expected date to be "yesterday" relative to current `dateStr`
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
