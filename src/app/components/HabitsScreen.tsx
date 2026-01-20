import { Plus } from "lucide-react";
import { HabitCard } from "./HabitCard";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export interface Habit {
  id: string;
  name: string;
  micro_identity: string | null;
  goal: number;
  completed_today: boolean;
  duration: number; // Added
  completionsCount: number; // Added
}

interface Quote {
  text: string;
  category: string;
}

const MENTAL_MODELS: Quote[] = [
  // Category A: The "Elastic" mindset
  { text: "Bad day? Just do the Mini version. One pushup is better than zero.", category: "Elastic Mindset" },
  { text: "Don't break the chain. If you can't run a mile, walk a block.", category: "Elastic Mindset" },
  { text: "Focus on the identity, not the outcome. Today, you are a person who doesn't miss.", category: "Elastic Mindset" },
  { text: "A 10-minute workout beats the 60-minute workout you didn't do.", category: "Elastic Mindset" },
  
  // Category B: The "Two-Day Rule"
  { text: "Missing once is an accident. Missing twice is the start of a new habit. Don't miss today.", category: "Recovery" },
  { text: "Your streak isn't a number; it's a momentum. If it falls to 0, pick it up immediately.", category: "Recovery" },
  { text: "Life happens. Use your Streak Freeze wisely, but never miss two days in a row.", category: "Recovery" },
  
  // Category C: Habit Stacking (Quote 8 removed as requested)
  { text: "Design your environment. Make the cue for your habit impossible to miss.", category: "Habit Stacking" },
  { text: "Small habits + Consistency + Time = Radical Transformation.", category: "Habit Stacking" },
  
  // Category D: Social Accountability
  { text: "Your friends are watching. Show them what showing up looks like.", category: "Social Accountability" },
  { text: "Accountability is the shortcut to willpower. Check in so they don't have to nudge you.", category: "Social Accountability" },
  { text: "A shared habit is twice as likely to stick. Invite a 'Streak Partner' today.", category: "Social Accountability" },
];

interface HabitsScreenProps {
  habits: Habit[];
  onCompleteHabit: (id: string) => void;
  onUndoHabit: (id: string) => void;
  onEditHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onNavigate: (screen: "habits" | "create" | "profile" | "social") => void;
  streak?: number;
  streakHistory?: string[];
  streakState?: 'active' | 'frozen' | 'extinguished';
  completionPercentage?: number;
}

