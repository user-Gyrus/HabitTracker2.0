import { useState, useRef } from 'react';
import { X, User, Clock } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';

interface CreateHabitScreenProps {
  onBack: () => void;
  onCreate: (habit: any) => void;
}

export function CreateHabitScreen({ onBack, onCreate }: CreateHabitScreenProps) {
  const [habitType, setHabitType] = useState<'build' | 'break'>('build');
  const [microIdentity, setMicroIdentity] = useState('');
  const [habitName, setHabitName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00'); // Added missing state
  const timeInputRef = useRef<HTMLInputElement>(null);

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
      reminderEnabled,
      reminderTime, // Added
      progress: 0,
      goal: 1,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-[#3d2f26]">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#2a1f19] rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
        <h1 className="text-xl font-semibold">New Habit</h1>
        <div className="w-10"></div> {/* Spacer to keep title centered if needed, or just nothing. Let's use a spacer or just remove it. */ }
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Build / Break Toggle */}
        <div>
          <div className="inline-flex bg-[#2a1f19] rounded-full p-1 w-full">
            <button
              onClick={() => setHabitType('build')}
              className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                habitType === 'build'
                  ? 'bg-[#ff5722] text-white'
                  : 'text-[#8a7a6e]'
              }`}
            >
              Build
            </button>
            <button
              onClick={() => setHabitType('break')}
              className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                habitType === 'break'
                  ? 'bg-[#3d2f26] text-white'
                  : 'text-[#8a7a6e]'
              }`}
            >
              Break
            </button>
          </div>
        </div>

        {/* Micro-Identity */}
        <div>
          <label className="block text-sm text-[#8a7a6e] mb-2 uppercase tracking-wide">
            Micro-Identity
          </label>
          <div className="relative">
            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a6e]" />
            <input
              type="text"
              value={microIdentity}
              onChange={(e) => setMicroIdentity(e.target.value)}
              placeholder="e.g. The Athlete"
              className="w-full bg-[#2a1f19] border border-[#3d2f26] rounded-xl px-10 py-3 text-white placeholder:text-[#8a7a6e] focus:outline-none focus:border-[#ff5722] transition-colors"
            />
          </div>
          <p className="text-xs text-[#8a7a6e] mt-2">
            Who are you becoming by doing this?
          </p>
        </div>

        {/* Habit Name */}
        <div>
          <label className="block text-sm text-[#8a7a6e] mb-2 uppercase tracking-wide">
            Habit Name
          </label>
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Morning Run"
            className="w-full bg-[#2a1f19] border border-[#3d2f26] rounded-xl px-4 py-3 text-white placeholder:text-[#8a7a6e] focus:outline-none focus:border-[#ff5722] transition-colors"
          />
        </div>

        {/* Frequency */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-[#8a7a6e] uppercase tracking-wide">
              Frequency
            </label>
            <button 
              onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
              className="text-sm text-[#ff5722] hover:text-[#ff6b3d] transition-colors"
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
                    ? 'bg-[#ff5722] text-white scale-105'
                    : 'bg-[#2a1f19] text-[#8a7a6e] border border-[#3d2f26]'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="bg-[#2a1f19] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${reminderEnabled ? 'bg-[#ff5722]/20' : 'bg-[#3d2f26]'}`}>
                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 6V10L12 12M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                    stroke={reminderEnabled ? "#ff5722" : "#8a7a6e"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium mb-1">Reminder</p>
                {reminderEnabled ? (
                  <button 
                    onClick={() => timeInputRef.current?.showPicker()}
                    className="relative inline-flex items-center gap-2 bg-[#ff5722]/10 px-3 py-1.5 rounded-lg border border-[#ff5722]/20 hover:bg-[#ff5722]/20 transition-colors"
                  >
                    <Clock size={14} className="text-[#ff5722]" />
                    <span className="text-sm font-medium text-[#ff5722]">
                      {(() => {
                        if (!reminderTime) return 'Set time';
                        const [hours, minutes] = reminderTime.split(':');
                        const h = parseInt(hours, 10);
                        const period = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        return `${h12}:${minutes} ${period}`;
                      })()}
                    </span>
                    <input 
                        ref={timeInputRef}
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                    />
                  </button>
                ) : (
                  <p className="text-sm text-[#8a7a6e]">Off</p>
                )}
              </div>
            </div>
            
            <Switch.Root
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
                className={`w-12 h-6 rounded-full relative shadow-inner transition-colors ${
                  reminderEnabled ? 'bg-[#ff5722]' : 'bg-[#3d2f26]'
                }`}
              >
                <Switch.Thumb className={`block w-4 h-4 bg-white rounded-full shadow transition-transform duration-100 will-change-transform ${
                  reminderEnabled ? 'translate-x-[26px]' : 'translate-x-1'
                }`} />
            </Switch.Root>
          </div>
        </div>

        {/* Start Habit Button */}
        <button
          onClick={handleCreate}
          disabled={!microIdentity || !habitName}
          className="w-full bg-[#ff5722] hover:bg-[#ff6b3d] disabled:bg-[#3d2f26] disabled:text-[#8a7a6e] text-white rounded-full py-4 flex items-center justify-center gap-2 transition-colors mt-8"
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
