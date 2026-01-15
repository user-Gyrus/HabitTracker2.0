import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface Habit {
  id: string;
  microIdentity: string;
  name: string;
  progress: number; // Current day of the journey (e.g. 4)
  goal: number; // Total duration (e.g. 21)
  completed: boolean;
}

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, onComplete, onDelete }: HabitCardProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    if (habit.completed) return;
    
    let progress = 0;
    // 600ms to complete
    const duration = 600; 
    const interval = 10;
    const step = 100 / (duration / interval);
    
    progressTimerRef.current = setInterval(() => {
      progress += step;
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressTimerRef.current!);
        onComplete();
        setHoldProgress(0);
      }
    }, interval);
  };

  const endHold = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    setHoldProgress(0);
  };

  // Calculate circular progress for the day/streak indicator
  // If habit is 21 days, and we are on day 4:
  // Percentage = (4 / 21) * 100
  const streakPercentage = Math.min(100, (habit.progress / habit.goal) * 100);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (streakPercentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg rounded-2xl p-4 flex items-center gap-4 border border-card-border shadow-sm group relative overflow-hidden"
    >
        {/* Global Progress Fill (Background) */}
        <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/20 z-0"
            initial={{ width: "0%" }}
            animate={{ width: `${holdProgress}%` }}
            transition={{ duration: 0 }}
        />

        {/* Delete Button - Always Visible */}
        <div className="absolute right-2 top-2 z-20">
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-secondary/50 transition-colors"
                title="Delete"
             >
                <Trash2 size={14} />
             </button>
        </div>

        {/* Left: Circular Progress */}
        <div className="relative z-10 w-16 h-16 flex-shrink-0 flex items-center justify-center">
            {/* Background Ring */}
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-secondary"
                />
                {/* Progress Ring */}
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                    <span className="text-primary">{habit.progress || 0}</span>
                    <span className="text-muted-foreground">/{habit.goal}</span>
                </span>
            </div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
            <h3 className="text-base font-bold text-foreground truncate leading-tight mb-1">
                {habit.name}
            </h3>
            <p className="text-[10px] font-bold text-primary tracking-wider uppercase">
                {habit.microIdentity || 'BUILDING HABIT'}
            </p>
        </div>

        {/* Right: Action Button */}
        <div className="w-[100px] flex-shrink-0 relative z-10">
            {habit.completed ? (
                 <div className="w-full h-10 rounded-full bg-secondary/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground tracking-wide">
                    DONE
                </div>
            ) : (
                <button
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className="w-full h-10 rounded-full bg-card-bg border border-card-border relative overflow-hidden group/btn hover:border-primary/50 transition-colors"
                >
                    <span className="relative z-10 text-xs font-bold text-foreground tracking-wide group-hover/btn:text-primary transition-colors">
                        HOLD
                    </span>
                </button>
            )}
        </div>
    </motion.div>
  );
}