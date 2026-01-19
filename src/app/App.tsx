import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Flame, Menu } from "lucide-react";
import { AchievementProvider, useAchievement } from "./context/AchievementContext";
import api from "../lib/api";

import { HabitsScreen } from "./components/HabitsScreen";
import { CreateHabitScreen } from "./components/CreateHabitScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SocialScreen } from "./components/SocialScreen";
import { BottomNav } from "./components/BottomNav";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { LoginScreen } from "./components/LoginScreen";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdateNotification from "./components/UpdateNotification";

type Screen = "habits" | "create" | "profile" | "social";

interface Habit {
  _id: string; // Changed from id to _id for MongoDB compatibility
  name: string;
  microIdentity: string | null; // Mapped from backend 'microIdentity'
  type: string; // Corrected from habit_type
  goal: number;
  activeDays: number[]; // Matches backend activeDays [1..7]
  createdAt: string; // Corrected from created_at
  completions: string[]; // List of ISO date strings (YYYY-MM-DD)
  visibility?: 'public' | 'private';
  duration: number; // Duration in days
}

// Normalized for UI
interface UIHabit {
  id: string;
  name: string;
  micro_identity: string | null;
  goal: number;
  completed_today: boolean;
  duration: number; // Added
  completionsCount: number; // Added
}


const STORAGE_KEY_SESSION = "habit-tracker-session";

