import { Flame, Users } from 'lucide-react';

type Screen = 'habits' | 'create' | 'profile' | 'social' | 'groups';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav-bg/95 backdrop-blur-xl border-t border-nav-border max-w-md mx-auto z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around py-3">
        <button
          onClick={() => onNavigate('habits')}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            currentScreen === 'habits' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Flame size={24} className={currentScreen === 'habits' ? 'fill-primary' : ''} />
          <span className="text-xs">Habits</span>
        </button>

        <button
          onClick={() => onNavigate('social')}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            currentScreen === 'social' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Users size={24} />
          <span className="text-xs">Social</span>
        </button>

        <button
          onClick={() => onNavigate('groups')}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            currentScreen === 'groups' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Users size={24} className={currentScreen === 'groups' ? 'fill-primary/20' : ''} />
          <span className="text-xs">Groups</span>
        </button>
      </div>
    </nav>
  );
}