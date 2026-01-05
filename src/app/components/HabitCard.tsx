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
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ... (startHold/endHold unchanged) ...

  const startHold = () => {
    if (habit.completed) return;
    
    setIsHolding(true);
    let progress = 0;
    
    progressTimerRef.current = setInterval(() => {
      progress += 3.33; // 100% in 30 intervals = ~0.9 seconds
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressTimerRef.current!);
        onComplete();
        setHoldProgress(0);
        setIsHolding(false);
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
    setIsHolding(false);
    setHoldProgress(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2a1f19] rounded-2xl p-4 shadow-lg relative overflow-hidden group"
    >
      {/* Micro-identity Badge & Delete */}
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-3 py-1.5 bg-[#3d2f26] text-[#b5a79a] text-xs rounded-full">
          {habit.microIdentity}
        </span>
        <div className="flex items-center gap-2">
            {habit.completed && (
            <div className="w-8 h-8 rounded-full bg-[#ff5722] flex items-center justify-center">
                <Check size={16} className="text-white" strokeWidth={3} />
            </div>
            )}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Delete this habit?")) onDelete();
                }}
                className="p-1.5 text-[#8a7a6e] hover:text-red-500 hover:bg-[#3d2f26] rounded-lg transition-colors"
                title="Delete Habit"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {/* Habit Name & Progress */}
      <h3 className="text-lg font-semibold mb-1.5">{habit.name}</h3>
      <p className="text-sm text-[#8a7a6e] mb-4">
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
          <div className="relative bg-[#3d2f26] hover:bg-[#4a3a2e] active:bg-[#4a3a2e] rounded-full py-3.5 overflow-hidden transition-colors">
            {/* Progress Background */}
            <motion.div
              className="absolute inset-0 bg-[#ff5722] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${holdProgress}%` }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Button Text */}
            <span className="relative z-10 flex items-center justify-center gap-2 text-white font-medium">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
              </svg>
              Hold to Complete
            </span>
          </div>
        </button>
      ) : (
        <div className="w-full bg-[#1f4d1f] rounded-full py-3.5 flex items-center justify-center gap-2">
          <Check size={16} className="text-[#4ade80]" strokeWidth={3} />
          <span className="text-[#4ade80] font-medium">Completed</span>
        </div>
      )}
    </motion.div>
  );
}