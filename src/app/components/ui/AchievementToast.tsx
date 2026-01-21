import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy } from 'lucide-react';

export type AchievementType = 'default' | 'streak' | 'milestone' | 'level-up' | 'freeze';

interface AchievementToastProps {
  visible: boolean;
  title: string;
  description: string;
  icon?: React.ReactNode;
  type?: AchievementType;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  visible,
  title,
  description,
  icon,
  type = 'default',
  onClose,
}) => {
  // Auto-close after 4 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const getGlowColor = () => {
    switch (type) {
      case 'streak': return 'rgba(255, 87, 34, 0.5)'; // Orange
      case 'milestone': return 'rgba(234, 179, 8, 0.5)'; // Gold
      case 'level-up': return 'rgba(168, 85, 247, 0.5)'; // Purple
      case 'freeze': return 'rgba(56, 189, 248, 0.5)'; // Cyan/Ice Blue
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const glowColor = getGlowColor();

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-6">
            {/* Backdrop for focus */}
            {/* <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            /> */}

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 300 
            }}
            className="relative w-full max-w-sm bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl pointer-events-auto overflow-hidden"
            style={{
              boxShadow: `0 0 40px ${glowColor}, 0 0 100px ${glowColor} inset`
            }}
          >
             {/* Shiny Effect Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
             
             {/* Close Button */}
             <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
             >
                 <X size={16} />
             </button>

            {/* Icon Container using flex to center content properly */}
            <div className="flex flex-col items-center justify-center">
                <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center shadow-inner"
                >
                    {icon || <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />}
                </motion.div>

                <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2 tracking-tight"
                >
                    {title}
                </motion.h3>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-gray-300 font-medium leading-relaxed max-w-[80%]"
                >
                    {description}
                </motion.p>
            </div>
            
            {/* Bottom shine line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
