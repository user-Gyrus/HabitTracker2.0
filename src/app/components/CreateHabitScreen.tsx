import { useState } from 'react';
import { X, User, Globe, Lock, Minus, Plus, Info } from 'lucide-react';

interface CreateHabitScreenProps {
  onBack: () => void;
  onCreate: (habit: any) => void;
}

export function CreateHabitScreen({ onBack, onCreate }: CreateHabitScreenProps) {
  const [habitType, setHabitType] = useState<'build' | 'break'>('build');
  const [microIdentity, setMicroIdentity] = useState('');
  const [habitName, setHabitName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [duration, setDuration] = useState<number>(21);
  const [showInfo, setShowInfo] = useState(false);

  const days = [
    { num: 1, label: 'M' },
    { num: 2, label: 'T' },
    { num: 3, label: 'W' },
    { num: 4, label: 'T' },
    { num: 5, label: 'F' },
    { num: 6, label: 'S' },
    { num: 7, label: 'S' },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCreate = () => {
    if (!microIdentity || !habitName) return;

    onCreate({
      microIdentity,
      name: habitName,
      type: habitType,
      days: selectedDays,
      visibility,
      duration,
      progress: 0,
      goal: 1,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <X size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">New Habit</h1>
        <div className="w-10"></div> {/* Spacer to keep title centered if needed, or just nothing. Let's use a spacer or just remove it. */ }
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Build / Break Toggle */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-muted-foreground uppercase tracking-wide">
              Habit Type
            </label>
            <div className="group relative">
              <div onClick={() => setShowInfo(!showInfo)} className="cursor-pointer">
                <Info 
                  size={16} 
                  className={`text-muted-foreground hover:text-primary transition-colors ${showInfo ? 'text-primary' : ''}`} 
                />
              </div>
              {/* Tooltip */}
              <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-card-bg border border-card-border rounded-xl p-3 shadow-lg transition-all duration-200 z-10 ${showInfo ? 'visible opacity-100' : 'invisible opacity-0 group-hover:visible group-hover:opacity-100'}`}>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-primary">Build:</span>
                    <span className="text-muted-foreground ml-1">Create good habits</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Break:</span>
                    <span className="text-muted-foreground ml-1">Remove bad ones</span>
                  </div>
                </div>
                {/* Arrow pointing down */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-card-border"></div>
              </div>
            </div>
          </div>
          <div className="inline-flex bg-card-bg border border-card-border rounded-full p-1 w-full">
            <button
              onClick={() => setHabitType('build')}
              className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                habitType === 'build'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Build
            </button>
            <button
              onClick={() => setHabitType('break')}
              className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                habitType === 'break'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Break
            </button>
          </div>
        </div>

        {/* Habit Name */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wide">
            Habit Name
          </label>
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Morning Run"
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Micro-Identity */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wide">
            Micro-Identity
          </label>
          <div className="relative">
            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={microIdentity}
              onChange={(e) => setMicroIdentity(e.target.value)}
              placeholder="e.g. The Athlete"
              className="w-full bg-input border border-border rounded-xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Who are you becoming by doing this?
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wide">
            Visibility
          </label>
          <div className="bg-card-bg border border-card-border p-1 rounded-2xl flex relative">
              {/* Sliding background could be added here for animation, but simple state switching works for now */}
             <button
              onClick={() => setVisibility('public')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
                visibility === 'public'
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Globe size={18} />
              <span className="font-medium">Public</span>
            </button>
            <button
              onClick={() => setVisibility('private')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
                visibility === 'private'
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Lock size={18} />
              <span className="font-medium">Private</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Public habits are visible to your friends for accountability.
          </p>
        </div>

        {/* Frequency */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-muted-foreground uppercase tracking-wide">
              Frequency
            </label>
            <button 
              onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Daily
            </button>
          </div>
          <div className="flex gap-2 justify-between">
            {days.map((day) => (
              <button
                key={day.num}
                onClick={() => toggleDay(day.num)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  selectedDays.includes(day.num)
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'bg-card-bg text-muted-foreground border border-card-border'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
           <label className="block text-sm text-muted-foreground mb-3 uppercase tracking-wide">
            Duration
          </label>
           <div className="bg-card-bg border border-card-border rounded-2xl p-6 flex flex-col items-center">
             
             {/* Large Input Display with Controls */}
             <div className="flex items-center gap-6 mb-2">
                <button
                  onClick={() => setDuration(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Minus size={18} />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-32 bg-transparent text-center text-5xl font-bold text-foreground focus:outline-none placeholder:text-muted"
                  />
                </div>

                <button
                  onClick={() => setDuration(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
             </div>
             
             {/* Divider & Label */}
             <div className="w-16 h-1 bg-primary rounded-full mb-3 opacity-80"></div>
             <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-8">
               Days Target
             </p>

             {/* Presets */}
             <div className="flex gap-3 w-full justify-center">
               {[21, 48, 66].map((days) => (
                 <button
                   key={days}
                   onClick={() => setDuration(days)}
                   className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                     duration === days
                       ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(255,87,34,0.3)] transform scale-105'
                       : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                   }`}
                 >
                   {days} Days
                 </button>
               ))}
             </div>
           </div>
         </div>

        {/* Start Habit Button */}
        <button
          onClick={handleCreate}
          disabled={!microIdentity || !habitName}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-full py-4 flex items-center justify-center gap-2 transition-colors mt-8"
        >
          Start Habit
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
