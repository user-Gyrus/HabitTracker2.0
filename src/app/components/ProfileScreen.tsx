import {
  ChevronLeft,
  Bell,
  UserPlus,
  LogOut,
  ChevronRight,
  Pencil,
  Check,
} from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type Screen = "habits" | "create" | "profile" | "social";

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
  isModal?: boolean;
  onClose?: () => void;
  updateSession?: (updatedUser: any) => void;
  streak?: number;
}

interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  email?: string;
  token?: string;
  friendCode?: string;
}

const STORAGE_KEY_SESSION = "habit-tracker-session";

export function ProfileScreen({ onNavigate, isModal = false, onClose, updateSession, streak = 0 }: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  // Streak passed via props
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(true);
  const { theme, setTheme } = useTheme();
  // Ensure hydration match
  // const [mounted, setMounted] = useState(false);
  // useEffect(() => setMounted(true), []);

  /* ---------------------------
     LOAD PROFILE + STREAK (MOCK)
  ---------------------------- */
  useEffect(() => {
    // 1. Load User Session
    const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    if (storedSession) {
      setProfile(JSON.parse(storedSession));
    }

    // 2. Mock streak removed, using prop
  }, []);

  /* ---------------------------
     LOGOUT
  ---------------------------- */
  const handleLogout = (): void => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem("HAS_COMPLETED_ONBOARDING");
    window.location.reload(); // Simple reload to reset state/auth guard
  };

  /* ---------------------------
     EDIT DISPLAY NAME
  ---------------------------- */
  const handleStartEdit = () => {
    if (!profile) return;
    setEditName(profile.display_name);
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    if (!profile || !editName.trim()) return;

    try {
      // 1. Optimistic Update (Local)
      const updatedProfile = { ...profile, display_name: editName.trim() };
      setProfile(updatedProfile);
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedProfile));
      
      // Update parent session explicitly if function provided
      if (updateSession) {
        updateSession(updatedProfile);
      }

      setIsEditing(false);

      // 2. API Update (Backend)
      if (profile.token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${profile.token}`,
            },
            body: JSON.stringify({ displayName: editName.trim() }),
        });

        if (!res.ok) {
            console.error("Failed to update profile on server");
            // Optionally revert local change or show error
        } else {
             const data = await res.json();
             // Update with server response to be sure (sync source of truth)
             // We need to map server response fields to frontend Profile shape if different
             // Server returns: { _id, username, displayName, email, token }
             const newProfile = {
                 ...updatedProfile,
                 display_name: data.displayName,
                 username: data.username,
                 email: data.email,
                 // Ensure we keep the token if server returns a new one or use old
                 token: data.token || profile.token, 
             };
             setProfile(newProfile);
             localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newProfile));
        }
      }
    } catch (error) {
        console.error("Error updating profile:", error);
    }
  };

  if (!profile) return null;

  const profileContent = (
    <div className={!isModal ? "min-h-screen" : ""}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6">
        <button
          onClick={isModal && onClose ? onClose : () => onNavigate("habits")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Profile & Settings</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 pb-28">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 shadow-lg" />
            <button 
              onClick={isEditing ? handleSaveName : handleStartEdit}
              className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background transition-colors ${
                isEditing ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isEditing ? (
                <Check size={14} className="text-white" />
              ) : (
                <Pencil size={14} className="text-white" />
              )}
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-1 text-foreground">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
                className="bg-transparent border-b border-primary text-2xl font-bold text-center focus:outline-none text-foreground w-full"
                autoFocus
              />
            ) : (
              profile.display_name
            )}
          </h2>
          <p className="text-muted-foreground mb-2">
            @{profile.username ?? "user"}
          </p>
          
          {/* Friend Code */}
          <div className="flex items-center gap-2 px-4 py-2 bg-card-bg rounded-lg border border-card-border">
            <span className="text-xs text-muted-foreground font-mono">Friend Code:</span>
            <span className="text-sm font-mono text-primary font-semibold">
              {profile.friendCode || "HABIT-XXXXXX"}
            </span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-primary to-orange-400 rounded-2xl p-6 mb-6 text-center shadow-lg shadow-primary/20">
          <p className="text-sm text-white/90 mb-2 uppercase tracking-wide font-medium">
            Current Streak
          </p>
          <p className="text-5xl font-bold mb-2 text-white">{streak}</p>
          <p className="text-white/95 font-medium">Days on fire 🔥</p>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3 px-1 font-semibold">
            Preferences
          </h3>
          <div className="bg-card-bg rounded-2xl overflow-hidden divide-y divide-card-border border border-card-border shadow-sm">
            
            {/* Theme Toggle */}
            <div className="w-full flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                   {theme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                      </svg>
                   ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2"/>
                        <path d="M12 20v2"/>
                        <path d="m4.93 4.93 1.41 1.41"/>
                        <path d="m17.66 17.66 1.41 1.41"/>
                        <path d="M2 12h2"/>
                        <path d="M20 12h2"/>
                        <path d="m6.34 17.66-1.41 1.41"/>
                        <path d="m19.07 4.93-1.41 1.41"/>
                      </svg>
                   )}
                </div>
                <span className="text-foreground font-medium">
                    {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                </span>
              </div>
              <Switch.Root
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="w-11 h-6 bg-input rounded-full relative data-[state=checked]:bg-primary transition-colors duration-300 cursor-pointer"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-300 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
              </Switch.Root>
            </div>

            <div className="w-full flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </div>
                <span className="text-foreground font-medium">Push Notifications</span>
              </div>
              <Switch.Root
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                className="w-11 h-6 bg-input rounded-full relative data-[state=checked]:bg-primary transition-colors duration-300 cursor-pointer"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-300 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
              </Switch.Root>
            </div>

            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserPlus size={20} className="text-green-500" />
                </div>
                <span className="text-foreground font-medium">Invite a friend</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3 px-1 font-semibold">
            Account
          </h3>
          <div className="bg-card-bg rounded-2xl overflow-hidden divide-y divide-card-border border border-card-border shadow-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <LogOut size={20} className="text-blue-500" />
                </div>
                <span className="text-foreground font-medium">Logout</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
            
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">Accountability Board v1.1.0 (Themed)</p>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center px-5"
        onClick={onClose}
      >
        {/* Backdrop with blur - lighter in light mode */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-lg" />
        
        {/* Modal Content */}
        <div 
          className="relative w-full max-w-md bg-background border border-card-border rounded-3xl shadow-2xl max-h-[75vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onClick={(e) => e.stopPropagation()}
        >
          {profileContent}
        </div>
      </div>
    );
  }

  return profileContent;
}
