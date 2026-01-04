import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { HabitsScreen } from "./components/HabitsScreen";
import { CreateHabitScreen } from "./components/CreateHabitScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SocialScreen } from "./components/SocialScreen";
import { BottomNav } from "./components/BottomNav";
import { LoginScreen } from "./components/LoginScreen";

import { supabase } from "./lib/supabase";

type Screen = "habits" | "create" | "profile" | "social";

interface Habit {
  id: string;
  name: string;
  micro_identity: string | null;
  goal: number;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [currentScreen, setCurrentScreen] = useState<Screen>("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
useEffect(() => {
  if (!session) return;

  const fetchHabits = async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("habits")
      .select(`
        id,
        name,
        micro_identity,
        goal,
        habit_completions (
          completed,
          completion_date
        )
      `)
      .eq("habit_completions.completion_date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("FETCH HABITS ERROR:", error);
      return;
    }

    const normalized = (data ?? []).map((h: any) => ({
      id: h.id,
      name: h.name,
      micro_identity: h.micro_identity,
      goal: h.goal,
      completed_today: h.habit_completions?.[0]?.completed ?? false,
    }));

    setHabits(normalized);
  };

  fetchHabits();
}, [session]);


  /* ---------------------------
     AUTH SESSION (PERSISTENT)
  ---------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------------------------
     LOAD HABITS
  ---------------------------- */
  useEffect(() => {
    if (!session) return;

    const fetchHabits = async (): Promise<void> => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name, micro_identity, goal")
        .order("created_at");

      if (!error && data) {
        setHabits(data);
      }
    };

    fetchHabits();
  }, [session]);

  /* ---------------------------
     CREATE HABIT
  ---------------------------- */
const handleCreateHabit = async (habit: any): Promise<void> => {
  if (!session) return;

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: session.user.id,
      name: habit.name,
      micro_identity: habit.microIdentity,
      habit_type: habit.type,
      goal: habit.goal,
      active_days: habit.days, 
    })
    .select()
    .single();

  if (error) {
    console.error("Create habit failed:", error);
    return;
  }

  setHabits((prev) => [...prev, data]);
  setCurrentScreen("habits");
};


  /* ---------------------------
     COMPLETE HABIT (TODAY)
  ---------------------------- */
  const handleCompleteHabit = async (habitId: string): Promise<void> => {
    if (!session) return;

    const today: string = new Date().toISOString().slice(0, 10);

    await supabase.from("habit_completions").upsert({
      habit_id: habitId,
      user_id: session.user.id,
      completion_date: today,
      completed: true,
    });
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
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d2817] to-[#1a1410] text-white overflow-x-hidden">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        <main className="flex-1 pb-20 overflow-y-auto">
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
                  onNavigate={setCurrentScreen}
                />
              </motion.div>
            )}

            {currentScreen === "create" && (
              <motion.div key="create">
                <CreateHabitScreen
                  onBack={() => setCurrentScreen("habits")}
                  onCreate={handleCreateHabit}
                />
              </motion.div>
            )}

            {currentScreen === "profile" && (
              <motion.div key="profile">
                <ProfileScreen onNavigate={setCurrentScreen} />
              </motion.div>
            )}

            {currentScreen === "social" && (
              <motion.div key="social">
                <SocialScreen onNavigate={setCurrentScreen} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
        />
        

      </div>
    </div>

  );
}
