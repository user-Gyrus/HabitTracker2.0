import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../../lib/api";

interface Friend {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  isOnline: boolean;
  friendCode: string;
  completedToday: boolean;
}

interface FriendHabit {
  id: string;
  name: string;
  micro_identity: string;
  goal: number;
  type: 'build' | 'break';
  completed_today: boolean;
  duration: number;
  current_day: number;
}

interface FriendHabitsModalProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FriendHabitsModal({ friend, isOpen, onClose }: FriendHabitsModalProps) {
  const [habits, setHabits] = useState<FriendHabit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && friend) {
      fetchFriendHabits();
    }
  }, [isOpen, friend]);

  const fetchFriendHabits = async () => {
    if (!friend) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/friends/${friend.id}/habits`);
      setHabits(response.data.habits || []);
    } catch (err: any) {
      console.error("Failed to fetch friend habits:", err);
      setError(err.response?.data?.message || "Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  if (!friend) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          onClick={onClose}
        >
          {/* Backdrop with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-lg" 
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card-bg rounded-3xl border border-card-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-card-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-2 border-background shadow-lg">
                    <span className="text-2xl">🧑</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {friend.name} <span>{friend.emoji}</span>
                    </h2>
                    <p className="text-sm text-primary flex items-center gap-1 font-semibold">
                      {friend.streak} Day Streak <span>🔥</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Today's Habits
              </p>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Loading habits...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                    <X className="text-destructive" size={24} />
                  </div>
                  <p className="text-sm text-destructive font-semibold mb-2">Failed to load habits</p>
                  <p className="text-xs text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={fetchFriendHabits}
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-3xl">🤷</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">No Public Habits</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[250px]">
                    {friend.name} hasn't shared any public habits for today
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit, index) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-background rounded-2xl p-4 border transition-all relative ${
                        habit.completed_today
                          ? "border-primary/30 bg-primary/5"
                          : "border-card-border"
                      }`}
                    >
                      {/* Build/Break Type Badge */}
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center">
                        <span className="text-xs">
                          {habit.type === 'build' ? '💪' : '🚫'}
                        </span>
                      </div>

                      {/* Completion Status Checkmark */}
                      {habit.completed_today && (
                        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Habit Progress Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                            habit.completed_today
                              ? "bg-primary/20 border-primary/30"
                              : "bg-muted border-card-border"
                          }`}>
                            <span className={`text-[10px] font-bold ${
                              habit.completed_today ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {habit.current_day}/{habit.duration}
                            </span>
                          </div>

                          {/* Habit Info */}
                          <div className="flex-1 min-w-0 pr-8">
                            <h4 className="font-semibold text-foreground mb-1 leading-tight">
                              {habit.name}
                            </h4>
                            <p className="text-xs text-muted-foreground italic mb-1">
                              "{habit.micro_identity}"
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Goal: {habit.goal}x per day
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && !error && habits.length > 0 && (
              <div className="border-t border-card-border p-4 bg-muted/30">
                <p className="text-xs text-center text-muted-foreground">
                  {habits.filter(h => h.completed_today).length} of {habits.length} habits completed
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
