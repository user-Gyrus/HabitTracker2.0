import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { AchievementToast, type AchievementType } from '../components/ui/AchievementToast';

interface AchievementData {
  title: string;
  description: string;
  icon?: React.ReactNode;
  type?: AchievementType;
}

interface AchievementContextType {
  showAchievement: (data: AchievementData) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [currentData, setCurrentData] = useState<AchievementData | null>(null);

  const showAchievement = (data: AchievementData) => {
    // If already showing one, you might want to queue it or just overwrite.
    // Overwriting for "latest wins" feel for now.
    setVisible(false);
    setTimeout(() => {
        setCurrentData(data);
        setVisible(true);
    }, 100); // Small delay to allow reset animation if active
  };

  const closeAchievement = () => {
    setVisible(false);
  };

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      {currentData && (
        <AchievementToast
          visible={visible}
          title={currentData.title}
          description={currentData.description}
          icon={currentData.icon}
          type={currentData.type}
          onClose={closeAchievement}
        />
      )}
    </AchievementContext.Provider>
  );
};

export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
};
