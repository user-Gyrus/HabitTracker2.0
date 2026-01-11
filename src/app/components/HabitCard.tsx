import { useState, useRef } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Habit {
  id: string;
  microIdentity: string;
  name: string;
  progress: number;
  goal: number;
  completed: boolean;
}

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, onComplete, onDelete }: HabitCardProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  // const [isHolding, setIsHolding] = useState(false); // Unused
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ... (startHold/endHold unchanged) ...

  const startHold = () => {
    if (habit.completed) return;
    
    // setIsHolding(true);
    let progress = 0;
    
    progressTimerRef.current = setInterval(() => {
      progress += 3.33; // 100% in 30 intervals = ~0.9 seconds
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressTimerRef.current!);
        onComplete();
        setHoldProgress(0);
        // setIsHolding(false);
      }
    }, 30);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    // setIsHolding(false);
    setHoldProgress(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg rounded-2xl p-4 shadow-lg relative overflow-hidden group border border-card-border"
    >
      {/* Micro-identity Badge & Delete */}
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-3 py-1.5 bg-secondary text-muted-foreground text-xs rounded-full font-medium">
          {habit.microIdentity}
        </span>
        <div className="flex items-center gap-2">
            {habit.completed && (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Check size={16} className="text-white" strokeWidth={3} />
            </div>
            )}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-lg transition-colors"
                title="Delete Habit"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {/* Habit Name & Progress */}
      <h3 className="text-lg font-semibold mb-1.5 text-foreground">{habit.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {habit.progress}/{habit.goal}
      </p>

      {/* Hold to Complete Button */}
      {!habit.completed ? (
        <button
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          className="w-full relative touch-none"
        >
          <div className="relative bg-secondary hover:bg-secondary/80 active:bg-secondary/80 rounded-full py-3.5 overflow-hidden transition-colors">
            {/* Progress Background */}
            <motion.div
              className="absolute inset-0 bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${holdProgress}%` }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Button Text */}
            <span className="relative z-10 flex items-center justify-center gap-2 text-foreground font-medium group-hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
              </svg>
              Hold to Complete
            </span>
          </div>
        </button>
      ) : (
        <div className="w-full bg-green-500/20 rounded-full py-3.5 flex items-center justify-center gap-2">
          <Check size={16} className="text-green-500" strokeWidth={3} />
          <span className="text-green-500 font-medium">Completed</span>
        </div>
      )}
    </motion.div>
  );
}