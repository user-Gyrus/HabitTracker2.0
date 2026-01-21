import { API_URL } from "../config";

/**
 * Admin API functions for manipulating streak data in development builds.
 * These should only be called when IS_DEVELOPMENT is true.
 */

const getAuthToken = (): string | null => {
  const session = localStorage.getItem("habit-tracker-session");
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    return parsed.token || null;
  } catch {
    return null;
  }
};

const makeAdminRequest = async (endpoint: string, body: any) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/admin/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

export const setStreakCount = async (count: number) => {
  return makeAdminRequest("streak/set-count", { count });
};

export const setStreakFreezes = async (freezes: number) => {
  return makeAdminRequest("streak/set-freezes", { freezes });
};

export const setStreakState = async (state: "active" | "frozen" | "extinguished") => {
  return makeAdminRequest("streak/set-state", { state });
};

export const addHistoryDays = async (dates: string[]) => {
  return makeAdminRequest("streak/add-history", { dates });
};

export const resetStreakData = async () => {
  return makeAdminRequest("streak/reset", {});
};

export const applyPreset = async (preset: "test-freeze" | "test-recovery" | "test-long-streak") => {
  return makeAdminRequest("streak/preset", { preset });
};