export function HabitsScreen({
  habits,
  onCompleteHabit,
  onUndoHabit,
  onEditHabit,
  onDeleteHabit,
  onNavigate,
  streak = 0,
  streakHistory = [],
  streakState = 'extinguished',
  completionPercentage = 0,
}: HabitsScreenProps) {
  // Debug logging
  console.log('🔥 Streak State Debug:', {
    streakState,
    completionPercentage,
    streak,
    habitsCount: habits.length,
    completedCount: habits.filter(h => h.completed_today).length
  });

  // Select a random quote only once on mount
  const currentQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MENTAL_MODELS.length);
    return MENTAL_MODELS[randomIndex];
  }, []);

  const streakDays = streak;
  const remainingCount = habits.filter((h) => !h.completed_today).length;

  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);

  return (
    <div className="px-5 pb-28">
      {/* Header moved to App.tsx */}


       {/* Weekly Calendar (Integrated into Streak Card logic or separate?) 
           The user said: "For the 'This week' section". 
           In the image, it looks like one large card with Streak on left, Calendar on right.
           Let's Merge them into one container.
       */}

      {/* Merged Streak & Calendar Card */}
      <div className="bg-card-bg rounded-[2rem] border border-card-border p-4 sm:p-6 mb-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
            
            {/* Left: Streak */}
            <div className="flex flex-col items-center justify-center gap-1 pr-4 border-r border-border/50 min-w-[80px]">
                <div className="flex items-center gap-1 relative"
                     onMouseEnter={() => completionPercentage > 0 && completionPercentage < 100 && setShowStreakTooltip(true)}
                     onMouseLeave={() => setShowStreakTooltip(false)}
                     onTouchStart={() => completionPercentage > 0 && completionPercentage < 100 && setShowStreakTooltip(true)}
                     onTouchEnd={() => setShowStreakTooltip(false)}
                >
                    <span className="text-4xl sm:text-5xl font-bold text-foreground leading-none">{streakDays}</span>
                    
                    {/* Percentage-Filled Flame Icon */}
                    <div 
                        className="relative w-8 h-8 flex items-center justify-center"
                        onMouseEnter={() => completionPercentage > 0 && completionPercentage < 100 && setShowStreakTooltip(true)}
                        onMouseLeave={() => setShowStreakTooltip(false)}
                        onTouchStart={() => completionPercentage > 0 && completionPercentage < 100 && setShowStreakTooltip(true)}
                        onTouchEnd={() => setShowStreakTooltip(false)}
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="relative transition-all duration-300"
                        >
                            <defs>
                                <linearGradient id={`flameGradient-${completionPercentage}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    {/* Top portion (gray when incomplete) */}
                                    <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.3" />
                                    {/* Transition point */}
                                    <stop offset={`${100 - completionPercentage}%`} stopColor="#9CA3AF" stopOpacity="0.3" />
                                    <stop offset={`${100 - completionPercentage}%`} stopColor="#F97316" stopOpacity="1" />
                                    {/* Bottom portion (orange when filled) */}
                                    <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            
                            <path
                                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                                fill={`url(#flameGradient-${completionPercentage})`}
                                stroke={completionPercentage > 0 ? "#F97316" : "#9CA3AF"}
                                strokeWidth="0.5"
                                strokeOpacity={completionPercentage > 0 ? "0.5" : "0.3"}
                            />
                        </svg>
                    </div>
                    
                    {/* Tooltip - Updated to show percentage */}
                    {showStreakTooltip && completionPercentage > 0 && completionPercentage < 100 && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-card-bg border border-primary/30 rounded-xl shadow-lg text-xs text-foreground whitespace-nowrap">
                            <div className="font-semibold text-primary mb-0.5">🔥 {completionPercentage}% Complete</div>
                            <div className="text-muted-foreground">Complete all habits to grow your fire</div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card-bg border-r border-b border-primary/30 rotate-45"></div>
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
                    Streak
                </span>
            </div>

            {/* Right: Calendar */}
            <div className="flex-1 w-full flex justify-between items-center gap-1 overflow-x-auto no-scrollbar">
            {(() => {
                const current = new Date();
                const currentDay = current.getDay(); 
                const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1; 
                const startOfWeek = new Date(current);
                startOfWeek.setDate(current.getDate() - daysToSubtract);

                const completedDates = new Set<string>();
                if (streakHistory && streakHistory.length > 0) {
                    streakHistory.forEach(dateStr => completedDates.add(dateStr));
                }

                return Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    
                    const isToday = date.getDate() === current.getDate() && 
                                    date.getMonth() === current.getMonth();
                    
                    const dayNum = date.getDate();
                    const dayInitial = date.toLocaleDateString('en-US', { weekday: 'narrow' }); 
                    
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    // Logic for Green Checkmark (All Done)
                    let isStreakDay = completedDates.has(dateStr);
                    
                    // Optimistic check for Today
                    if (isToday) {
                        const allDoneToday = habits.length > 0 && !habits.some(h => !h.completed_today);
                        if (allDoneToday) {
                            isStreakDay = true;
                        }
                    }

                    return (
                        <div key={i} className="flex flex-col items-center gap-2 min-w-[30px]">
                             <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                {dayInitial}
                             </span>
                             
                             <div className={`
                                w-8 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all relative
                                ${isToday 
                                    ? 'bg-transparent border border-primary text-primary shadow-[0_0_10px_rgba(255,107,0,0.2)]' 
                                    : 'text-muted-foreground/40'
                                }
                             `}>
                                {dayNum}

                                {/* Green Tickmark for All Done */}
                                {isStreakDay && (
                                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card-bg flex items-center justify-center shadow-sm z-10">
                                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                     </div>
                                )}

                                {/* Fallback Dot (Only if NOT streak day but Today? Or just keep simple?) 
                                    User only asked for Green Tick. 
                                    If it's Today and NOT done, show active dot?
                                */}
                                {isToday && !isStreakDay && (
                                     <div className="absolute mb-[-20px] w-1.5 h-1.5 bg-primary rounded-full" />
                                )}
                             </div>
                        </div>
                    );
                });
            })()}
            </div>
        </div>
      </div>

      {/* Today */}
      {habits.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Today's Focus</h2>
          <span className="text-sm text-primary">
            {remainingCount} Remaining
          </span>
        </div>
      )}

      {/* Habits */}
      <div className="space-y-4 mb-8">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
            <span className="text-4xl filter drop-shadow-lg">✨</span>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-foreground">Start your journey</h3>
              <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                Add your first daily habit to begin building your streak
              </p>
            </div>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={{
                id: habit.id,
                name: habit.name,
                microIdentity: habit.micro_identity ?? "",
                progress: habit.completionsCount, // Now using completions count
                goal: habit.duration, // Now using duration as the denominator
                completed: habit.completed_today,
              }}
              onComplete={() => onCompleteHabit(habit.id)}
              onUndo={() => onUndoHabit(habit.id)}
              onEdit={() => onEditHabit(habit.id)}
              onDelete={() => setHabitToDelete(habit.id)}
            />
          ))
        )}
      </div>

      {/* Add Habit */}
      <button
        onClick={() => onNavigate("create")}
        className="w-full bg-card-bg hover:bg-accent border border-card-border rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors mb-6 group"
      >
        <Plus size={20} className="text-primary group-hover:scale-110 transition-transform" />
        <span className="text-muted-foreground group-hover:text-foreground">Add New Habit</span>
      </button>

      {/* Mental Models */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-card-bg rounded-2xl p-6 border border-primary/20 relative overflow-hidden shadow-lg shadow-black/5">
          <div className="absolute -top-4 -right-4 text-primary/10 rotate-12">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
               <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01703C7.91246 16 7.01703 16.8954 7.01703 18L7.01703 21H5.01703V18C5.01703 15.7909 6.80789 14 9.01703 14H12.017C14.2262 14 16.017 15.7909 16.017 18V21H14.017ZM19.017 10L19.017 13C19.017 14.1046 18.1216 15 17.017 15H14.017C12.9125 15 12.017 14.1046 12.017 13V10H10.017V13C10.017 15.2091 11.8079 17 14.017 17H17.017C19.2262 17 21.017 15.2091 21.017 13V10H19.017ZM7.01703 10L7.01703 13C7.01703 14.1046 6.1216 15 5.01703 15H2.01703C0.912458 15 0.0170288 14.1046 0.0170288 13V10H2.01703V13C2.01703 14.6569 3.36017 16 5.01703 16H6.18873C6.70054 16.6346 6.82855 17.5144 6.50571 18.2676L6.01703 19.4079L7.85243 20.1944L8.34111 19.0541C9.07065 17.3518 8.79051 15.3415 7.55835 13.9113L7.01703 13.282V10Z" />
            </svg>
          </div>
          
          <div className="relative z-10">
             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
              {currentQuote.category}
            </span>
            <p className="text-xl font-serif italic leading-relaxed mb-2 text-foreground/90">
              "{currentQuote.text}"
            </p>
          </div>
        </div>
      </div>
    
    <AlertDialog open={!!habitToDelete} onOpenChange={(open) => !open && setHabitToDelete(null)}>
        <AlertDialogContent className="bg-background border border-border text-foreground rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this habit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
                className="bg-secondary text-foreground border-transparent hover:bg-secondary/80 hover:text-foreground rounded-xl"
                onClick={() => setHabitToDelete(null)}
            >
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => {
                    if (habitToDelete) {
                        onDeleteHabit(habitToDelete);
                        setHabitToDelete(null);
                    }
                }}
                className="bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
