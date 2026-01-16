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
 * @param history Array of date strings "YYYY-MM-DD"
 * @returns number The calculated streak count
 */
export const calculateCurrentStreak = (history: string[]): number => {
    if (!history || history.length === 0) return 0;

    // 1. Sort descending and remove duplicates
    const uniqueHistory = Array.from(new Set(history)).sort((a, b) => {
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
