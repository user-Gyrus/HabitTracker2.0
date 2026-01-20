import {
  ChevronLeft,
  Bell,
  UserPlus,
  LogOut,
  ChevronRight,
  Pencil,
  Check,
  Copy,
  X,
  Share2,
  MessageCircle,
  Flame,
} from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications 
} from "../../lib/pushNotifications";
import { API_URL } from "../../config";

type Screen = "habits" | "create" | "profile" | "social";

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
  isModal?: boolean;
  onClose?: () => void;
  updateSession?: (updatedUser: any) => void;
  streak?: number;
  streakFreezes?: number;
}

interface Profile {
  _id: string;
  id?: string; // Keep for backwards compatibility
  display_name: string;
  username: string | null;
  email?: string;
  token?: string;
  friendCode?: string;
  streakFreezes?: number;
}

const STORAGE_KEY_SESSION = "habit-tracker-session";

export function ProfileScreen({ onNavigate, isModal = false, onClose, updateSession, streak = 0, streakFreezes = 0 }: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  // Streak passed via props
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
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
      const parsedProfile = JSON.parse(storedSession);
      setProfile(parsedProfile);
      
      // 2. Check push notification subscription status
      checkNotificationStatus();
      
      // 2. If friendCode is missing, fetch from backend
      if (!parsedProfile.friendCode && parsedProfile.token) {
        const fetchFriendCode = async () => {
          try {
            const res = await fetch(`${API_URL}/auth/profile`, {
              headers: {
                Authorization: `Bearer ${parsedProfile.token}`,
              },
            });
            
            if (res.ok) {
              const data = await res.json();
              const updatedProfile = {
                ...parsedProfile,
                friendCode: data.friendCode,
              };
              setProfile(updatedProfile);
              localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedProfile));
            }
          } catch (error) {
            console.error('Failed to fetch friend code:', error);
          }
        };
        fetchFriendCode();
      }
    }

    // 3. Mock streak removed, using prop
  }, []);

  /* ---------------------------
     PUSH NOTIFICATION HANDLERS
  ---------------------------- */
  const checkNotificationStatus = async () => {
    try {
      const isSubscribed = await isSubscribedToPushNotifications();
      setNotificationsEnabled(isSubscribed);
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    console.log('🔍 Profile object:', profile);
    console.log('🔍 Profile._id:', profile?._id);
    console.log('🔍 Profile.id:', (profile as any)?.id);
    
    // Try both _id and id fields
    const userId = profile?._id || (profile as any)?.id;
    
    if (!userId) {
      console.error('❌ No user ID found in profile:', profile);
      toast.error("User session not found");
      return;
    }

    console.log('✅ Using user ID:', userId);

    try {
      if (enabled) {
        // Subscribe to push notifications
        const success = await subscribeToPushNotifications(userId);
        if (success) {
          setNotificationsEnabled(true);
          toast.success("Push notifications enabled! 🔔", {
            description: "You'll receive motivational reminders at 8 AM and 8 PM"
          });
        } else {
          setNotificationsEnabled(false);
          toast.error("Failed to enable notifications", {
            description: "Please check your browser permissions"
          });
        }
      } else {
        // Unsubscribe from push notifications
        const success = await unsubscribeFromPushNotifications(userId);
        if (success) {
          setNotificationsEnabled(false);
          toast.success("Push notifications disabled");
        } else {
          toast.error("Failed to disable notifications");
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast.error("Something went wrong");
    }
  };

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
        const res = await fetch(`${API_URL}/auth/profile`, {
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

  const handleInviteFriend = () => {
    setShowInviteModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleNativeShare = async () => {
     if (!profile?.friendCode) return;
     
     // New Share Text
     const shareText = `I’m using Atomiq to track daily habits and stay consistent with friends🔥\nOnce you sign up, we’ll be connected automatically. \n`;
     const shareUrl = `https://atomiq.club/invite/${profile.friendCode}`;
     const shareTitle = "Join Atomiq with me";

     const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
     };

     try {
       if (navigator.share) {
         await navigator.share(shareData);
       } else {
         await navigator.clipboard.writeText(shareText);
         toast.success("Copied to Clipboard");
       }
     } catch (err) {
       console.error("Error sharing:", err);
       // Fallback for "AbortError" or other generic share failures
       if ((err as any).name !== 'AbortError') {
          try {
             await navigator.clipboard.writeText(shareText);
             toast.success("Copied to Clipboard");
          } catch (clipboardErr) {
             toast.error("Failed to share or copy");
          }
       }
     }
  };

  const handleWhatsAppShare = () => {
    if (!profile?.friendCode) return;
    const shareText = `I’m using Atomiq to track daily habits and stay consistent with friends 🔥\nJoin me here: https://atomiq.club/invite/${profile.friendCode}\nOnce you sign up, we’ll be connected automatically.`;
    const encodedText = encodeURIComponent(shareText);
    
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  if (!profile) return null;

const handleUseFreeze = async () => {
    if (!profile || !profile.token) return;
    
    try {
        const res = await fetch(`${API_URL}/habits/freeze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${profile.token}`,
            },
        });

        if (res.ok) {
            const data = await res.json();
            toast.success("Streak Frozen! ❄️", {
                description: "Your streak has been recovered."
            });
            // Update session
            if (updateSession) {
                updateSession({
                    streak: data.streak,
                    streakFreezes: data.streakFreezes,
                    streakHistory: data.streakHistory,
                    lastCompletedDate: new Date() // Approximate, or use data.lastCompletedDate
                });
            }
        } else {
            const errData = await res.json();
            toast.error(errData.message || "Failed to use freeze");
        }
    } catch (error) {
        console.error("Error using freeze:", error);
        toast.error("Something went wrong");
    }
  };

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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
             {/* Current Streak */}
            <div className="bg-gradient-to-br from-primary to-orange-400 rounded-2xl p-6 text-center shadow-lg shadow-primary/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Flame size={48} className="text-white" />
                </div>
                <p className="text-xs text-white/90 mb-1 uppercase tracking-wide font-medium">
                    Streak
                </p>
                <p className="text-4xl font-bold mb-1 text-white">{streak}</p>
                <p className="text-xs text-white/90 font-medium opacity-80">Days on fire 🔥</p>
            </div>

            {/* Streak Freezes */}
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-center shadow-lg shadow-blue-400/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-15">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2.5 10a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z"/><path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M21.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/><path d="M12 12v8"/><path d="m6 12 5-3"/><path d="m18 12-5-3"/><path d="m9 21 3-4 3 4"/></svg>
                </div>
                <p className="text-xs text-white/90 mb-1 uppercase tracking-wide font-medium">
                    Freezes
                </p>
                <p className="text-4xl font-bold mb-1 text-white">{streakFreezes !== undefined ? streakFreezes : 0}</p>
                <p className="text-xs text-white/90 font-medium opacity-80">Available ❄️</p>
            </div>
        </div>
        
        {/* RECOVERY ACTION */}
        {streak === 0 && (streakFreezes || 0) > 0 && (
             <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M19 19.34a2 2 0 0 0 1.25-2.73L13.73 3.3a2 2 0 0 0-3.46 0L3.73 16.61A2 2 0 0 0 5 19.34Z"/></svg>
                         </div>
                         <div>
                             <h4 className="font-bold text-red-500 text-sm">Streak Broken!</h4>
                             <p className="text-xs text-muted-foreground">Use a freeze to recover it.</p>
                         </div>
                     </div>
                     <button 
                         onClick={handleUseFreeze}
                         className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                     >
                         Use Freeze
                     </button>
                 </div>
             </div>
        )}

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
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">Push Notifications</span>
                  <span className="text-xs text-muted-foreground">Daily reminders at 8 AM & 8 PM</span>
                </div>
              </div>
              <Switch.Root
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                className="w-11 h-6 bg-input rounded-full relative data-[state=checked]:bg-primary transition-colors duration-300 cursor-pointer"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-300 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
              </Switch.Root>
            </div>

            <button 
              onClick={handleInviteFriend}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
            >
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
        {/* INVITE FRIEND MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
             <div className="relative w-full max-w-sm bg-card-bg border border-card-border rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
                
                <div className="text-center mb-6">
                   <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <UserPlus size={32} className="text-green-500" />
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-2">Invite a Friend</h3>
                   <p className="text-sm text-muted-foreground">Share your code and the link to grow your squad!</p>
                </div>

                {/* Friend Code */}
                <div className="mb-4">
                   <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Your Friend Code</label>
                   <div 
                      onClick={() => copyToClipboard(profile.friendCode || "")}
                      className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                   >
                      <span className="font-mono text-lg font-bold text-primary tracking-wider">{profile.friendCode || "..."}</span>
                      <Copy size={18} className="text-muted-foreground" />
                   </div>
                </div>

                {/* Website Link */}
                 <div className="mb-6">
                   <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Website</label>
                   <div 
                      onClick={() => copyToClipboard("https://atomiq.club")}
                      className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                   >
                      <span className="text-sm text-foreground truncate">atomiq.club</span>
                      <Copy size={18} className="text-muted-foreground" />
                   </div>
                </div>


                 {/* Share Buttons */}
                 <div className="flex gap-3">
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Share2 size={18} />
                      Share Invite
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center px-5 pt-24 pb-5"
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
