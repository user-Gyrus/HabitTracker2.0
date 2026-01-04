import { Flame, Settings, Plus } from "lucide-react";
import { motion } from "motion/react";
import { HabitCard } from "./HabitCard";
import { MentalModelCard } from "./MentalModelCard";

export interface Habit {
  id: string;
  name: string;
  micro_identity: string | null;
  goal: number;
  completed_today: boolean;
}

interface HabitsScreenProps {
  habits: Habit[];
  onCompleteHabit: (id: string) => void;
  onNavigate: (screen: "habits" | "create" | "profile" | "social") => void;
}

export function HabitsScreen({
  habits,
  onCompleteHabit,
  onNavigate,
}: HabitsScreenProps) {
  const streakDays = 12; // replace later with real streak logic
  const hasIncompleteHabits = habits.some((h) => !h.completed_today);
  const remainingCount = habits.filter((h) => !h.completed_today).length;

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
          <div>
            <p className="text-sm text-[#b5a79a]">Welcome back,</p>
            <p className="font-medium">Alex</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("profile")}
          className="p-2 hover:bg-[#2a1f19] rounded-lg transition-colors"
        >
          <Settings size={24} className="text-[#b5a79a]" />
        </button>
      </div>

      {/* Streak */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          className="mb-4"
          animate={
            hasIncompleteHabits
              ? { scale: [1, 1.05, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame size={64} className="text-[#ff5722]" fill="#ff5722" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">{streakDays} Day Streak</h1>
        <p className="text-[#b5a79a]">Keep the fire burning!</p>
      </div>

      {/* Today */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Today's Focus</h2>
        <span className="text-sm text-[#ff5722]">
          {remainingCount} Remaining
        </span>
      </div>

      {/* Habits */}
      <div className="space-y-4 mb-8">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={{
              id: habit.id,
              name: habit.name,
              microIdentity: habit.micro_identity ?? "",
              progress: habit.completed_today ? 1 : 0,
              goal: habit.goal,
              completed: habit.completed_today,
            }}
            onComplete={() => onCompleteHabit(habit.id)}
          />
        ))}
      </div>

      {/* Add Habit */}
      <button
        onClick={() => onNavigate("create")}
        className="w-full bg-[#2a1f19] hover:bg-[#3d2f26] border border-[#3d2f26] rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors mb-6"
      >
        <Plus size={20} className="text-[#ff5722]" />
        <span className="text-[#b5a79a]">Add New Habit</span>
      </button>

      {/* Mental Models */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mental Models</h2>
          <button className="text-sm text-[#ff5722]">View All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
          <MentalModelCard
            image="https://images.unsplash.com/photo-1547476547-82f7fbe9988f"
            duration="2 min read"
            title="Identity Shifting"
            subtitle="Become the person who does the habit"
          />
        </div>
      </div>
    </div>
  );
}