export default function App() {
  return (
    <AchievementProvider>
      <AppContent />
    </AchievementProvider>
  );
}

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const { showAchievement } = useAchievement();
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState(false); // New state for global modal

  const [currentScreen, setCurrentScreen] = useState<Screen>("habits");
  const [habits, setHabits] = useState<UIHabit[]>([]);

  /* ---------------------------
     INVITE CODE HANDLING
  ---------------------------- */
  // 1. Check URL for invite code on mount (save to storage)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/invite\/([a-zA-Z0-9-]+)$/);
    if (match && match[1]) {
       const code = match[1];
       console.log("🔗 Invite link detected:", code);
       localStorage.setItem('pendingInviteCode', code);
       // Clean URL so user doesn't see /invite/... forever
       window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 2. Process Pending Invite (if logged in)
  const processPendingInvite = async (userToken: string) => {
     const pendingCode = localStorage.getItem('pendingInviteCode');
     if (!pendingCode) return;

     console.log("🤝 Processing pending invite:", pendingCode);

     try {
        // A. Search for friend by code
        const searchRes = await api.get(`/friends/search?code=${pendingCode}`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const friendData = searchRes.data;

        if (friendData && friendData._id) {
            // B. Add Friend
            await api.post('/friends/add', { friendId: friendData._id }, {
                 headers: { Authorization: `Bearer ${userToken}` }
            });
            toast.success(`You are now connected with ${friendData.displayName || "your friend"}! 🤝`);
            localStorage.removeItem('pendingInviteCode');
        }
     } catch (err: any) {
        console.error("Failed to process invite:", err);
        const msg = err.response?.data?.message || "Could not process invite link";
        // Convert to toast error but don't block app flow
        // Only show if it's not a "already friends" or "self add" redundant error? 
        // Actually showing error is good feedback.
        if (msg !== "User is already your friend") {
             toast.error(msg);
        } else {
             localStorage.removeItem('pendingInviteCode'); // Clear it anyway if already friends
        }
     }
  };

  /* ---------------------------
     AUTH SESSION (LOCAL STORAGE)
  ---------------------------- */
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);

  useEffect(() => {
    // Check for existing session
    const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);
      
      // FETCH FRESH DATA (including verified streak)
      if (parsedSession.token) {
          api.get('/auth/me')
          .then(res => {
              // Merge with existing session (preserve token)
              const newSession = { ...parsedSession, ...res.data };
              setSession(newSession);
              localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newSession));
              
              // Trigger invite check
              processPendingInvite(parsedSession.token);
          })
          .catch(err => console.error("Session refresh failed", err));
      }
    }
    
    // Check onboarding status
    const hasOnboarded = localStorage.getItem("HAS_COMPLETED_ONBOARDING");
    if (hasOnboarded === "true") {
      setOnboardingComplete(true);
    }
    
    setAuthLoading(false);
  }, []);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleOnboardingComplete = (target: "login" | "signup") => {
    localStorage.setItem("HAS_COMPLETED_ONBOARDING", "true");
    setAuthMode(target);
    setOnboardingComplete(true);
  };

  const handleLogin = (user: any) => {
    setSession(user);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    
    // Check for pending invite immediately after login
    if (user.token) {
        processPendingInvite(user.token);
    }
  };

  const updateSession = (updatedUser: any) => {
    // Check for streak change
    if (session?.streak !== undefined && updatedUser.streak !== undefined) {
      const oldStreak = session.streak;
      const newStreak = updatedUser.streak;

      if (newStreak > oldStreak) {
        if (oldStreak === 0 && newStreak >= 1) {
             // FIRST STREAK SPECIAL ACHIEVEMENT (CENTERED)
             showAchievement({
                 title: "Streak Ignited!",
                 description: "You've successfully started your habit streak. Keep the fire burning!",
                 type: "streak",
                 icon: <Flame className="w-12 h-12 text-orange-500 fill-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse" />
             });
        } else {
             // NORMAL STREAK TOAST
             toast.success(`${newStreak} Day Streak!`, {
                description: "Another day, another victory.",
                icon: <Flame className="w-5 h-5 text-orange-500" />
             });
        }
      }
    }

    const newSession = { ...session, ...updatedUser };
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newSession));
  };


  /* ---------------------------
     LOAD HABITS
  ---------------------------- */
  useEffect(() => {
    if (!session?.token) return;

    const loadHabits = async () => {
      try {
        const res = await api.get('/habits');
        const allHabits: Habit[] = res.data;
        // FIX: Use local date parts to avoid UTC shift problems
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        // Filter by Active Days (1=Mon ... 7=Sun)
        const currentDayIndex = now.getDay(); // 0 (Sun) to 6 (Sat)
        const todayNum = currentDayIndex === 0 ? 7 : currentDayIndex;

        const todaysHabits = allHabits.filter(h => {
            // 1. Duration Check
            if (h.createdAt && h.duration) {
                const startDate = new Date(h.createdAt);
                // Reset time to ensure day-based calculation
                const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                const diffTime = currentDay.getTime() - startDay.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                // If current day is beyond duration (e.g. Day 21 on a 21-day habit), hide it
                // Assuming duration = days active. Day 0 to Day 20 = 21 days. 
                // So if diffDays >= duration, it's expired.
                if (diffDays >= h.duration) return false;
            }

            // 2. Active Day Check
            return h.activeDays && h.activeDays.includes(todayNum);
        });

        const normalized: UIHabit[] = todaysHabits.map((h) => ({
          id: h._id, // MongoDB uses _id
          name: h.name,
          micro_identity: h.microIdentity,
          goal: h.goal, // Kept for legacy (e.g. daily amount)
          completed_today: h.completions.includes(today),
          duration: h.duration || 21,
          completionsCount: h.completions.length,
        }));

        setHabits(normalized);
      } catch (err) {
        console.error("Failed to load habits", err);
      }
    };

    loadHabits();
  }, [session, currentScreen]); // Reload when screen changes (e.g. back from create)

  /* ---------------------------
     RELOAD SESSION (for profile updates)
  ---------------------------- */
  useEffect(() => {
    // Reload session from localStorage when switching screens
    // This ensures profile changes (like display_name) are reflected
    const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      // Only update if changed (avoid infinite loop)
      if (JSON.stringify(parsedSession) !== JSON.stringify(session)) {
        setSession(parsedSession);
      }
    }
  }, [currentScreen]); // Reload when screen changes


  /* ---------------------------
     CREATE / UPDATE HABIT
  ---------------------------- */
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleEditHabit = async (id: string) => {
      // Find full habit data (including activeDays, etc) which might not be in UIHabit fully?
      // actually UIHabit is missing activeDays, type, visibility.
      // So fetch specific habit or find in full list if we kept it.
      // We didn't keep full list in state, only UIHabit.
      // Let's fetch it or store full habits.
      // Better: Fetch single habit or just get all again.
      // Since we don't have get-single-habit endpoint ready/verified, let's just GET /habits again and find it.
      try {
          const res = await api.get('/habits');
          const all: Habit[] = res.data;
          const found = all.find((h:any) => h._id === id);
          if (found) {
              setEditingHabit(found);
              setCurrentScreen("create");
          }
      } catch (err) {
          console.error(err);
          toast.error("Could not load habit details");
      }
  };

  const handleCreateOrUpdateHabit = async (habitData: any): Promise<void> => {
    try {
      let res;
      if (editingHabit) {
          // UPDATE
           res = await api.put(`/habits/${editingHabit._id}`, habitData);
           toast.success("Habit updated successfully!");
      } else {
          // CREATE
           res = await api.post('/habits', habitData);
           toast.success("Habit created successfully!");
      }
      
      const data = res.data;
      
      // Update session streak/lastCompletedDate if returned
      if (data.streak !== undefined && session) {
          const updatedSession = {
              ...session,
               streak: data.streak,
               streakHistory: data.streakHistory,
               lastCompletedDate: data.lastCompletedDate
          };
          updateSession(updatedSession);
      }
      
      setEditingHabit(null); // Clear edit mode
      setCurrentScreen("habits");
      
    } catch (err) {
      toast.error(editingHabit ? "Error updating habit" : "Error creating habit");
      console.error("Error saving habit", err);
    }
  };


  /* ---------------------------
     COMPLETE HABIT (TODAY)
  ---------------------------- */
  const handleCompleteHabit = async (habitId: string): Promise<void> => {
    // FIX: Use local date parts to avoid UTC shift problems (toISOString uses UTC)
    // This aligns better with "Today" for the user's device time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    // Optimistic update
    setHabits(prev => 
        prev.map(h => h.id === habitId ? { 
          ...h, 
          completed_today: true,
          completionsCount: h.completionsCount + 1 
        } : h)
    );

    try {
        const allRes = await api.get('/habits');
        const allHabits: Habit[] = allRes.data;
        const targetHabit = allHabits.find((h:any) => h._id === habitId);
        
        if (targetHabit && !targetHabit.completions.includes(today)) {
             const updatedCompletions = [...targetHabit.completions, today];
             const updateRes = await api.put(`/habits/${habitId}`, { completions: updatedCompletions });
             const data = updateRes.data;
             
             // Update session streak and lastCompletedDate if returned
             if (data.streak !== undefined && session) {
                 const updatedSession = {
                   ...session,
                   streak: data.streak,
                   streakHistory: data.streakHistory,
                   lastCompletedDate: data.lastCompletedDate || session.lastCompletedDate
                 };
                 updateSession(updatedSession);
             }
        }

    } catch (err) {
        console.error("Failed to complete habit", err);
        // Revert optimistic update?
        // For now, ignore.
    }
  };

  /* ---------------------------
     UNDO HABIT (TODAY)
  ---------------------------- */
  const handleUndoHabit = async (habitId: string): Promise<void> => {
    // FIX: Use local date parts to avoid UTC shift problems (toISOString uses UTC)
    // Same logic as complete
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Optimistic update
    setHabits(prev => 
        prev.map(h => h.id === habitId ? { 
          ...h, 
          completed_today: false,
          completionsCount: Math.max(0, h.completionsCount - 1) 
        } : h)
    );

    try {
        const allRes = await api.get('/habits');
        const allHabits: Habit[] = allRes.data;
        const targetHabit = allHabits.find((h:any) => h._id === habitId);
        
        if (targetHabit && targetHabit.completions.includes(today)) {
             const updatedCompletions = targetHabit.completions.filter((d: string) => d !== today);
             const updateRes = await api.put(`/habits/${habitId}`, { completions: updatedCompletions });
             const data = updateRes.data;
             
             // Update session streak and lastCompletedDate if returned
             if (data.streak !== undefined && session) {
                 const updatedSession = {
                   ...session,
                   streak: data.streak,
                   streakHistory: data.streakHistory,
                   lastCompletedDate: data.lastCompletedDate || session.lastCompletedDate
                 };
                 updateSession(updatedSession);
             }
        }

    } catch (err) {
        console.error("Failed to undo habit", err);
        // We could revert the optimistic update here if needed.
        toast.error("Failed to undo habit");
    }
  };

  /* ---------------------------
     DELETE HABIT
  ---------------------------- */
  const handleDeleteHabit = async (habitId: string) => {
      try {
          const res = await api.delete(`/habits/${habitId}`);
          const data = res.data;
          
          setHabits(prev => prev.filter(h => h.id !== habitId));
          toast.success("Habit deleted");
          // Update session streak if returned and changed
          if (data.streak !== undefined && session) {
               updateSession({ 
                   ...session, 
                   streak: data.streak,
                   streakHistory: data.streakHistory,
                   lastCompletedDate: data.lastCompletedDate 
               });
          }
      } catch (err) {
          toast.error("Error deleting habit");
          console.error("Failed to delete habit", err);
      }
  };


  /* ---------------------------
     AUTH GATE
  ---------------------------- */
  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Loading…
      </div>
    );
  }

  if (!session) {
    if (!onboardingComplete) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    return <LoginScreen onLogin={handleLogin} initialMode={authMode} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] text-foreground overflow-x-hidden transition-colors duration-500">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative md:shadow-2xl md:border-x md:border-card-border">
        {/* FIXED HEADER (Only on Habits Screen) */}
        {currentScreen === "habits" && (
            <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
                <div className="bg-nav-bg/95 backdrop-blur-xl transition-all border-b border-nav-border py-4 px-6 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 shadow-md border-2 border-background" />
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-1.5">
                                <span className="truncate">Hi {session?.display_name || session?.username || 'Guest'}</span>
                                <span className="animate-pulse flex-shrink-0">👋</span>
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowProfileModal(prev => !prev)}
                        className="p-2 hover:bg-secondary rounded-xl transition-all active:scale-95 border border-transparent"
                    >
                        <Menu size={24} className="text-muted-foreground" />
                    </button>
                </div>
            </div>
        )}

        <main className={`flex-1 pb-20 overflow-y-auto ${currentScreen === 'habits' ? 'pt-24' : ''}`}> 
        {/* Changed from pt-36 to pt-24 to reduce gap below fixed header */}
          <AnimatePresence mode="wait">
            {currentScreen === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                  <HabitsScreen
                    habits={habits}
                    onCompleteHabit={handleCompleteHabit}
                    onUndoHabit={handleUndoHabit}
                    onEditHabit={handleEditHabit}
                    onDeleteHabit={handleDeleteHabit}
                    onNavigate={setCurrentScreen}
                    streak={session?.streak || 0}
                    streakHistory={session?.streakHistory || []}
                  />
              </motion.div>
            )}

            {currentScreen === "create" && (
              <motion.div key="create">
                <CreateHabitScreen
                  onBack={() => {
                      setCurrentScreen("habits");
                      setEditingHabit(null);
                  }}
                  onCreate={handleCreateOrUpdateHabit}
                  initialData={editingHabit}
                />
              </motion.div>
            )}

            {currentScreen === "profile" && (
              <motion.div key="profile">
                <ProfileScreen 
                    onNavigate={setCurrentScreen} 
                    updateSession={updateSession}
                    streak={session?.streak || 0}
                />
              </motion.div>
            )}

            {currentScreen === "social" && (
              <motion.div key="social">
                <SocialScreen 
                    onNavigate={setCurrentScreen} 
                    habits={habits}
                    streak={session?.streak || 0}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
        />
        
        {/* Global Profile Modal */}
        {showProfileModal && (
            <ProfileScreen 
                onNavigate={setCurrentScreen}
                isModal={true}
                onClose={() => setShowProfileModal(false)}
                updateSession={updateSession}
                streak={session?.streak || 0}
            />
        )}
      </div>
      <PWAInstallPrompt />
      <Toaster />
      <UpdateNotification />
    </div>

  );
}
