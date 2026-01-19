import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Check, RotateCcw, Pencil } from 'lucide-react';

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
  onUndo: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, onComplete, onUndo, onEdit, onDelete }: HabitCardProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    // OLD: if (habit.completed) return;
    // NEW: Allow hold even if completed (to undo)
    
    let progress = 0;
    // 1500ms to complete (increased from 600ms)
    const duration = 1500; 
    const interval = 10;
    const step = 100 / (duration / interval);
    
    progressTimerRef.current = setInterval(() => {
      progress += step;
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressTimerRef.current!);
        if (habit.completed) {
            onUndo();
        } else {
            onComplete();
        }
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
      animate={{ 
          opacity: habit.completed ? 0.6 : 1, // Subtle opacity drop
          y: 0,
          scale: 1,
          filter: habit.completed ? 'grayscale(100%)' : 'grayscale(0%)' // Full grayscale for modern "done" look
      }}
      whileTap={{ scale: 0.98 }} // Tactile feedback
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      className={`
        bg-card-bg rounded-2xl p-4 flex items-center gap-4 border shadow-sm group relative overflow-hidden select-none cursor-pointer transition-colors
        ${habit.completed ? 'border-card-border/50' : 'border-card-border'}
      `}
    >
        {/* Global Progress Fill (Background) */}
        {/* DIFFERENT COLORS FOR COMPLETE vs UNDO */}
        <motion.div 
            className={`absolute inset-0 z-0 ${habit.completed ? 'bg-red-500/20' : 'bg-primary/20'}`} 
            initial={{ width: "0%" }}
            animate={{ width: `${holdProgress}%` }}
            transition={{ duration: 0 }}
        >
             {/* Progress text for Undo state */}
             {habit.completed && holdProgress > 10 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <RotateCcw size={48} className="text-red-500" />
                </div>
             )}
        </motion.div>

        {/* Actions: Edit & Delete */}
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
             <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary/50 transition-colors"
                title="Edit"
             >
                <Pencil size={14} />
             </button>
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
                {habit.completed ? (
                   <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                   >
                     <Check size={20} className="text-foreground font-bold" strokeWidth={3} />
                   </motion.div>
                ) : (
                    <span className="text-xs font-bold text-foreground">
                        <span className="text-primary">{habit.progress || 0}</span>
                        <span className="text-muted-foreground">/{habit.goal}</span>
                    </span>
                )}
            </div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
            <h3 className={`text-base font-bold text-foreground break-words leading-tight mb-1 ${habit.completed ? 'line-through decoration-muted-foreground/50' : ''}`}>
                {habit.name}
            </h3>
            <p className="text-[9px] font-bold text-primary tracking-wider uppercase break-all">
                {habit.microIdentity || 'BUILDING HABIT'}
            </p>
        </div>

        {/* Right: Action Button */}
        <div className="w-[80px] flex-shrink-0 relative z-10">
            {habit.completed ? (
                 <div className="w-full h-8 rounded-full bg-transparent border-2 border-foreground/10 flex items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground tracking-wide">
                    <span>DONE</span>
                </div>
            ) : (
                <button
                    className="w-full h-8 rounded-full bg-card-bg border border-card-border relative overflow-hidden group/btn hover:border-primary/50 transition-colors"
                >
                    <span className="relative z-10 text-[10px] font-bold text-foreground tracking-wide group-hover/btn:text-primary transition-colors">
                        HOLD
                    </span>
                </button>
            )}
        </div>
    </motion.div>
  );
}