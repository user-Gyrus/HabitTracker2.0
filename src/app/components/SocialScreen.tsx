import { useState, useEffect } from "react";
import { UserPlus, MoreVertical, Check, X, Menu, Pencil, Users, User, Search, Calendar, Copy, Trash2, LogOut, Plus, Flame, Share2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Switch from "@radix-ui/react-switch";
import { toast } from "sonner";
import api from "../../lib/api";
import { FriendsListSkeleton, GroupsCarouselSkeleton } from "./LoadingSkeletons";
import { FriendHabitsModal } from "./FriendHabitsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type Screen = "habits" | "create" | "profile" | "social";

// Types needed for habits to calculate progress
interface UIHabit {
  id: string;
  name: string;
  micro_identity: string | null;
  goal: number;
  completed_today: boolean;
}

interface SocialScreenProps {
  onNavigate: (screen: Screen) => void;
  habits?: UIHabit[];
  streak?: number;
}

interface Friend {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  isOnline: boolean;
  friendCode: string;
  completedToday: boolean;
}

interface Group {
  _id: string;
  name: string;
  avatar: string;
  daysToGoal: number;
  description: string;
  members: { 
    _id: string; 
    displayName: string; 
    username: string; 
    streak?: number;
    linkedHabit?: { name: string; completedToday: boolean; } | null;
  }[];
  creator: string;
  groupStreak?: number;
}



export function SocialScreen({ onNavigate, habits = [] }: SocialScreenProps) {
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCode, setFriendCode] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedFriend, setSearchedFriend] = useState<{name: string; friendCode: string; streak: number; id: string} | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showInviteToSquad, setShowInviteToSquad] = useState(false);
  const [showLinkHabitModal, setShowLinkHabitModal] = useState(false); // New state
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null); // State for habit selection
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [squadName, setSquadName] = useState("");
  const [trackingType, setTrackingType] = useState<"shared" | "individual">("shared");
  const [duration, setDuration] = useState(30);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState<{id: string; display_name: string; friendCode?: string; streak?: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(true);
  const [groupsLoading, setGroupsLoading] = useState<boolean>(true);
  const [searchingFriend, setSearchingFriend] = useState<boolean>(false);
  const [selectedFriendForHabits, setSelectedFriendForHabits] = useState<Friend | null>(null);
  const [showFriendHabitsModal, setShowFriendHabitsModal] = useState(false);

  // Confirmation Dialog State
  const [confirmation, setConfirmation] = useState<{
      open: boolean;
      title: string;
      description: string;
      actionLabel: string;
      variant?: "default" | "destructive";
      onConfirm: () => Promise<void> | void;
  }>({
      open: false,
      title: "",
      description: "",
      actionLabel: "Continue",
      variant: "default",
      onConfirm: () => {},
  });

  // Fetch Friends
  useEffect(() => {
    const fetchFriends = async () => {
        try {
            setFriendsLoading(true);
            const res = await api.get("/friends");
            const mappedFriends = res.data.map((f: any) => {
                // FIX: Use local date parts to avoid UTC shift problems for "Today"
                // This aligns with user's local timezone
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const today = `${year}-${month}-${day}`;
                
                // Use Authoritative IST Date from backend if available
                let isCompletedToday = false;
                
                if (f.lastCompletedDateIST) {
                     isCompletedToday = f.lastCompletedDateIST === today;
                } else if (f.lastCompletedDate) {
                     // Fallback for migration/legacy
                     const d = new Date(f.lastCompletedDate);
                     const dYear = d.getFullYear();
                     const dMonth = String(d.getMonth() + 1).padStart(2, '0');
                     const dDay = String(d.getDate()).padStart(2, '0');
                     const lastDate = `${dYear}-${dMonth}-${dDay}`;
                     isCompletedToday = lastDate === today;
                }
                
                return {
                    id: f._id,
                    name: f.displayName,
                    emoji: "😎", 
                    streak: f.streak || 0,
                    isOnline: false, // Could implement real online status later
                    friendCode: f.friendCode,
                    completedToday: isCompletedToday
                };
            });
            setFriends(mappedFriends);
        } catch (err) {
            console.error("Failed to fetch friends", err);
        } finally {
            setFriendsLoading(false);
        }
    };

    // Initial fetch
    fetchFriends();

    // Poll every 10 seconds for real-time updates
    const intervalId = setInterval(fetchFriends, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const copyFriendCode = () => {
    if (userProfile?.friendCode) {
      navigator.clipboard.writeText(userProfile.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    try {
      await api.post("/friends/remove", { friendId: friendToRemove.id });
      setFriends(friends.filter(f => f.id !== friendToRemove.id));
      setFriendToRemove(null);
      toast.success("Friend removed");
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to remove friend");
    }
  };

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
        const storedSession = localStorage.getItem("habit-tracker-session");
        if (storedSession) {
          const profile = JSON.parse(storedSession);
          setUserProfile(profile);

          // Verify we have fresh data (specifically friendCode)
          if (!profile.friendCode) {
             try {
                 const res = await api.get('/auth/me'); 
                 const newProfile = { ...profile, ...res.data };
                 
                 // Ensure camelCase friendCode
                 if (!newProfile.friendCode && newProfile.friend_code) {
                     newProfile.friendCode = newProfile.friend_code;
                 }

                 setUserProfile(newProfile);
                 localStorage.setItem("habit-tracker-session", JSON.stringify(newProfile));
             } catch (err) {
                 console.error("Failed to refresh profile in SocialScreen", err);
             }
          }
        }
    };
    loadProfile();
  }, []);
  const [groups, setGroups] = useState<Group[]>([]);

  // Fetch Groups (Updated to include memberHabits handling if needed, but backend handles population)
  useEffect(() => {
    const fetchGroups = async () => {
        try {
            setGroupsLoading(true);
            const res = await api.get("/groups");
            setGroups(res.data);
            // Update selected group if open
            if (selectedGroup) {
                const updated = res.data.find((g: Group) => g._id === selectedGroup._id);
                if (updated) setSelectedGroup(updated);
            }
        } catch (err) {
            console.error("Failed to fetch groups", err);
        } finally {
            setGroupsLoading(false);
        }
    };
    fetchGroups();
  }, [showCreateSquad, showLinkHabitModal]); // Refresh when modal closes (after link)



  // Filter friends who completed all habits today
  const dailyGoalFriends = friends.filter(f => f.completedToday);

  // Dummy data removed
  // const dailyGoalFriends = [
  //   { id: "1", avatar: "👨‍💼" },
  //   { id: "2", avatar: "👩‍💻" },
  //   { id: "3", avatar: "👨‍🎨" },
  // ];

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        if (prev.length >= 10) {
            toast.error("Squads can have a maximum of 10 members.");
            return prev;
        }
        return [...prev, friendId];
      }
    });
  };

  const selectAllFriends = () => {
    if (selectedFriends.length === friends.length) {
      setSelectedFriends([]);
    } else {
        if (friends.length > 10) {
            toast.info("Selecting first 10 friends. Squad limit is 10.");
            setSelectedFriends(friends.slice(0, 10).map(f => f.id));
        } else {
            setSelectedFriends(friends.map((f) => f.id));
        }
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine if current user has a linked habit in the selected group
  // Determine if current user has a linked habit in the selected group
  // const currentUserHasLinkedHabit = selectedGroup?.members.find(
  //     m => m.username === userProfile?.friendCode // Assuming friendCode is unique username or similar id check
  //        || m._id === userProfile?.id // Better check
  // )?.linkedHabit;

  // Find the actual member object for current user to be safe
  const currentUserMember = selectedGroup?.members.find(m => m._id === userProfile?.id);
  const isLinked = !!currentUserMember?.linkedHabit;

  const handleNativeShare = async () => {
    if (!userProfile?.friendCode) return;
    
    // Exact text as requested
    const shareText = `I’m trying this habit app called Atomiq.
It turns daily habits into streaks and lets friends track together🔥 \n Use my code ${userProfile.friendCode} to add me as your friend!`;
    const shareUrl = "https://atomiq.club";
    const shareTitle = "Join Atomiq with me";

    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${shareUrl}`);
        toast.success("Copied to Clipboard");
      }
    } catch (err) {
      console.error("Error sharing:", err);
       // Fallback for "AbortError" or other generic share failures if share was attempted but failed/cancelled
       // Logic: If user cancelled, do nothing. If not supported (caught earlier usually), copy.
       // For simple fallback if share throws (e.g. permission denied or internal error), we can try copy.
       // But usually AbortError means user hit cancel.
       if ((err as any).name !== 'AbortError') {
          try {
             await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${shareUrl}`);
             toast.success("Copied to Clipboard");
          } catch (clipboardErr) {
             toast.error("Failed to share or copy");
          }
       }
    }
  };

  const handleWhatsAppShare = () => {
    if (!userProfile?.friendCode) return;
    const shareText = `I’m trying this habit app called Atomiq.
It turns daily habits into streaks and lets friends track together🔥 \n Use my code ${userProfile.friendCode} to add me as your friend!`;
    const shareUrl = "https://atomiq.club";
    // Construct text with newlines if needed, usually WhatsApp web handles space/newline encoding 
    const fullText = `${shareText} ${shareUrl}`;
    const encodedText = encodeURIComponent(fullText);
    
    // Using window.open for universal link
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <>
      <div className="min-h-screen px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Social</h1>
          <button
            onClick={() => setShowAddFriend(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-full transition-colors text-primary-foreground"
          >
            <UserPlus size={18} />
            <span className="text-sm font-semibold">Add Friend</span>
          </button>
        </div>



        {/* Daily Goal */}
        {/* Daily Goal (Redesigned) */}
        <div 
          onClick={() => setShowDailyGoalModal(true)}
          className="bg-card-bg rounded-3xl p-3 px-5 mb-8 border border-card-border shadow-sm cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Flame className="text-primary fill-primary" size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm sm:text-base text-foreground tracking-wide uppercase leading-tight">
                        {dailyGoalFriends.length} friends completed today
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                        Tap to see who all crushed it!
                    </span>
                </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
        </div>



        {/* Your Friends */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-foreground">Your friends</h2>
          <div className="space-y-3">
            {friendsLoading ? (
              <FriendsListSkeleton />
            ) : friends.length === 0 ? (
              <div className="bg-card-bg rounded-2xl p-8 border border-card-border text-center flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="text-primary" size={32} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">No friends yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-[200px]">
                  Everything is better together. Add your first friend to start competing!
                </p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Add a Friend
                </button>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-card-bg rounded-2xl p-4 flex items-center justify-between border border-card-border hover:border-primary/30 transition-colors shadow-sm cursor-pointer active:scale-[0.98]"
                  onClick={() => {
                    setSelectedFriendForHabits(friend);
                    setShowFriendHabitsModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-2 border-background">
                        <span className="text-lg">🧑</span>
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold flex items-center gap-1.5 text-foreground">
                        {friend.name} <span>{friend.emoji}</span>
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mb-0.5">{friend.friendCode}</p>
                      <p className="text-sm text-primary flex items-center gap-1">
                        {friend.streak} Day Streak <span>🔥</span>
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === friend.id ? null : friend.id);
                      }}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} className="text-muted-foreground" />
                    </button>
                    {activeMenuId === friend.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-secondary border border-border rounded-xl shadow-2xl z-20 overflow-hidden ring-1 ring-black/5">
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setFriendToRemove(friend);
                                  setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-3 text-red-500 hover:bg-card-bg/50 text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                              <X size={16} />
                              Remove Friend
                          </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Squad Modal */}
      <AnimatePresence>
        {showCreateSquad && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] z-[60] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="max-w-md mx-auto min-h-screen px-5 pt-6 pb-32">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowCreateSquad(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X size={24} className="text-foreground" />
                </button>
                <h1 className="text-xl font-semibold text-foreground">Create Squad</h1>
                <div className="w-10" />
              </div>

              {/* Squad Name */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  Squad Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="e.g., The 5AM Club"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <Pencil size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary" />
                </div>
              </div>

              {/* How will you track? */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  How will you track?
                </label>
                <div className="space-y-3">
                  <div
                    onClick={() => setTrackingType("shared")}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      trackingType === "shared"
                        ? "bg-primary/10 border-primary"
                        : "bg-card-bg border-card-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trackingType === "shared" ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <Users size={20} className={trackingType === "shared" ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Shared Habit</p>
                        <p className="text-xs text-muted-foreground">Everyone tracks the same goal</p>
                      </div>
                    </div>
                    <Switch.Root
                      checked={trackingType === "shared"}
                      onCheckedChange={(checked) => setTrackingType(checked ? "shared" : "individual")}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        trackingType === "shared" ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Switch.Thumb className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                        trackingType === "shared" ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </Switch.Root>
                  </div>

                  <div
                    onClick={() => setTrackingType("individual")}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      trackingType === "individual"
                        ? "bg-blue-500/10 border-blue-500"
                        : "bg-card-bg border-card-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trackingType === "individual" ? "bg-blue-500/20" : "bg-muted"
                      }`}>
                        <User size={20} className={trackingType === "individual" ? "text-blue-500" : "text-muted-foreground"} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Individual Habits</p>
                        <p className="text-xs text-muted-foreground">Guide supports each member's unique...</p>
                      </div>
                    </div>
                    <Switch.Root
                      checked={trackingType === "individual"}
                      onCheckedChange={(checked) => setTrackingType(checked ? "individual" : "shared")}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        trackingType === "individual" ? "bg-blue-500" : "bg-muted"
                      }`}
                    >
                      <Switch.Thumb className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                        trackingType === "individual" ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </Switch.Root>
                  </div>
                </div>
              </div>

              {/* How many days? */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  How many days?
                </label>
                <div className="bg-card-bg border border-card-border rounded-xl p-4">
                  <div className="relative mb-3">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-transparent text-foreground text-2xl font-bold focus:outline-none"
                    />
                    <Calendar size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2">
                    {[21, 48, 66].map((days) => (
                      <button
                        key={days}
                        onClick={() => setDuration(days)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          duration === days
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Who's in? */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground uppercase tracking-wide">
                    Who's in?
                  </label>
                  <button
                    onClick={selectAllFriends}
                    className="text-sm text-primary font-semibold"
                  >
                    Select All
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Friends List */}
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {filteredFriends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-card-bg border border-card-border rounded-xl hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-2 border-background">
                            <span className="text-lg">{friend.emoji}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{friend.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-primary"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={16} className="text-white" strokeWidth={3} />
                          ) : (
                            <span className="text-muted-foreground text-xl leading-none">+</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create Squad Button */}
              <button
                onClick={async () => {
                  if (squadName.trim()) {
                    try {
                        await api.post("/groups/create", {
                            name: squadName,
                            members: selectedFriends,
                            trackingType,
                            duration,
                            description: `${trackingType === "shared" ? "Shared" : "Individual"} habit tracking. ${duration} day challenge!`,
                            avatar: "🚀"
                        });
                        toast.success("Squad created successfully!");
                        
                        // Reset form and close modal
                        setSquadName("");
                        setTrackingType("shared");
                        setDuration(30);
                        setSelectedFriends([]);
                        setSearchQuery("");
                        setShowCreateSquad(false);
                     } catch (err: any) {
                         toast.error(err.response?.data?.message || "Failed to create squad");
                     }
                   }
                 }}
                 disabled={!squadName.trim()}
                 className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-full py-4 flex items-center justify-center gap-2 transition-colors font-semibold"
               >
                 Create Squad 🚀
               </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Group Details Modal */}
       {showGroupDetails && selectedGroup && (
         <div 
           className="fixed inset-0 z-[60] flex items-center justify-center px-5"
           onClick={() => setShowGroupDetails(false)}
         >
           {/* Backdrop with blur */}
           <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />
           
           {/* Modal Content */}
           <div 
             className="relative w-full max-w-md bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] rounded-3xl shadow-2xl max-h-[75vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Header */}
             <div className="flex items-center justify-between px-5 py-6 border-b border-card-border">
               <button
                 onClick={() => setShowGroupDetails(false)}
                 className="p-2 hover:bg-accent rounded-lg transition-colors"
               >
                 <X size={20} className="text-foreground" />
               </button>
               <h1 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Squad details</h1>
               <button 
                 onClick={() => setShowGroupMenu(true)}
                 className="p-2 hover:bg-accent rounded-lg transition-colors"
               >
                 <Menu size={20} className="text-foreground" />
               </button>
             </div>
 
             <div className="px-5 py-6">
               {/* Group Header */}
               <div className="flex flex-col items-center mb-6">
                 {/* ... (Avatar unchanged) */}
                 <div className="relative mb-4">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-4 border-background">
                     <span className="text-4xl">{selectedGroup.avatar}</span>
                   </div>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-white border-2 border-background">
                     <Check size={12} strokeWidth={3} />
                     <span>
                        {selectedGroup.members?.filter(m => m.linkedHabit?.completedToday).length || 0}
                        /
                        {selectedGroup.members?.length || 0}
                     </span>
                   </div>
                 </div>
                 <h2 className="text-2xl font-bold mb-1 text-foreground">{selectedGroup.name}</h2>
                 <p className="text-sm text-muted-foreground">Consistency is key 🔥</p>
               </div>
 
               {/* Stats */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-card-bg rounded-xl p-4 text-center border border-card-border shadow-sm">
                   <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Streak</p>
                    <p className="text-2xl font-bold text-primary">{selectedGroup.groupStreak || 0} Days</p>
                 </div>
                 <div className="bg-card-bg rounded-xl p-4 text-center border border-card-border shadow-sm">
                   <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Members</p>
                   <p className="text-2xl font-bold text-foreground">{selectedGroup.members?.length || 0} / 10</p>
                 </div>
               </div>

               {/* Add Habit Button (Conditional) */}
               {!isLinked && (
                  <button
                    onClick={() => {
                        setShowLinkHabitModal(true);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 font-semibold mb-6 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-900/20"
                  >
                    <div className="bg-white/20 p-1 rounded-full"><Pencil size={14} /></div>
                    Add a habit
                  </button>
               )}
 
               {/* Squad Members */}
               <div>
                 <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Squad Members</h3>
                 <div className="space-y-2">
                   {/* Members Loop */}
                    {selectedGroup.members && selectedGroup.members.map((member) => (
                        <div key={member._id} className="bg-card-bg rounded-xl p-3 flex items-center justify-between border border-card-border">
                            <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-lg font-bold text-muted-foreground uppercase">
                                {member.displayName.charAt(0)}
                                </div>
                                {/* Mock online status */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground">{member.displayName} {userProfile?.id === member._id ? "(You)" : ""}</p>
                                {member.linkedHabit ? (
                                    <p className="text-xs text-muted-foreground">{member.linkedHabit.name}</p>
                                ) : (
                                    userProfile?.id === member._id ? (
                                        <button onClick={() => setShowLinkHabitModal(true)} className="text-xs text-primary font-semibold hover:underline text-left">
                                            Add a habit to start tracking!
                                        </button>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No habit linked</p>
                                    )
                                )}
                            </div>
                            </div>
                            
                            {member.linkedHabit ? (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${member.linkedHabit.completedToday ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                                    {member.linkedHabit.completedToday && <Check size={14} className="text-black" strokeWidth={3} />}
                                </div>
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                            )}
                        </div>
                    ))}
                 </div>
               </div>
             </div>
 
             {/* Group Menu Overlay */}
            {showGroupMenu && selectedGroup && (
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-start justify-center pt-20 z-10"
                onClick={() => setShowGroupMenu(false)}
              >
                <div 
                  className="bg-card-bg rounded-2xl w-[90%] border border-card-border overflow-hidden shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => {
                        setShowGroupMenu(false);
                        setShowLinkHabitModal(true);
                    }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors border-b border-card-border"
                  >
                    <Pencil size={18} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">Change your habit</span>
                  </button>
                  <button 
                    onClick={() => setShowInviteToSquad(true)} 
                    className="w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors border-b border-card-border"
                  >
                    <UserPlus size={18} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">Invite More Friends</span>
                  </button>
                  {selectedGroup.creator === userProfile?.id ? (
                      <button 
                        onClick={() => {
                             if (!selectedGroup) return;
                             setConfirmation({
                                 open: true,
                                 title: "Delete Squad",
                                 description: "Are you sure you want to delete this squad? This action cannot be undone.",
                                 actionLabel: "Delete Squad",
                                 variant: "destructive",
                                 onConfirm: async () => {
                                    const groupId = selectedGroup._id;
                                    try {
                                        await api.delete(`/groups/${groupId}`);
                                        toast.success("Squad deleted successfully");
                                        
                                        // Close UI first to prevent render crashes on null selectedGroup
                                        setShowGroupMenu(false);
                                        setShowGroupDetails(false);
                                        setSelectedGroup(null);

                                        setGroups(prev => prev.filter(g => g._id !== groupId));
                                    } catch (err: any) {
                                        console.error("Delete squad error:", err);
                                        toast.error(err.response?.data?.message || "Failed to delete squad");
                                    }
                                 }
                             });
                        }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors text-red-500"
                      >
                        <Trash2 size={18} />
                        <span className="text-sm">Delete Squad</span>
                      </button>
                  ) : (
                      <button 
                         onClick={() => {
                             if (!selectedGroup) return;
                             setConfirmation({
                                 open: true,
                                 title: "Leave Squad",
                                 description: "Are you sure you want to leave this squad? You will lose unshared progress in this group.",
                                 actionLabel: "Leave Squad",
                                 variant: "destructive",
                                 onConfirm: async () => {
                                    const groupId = selectedGroup._id;
                                    try {
                                        await api.post("/groups/leave", { groupId: groupId });
                                        toast.success("Left squad successfully");
                                        
                                        // Close UI first to prevent render crashes on null selectedGroup
                                        setShowGroupMenu(false);
                                        setShowGroupDetails(false);
                                        setSelectedGroup(null);

                                        setGroups(prev => prev.filter(g => g._id !== groupId));
                                    } catch (err: any) {
                                        console.error("Leave squad error:", err);
                                        toast.error(err.response?.data?.message || "Failed to leave squad");
                                    }
                                 }
                             });
                         }}
                         className="w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors text-red-500"
                      >
                        <LogOut size={18} />
                        <span className="text-sm">Leave Squad</span>
                      </button>
                  )}
                </div>
              </div>
            )}
           </div>
         </div>
       )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          onClick={() => {
            setShowAddFriend(false);
            setFriendCode("");
            setSearchedFriend(null);
          }}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-md bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] rounded-3xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-foreground">Add Friend</h1>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setFriendCode("");
                  setSearchedFriend(null);
                  setSearchError(null);
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            {/* Your Friend Code */}
            <div className="mb-6 bg-card-bg rounded-xl p-4 border border-card-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Friend Code</p>
                <p className="font-mono font-bold text-lg tracking-wider text-foreground">{userProfile?.friendCode || "HABIT-XXXXXX"}</p>
              </div>
              <button onClick={copyFriendCode} className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-primary" />}
                {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">Copied!</span>}
              </button>
            </div>

            {/* Share Buttons */}
             <div className="flex gap-3 mb-6">
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

            {/* Friend Code Input */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">Enter Friend Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => {
                    setFriendCode(e.target.value.toUpperCase());
                    setSearchedFriend(null);
                    setSearchError(null);
                  }}
                  placeholder="HABIT-XXXXXX"
                  className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
                <button
                  onClick={async () => {
                    if (friendCode.trim()) {
                      setSearchError(null);
                      setSearchingFriend(true);
                      try {
                        const res = await api.get(`/friends/search?code=${encodeURIComponent(friendCode)}`);
                        setSearchedFriend({
                              name: res.data.displayName,
                              friendCode: res.data.friendCode,
                              streak: res.data.streak || 0,
                              id: res.data._id
                        });
                      } catch (err: any) {
                        setSearchError("No user found with this friend code");
                        setSearchedFriend(null);
                      } finally {
                        setSearchingFriend(false);
                      }
                    }
                  }}
                  disabled={!friendCode.trim() || searchingFriend}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-6 py-3 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed text-primary-foreground"
                >
                  {searchingFriend ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Search Result */}
            {searchedFriend && (
              <div className="bg-card-bg rounded-2xl p-4 border border-card-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-bold border-2 border-background">
                      {searchedFriend.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-foreground">{searchedFriend.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{searchedFriend.friendCode}</p>
                      <p className="text-xs text-primary mt-1">{searchedFriend.streak} Day Streak 🔥</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                      if (!searchedFriend) return;
                      try {
                          // Use response from add friend endpoint (which I updated previously to return the friend)
                          // WAIT: default api.post("/friends/add") does NOT return friend in my *current* understanding of friendController?
                          // Let me check my friendController edit in Step 276.
                          // Yes, it returns { message, friend: { ... } }
                          
                          const res = await api.post("/friends/add", { friendId: searchedFriend.id });
                          toast.success("Friend added!");
                          
                          if (res.data.friend) {
                                const newFriendData = res.data.friend;
                                const today = new Date().toISOString().slice(0, 10);
                                const lastDate = newFriendData.lastCompletedDate ? new Date(newFriendData.lastCompletedDate).toISOString().slice(0, 10) : "";

                                 const newFriend: Friend = {
                                    id: newFriendData._id,
                                    name: newFriendData.displayName,
                                    emoji: "😎",
                                    streak: newFriendData.streak || 0,
                                    isOnline: false,
                                    friendCode: newFriendData.friendCode,
                                    completedToday: lastDate === today
                                 };
                                 
                                 setFriends(prev => [...prev, newFriend]);
                          } else {
                              // Fallback if backend didn't return friend (shouldn't happen with updated controller)
                               // Refresh friends list
                               const resList = await api.get("/friends");
                               setFriends(resList.data.map((f:any) => ({
                                   id: f._id, name: f.displayName, emoji: "😎", streak: f.streak || 0, isOnline: false, friendCode: f.friendCode, completedToday: false // simplistic fallback
                               })));
                          }
                          
                          setShowAddFriend(false);
                          setFriendCode("");
                          setSearchedFriend(null);
                          setSearchError(null);

                      } catch (err: any) {
                          toast.error(err.response?.data?.message || "Failed to add friend");
                      }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 font-semibold mt-4 flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus size={18} />
                  Add Friend
                </button>
              </div>
            )}

            {/* No Result */}
            {searchError && (
              <div className="bg-card-bg rounded-2xl p-6 text-center border border-card-border">
                <p className="text-sm text-muted-foreground">{searchError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Friends to Squad Modal */}
      <AnimatePresence>
        {showInviteToSquad && selectedGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] z-[60] overflow-y-auto"
          >
            <div className="max-w-md mx-auto min-h-screen px-5 pt-6 pb-32">
                
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                      setShowInviteToSquad(false);
                      setSelectedFriends([]);
                  }}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X size={24} className="text-foreground" />
                </button>
                <h1 className="text-xl font-semibold text-foreground">Invite to {selectedGroup.name}</h1>
                <div className="w-10" />
              </div>


               {/* Friends Selection Logic (Reused) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground uppercase tracking-wide">
                    Select Friends
                  </label>
                   {/* Reuse select all logic if needed, but simplified for single invites might be better or reusing existing logic */}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Friends List */}
                <div className="space-y-2">
                  {filteredFriends
                    .filter(f => !selectedGroup.members.some(m => m._id === f.id)) // Filter out already members
                    .map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-card-bg border border-card-border rounded-xl hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-2 border-background">
                            <span className="text-lg">{friend.emoji}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{friend.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-primary"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={16} className="text-white" strokeWidth={3} />
                          ) : (
                            <span className="text-muted-foreground text-xl leading-none">+</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                  {filteredFriends.filter(f => !selectedGroup.members.some(m => m._id === f.id)).length === 0 && (
                      <p className="text-center text-muted-foreground mt-8">No friends available to invite.</p>
                  )}
                </div>
              </div>

               {/* Invite Button */}
               <div className="fixed bottom-8 left-0 right-0 px-5">
                   <button
                     onClick={async () => {
                        if (selectedFriends.length > 0) {
                            try {
                                // Add members one by one or bulk? Backend handles one at a time currently.
                                // Let's loop for now or update backend to handle array. Backend only handles one based on my spec.
                                // Actually let's assume I implemented bulk or just do loop.
                                // The backend implementation: const { groupId, memberId } = req.body; -> Single member.
                                // I will loop here for now.
                                for (const friendId of selectedFriends) {
                                     await api.post("/groups/add-member", {
                                         groupId: selectedGroup._id,
                                         memberId: friendId
                                     });
                                }
                                toast.success("Friends invited successfully!");
                                // Refresh groups to show new members
                                const res = await api.get("/groups");
                                setGroups(res.data);
                                // Update selectedGroup as well
                                const updatedGroup = res.data.find((g: any) => g._id === selectedGroup._id);
                                if (updatedGroup) setSelectedGroup(updatedGroup);

                                setShowInviteToSquad(false);
                                setSelectedFriends([]);
                            } catch (err: any) {
                                toast.error(err.response?.data?.message || "Failed to invite friends");
                            }
                        }
                     }}
                     disabled={selectedFriends.length === 0}
                     className="w-full max-w-md mx-auto bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-full py-4 flex items-center justify-center gap-2 transition-colors font-semibold shadow-lg"
                   >
                     Invite {selectedFriends.length} Friend{selectedFriends.length !== 1 ? 's' : ''}
                   </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    
          {/* Remove Friend Confirmation Modal */}
          <AnimatePresence>
            {friendToRemove && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setFriendToRemove(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card-bg rounded-3xl p-6 w-full max-w-sm border border-card-border shadow-2xl relative z-10 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={32} className="text-red-500 rotate-45" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Remove {friendToRemove.name}?</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        Are you sure you want to remove this friend? This action cannot be undone and you will lose your shared streaks.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setFriendToRemove(null)}
                            className="flex-1 py-3 rounded-xl font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRemoveFriend}
                            className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Link Habit Modal */}
          <AnimatePresence>
            {showLinkHabitModal && selectedGroup && (
                <div 
                  className="fixed inset-0 z-[70] flex items-center justify-center px-5"
                  onClick={() => setShowLinkHabitModal(false)}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md bg-card-bg rounded-3xl p-6 border border-card-border shadow-2xl overflow-hidden"
                  >
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-foreground">Select a Habit</h2>
                        <button onClick={() => setShowLinkHabitModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                            <X size={20} className="text-muted-foreground" />
                        </button>
                     </div>

                     {habits.length === 0 ? (
                         <div className="text-center py-8">
                             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Plus size={32} className="text-primary" />
                             </div>
                             <h3 className="text-lg font-semibold mb-2 text-foreground">No habits yet</h3>
                             <p className="text-muted-foreground text-sm mb-6">Create a habit first to link it to this squad.</p>
                             <button
                                onClick={() => {
                                    setShowLinkHabitModal(false);
                                    setShowGroupDetails(false); // Close squad details to go to create habit
                                    onNavigate("create");
                                }}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-semibold transition-colors"
                             >
                                Create Habit
                             </button>
                         </div>
                     ) : (
                         <div className="flex flex-col">
                             <div className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-hide mb-4">
                                 {habits.map((habit) => (
                                     <button
                                        key={habit.id}
                                        onClick={() => setSelectedHabitId(habit.id)}
                                        className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between group 
                                            ${selectedHabitId === habit.id 
                                                ? "bg-secondary border-primary" 
                                                : "bg-card-bg border-card-border hover:border-primary hover:bg-secondary"}`}
                                      >
                                         <div>
                                             <p className="font-semibold text-foreground">{habit.name}</p>
                                             <p className="text-xs text-muted-foreground">{habit.goal} days goal</p>
                                         </div>
                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                                             ${selectedHabitId === habit.id 
                                                 ? "border-primary bg-primary" 
                                                 : "border-muted-foreground group-hover:border-primary"}`}>
                                              {selectedHabitId === habit.id && <Check size={14} className="text-white" strokeWidth={3} />}
                                         </div>
                                      </button>
                                 ))}
                             </div>
                             
                             <div className="space-y-3">
                                <button
                                    disabled={!selectedHabitId}
                                    onClick={async () => {
                                        if (!selectedHabitId) return;
                                        try {
                                            await api.post("/groups/link-habit", {
                                                groupId: selectedGroup._id,
                                                habitId: selectedHabitId
                                            });
                                            toast.success("Habit linked successfully!");
                                            setShowLinkHabitModal(false);
                                            setSelectedHabitId(null);
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || "Failed to link habit");
                                        }
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-orange-900/20"
                                >
                                    Link Selected Habit
                                </button>

                                <button
                                    onClick={() => {
                                        setShowLinkHabitModal(false);
                                        setShowGroupDetails(false);
                                        onNavigate("create");
                                    }}
                                    className="w-full bg-secondary hover:bg-secondary/80 border border-primary/30 text-primary py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create New Habit
                                </button>
                             </div>
                         </div>
                     )}
                  </motion.div>
                </div>
            )}
          </AnimatePresence>

          {/* Daily Goal Modal */}
          <AnimatePresence>
            {showDailyGoalModal && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 pb-20"
                onClick={() => setShowDailyGoalModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card-bg rounded-3xl p-6 w-full max-w-md max-h-[60vh] overflow-y-auto border border-card-border mx-4 mb-4"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Daily Champions 🔥</h3>
                      <p className="text-sm text-muted-foreground mt-1">{dailyGoalFriends.length} friend{dailyGoalFriends.length !== 1 ? 's' : ''} crushed it today!</p>
                    </div>
                    <button
                      onClick={() => setShowDailyGoalModal(false)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <X size={24} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dailyGoalFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-secondary/50 rounded-xl p-4 border border-card-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xl border-2 border-background">
                            {friend.emoji}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                              <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{friend.name}</p>
                            <p className="text-xs text-muted-foreground">@{friend.friendCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{friend.streak} Day{friend.streak !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-muted-foreground">Streak</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Global Confirmation Dialog */}
          <AlertDialog open={confirmation.open} onOpenChange={(open) => setConfirmation(prev => ({ ...prev, open }))}>
            <AlertDialogContent className="bg-card-bg border border-card-border text-foreground rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">{confirmation.title}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {confirmation.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                    className="bg-secondary text-foreground border-transparent hover:bg-secondary/80 hover:text-foreground rounded-xl"
                    onClick={() => setConfirmation(prev => ({ ...prev, open: false }))}
                >
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                    onClick={async (e) => {
                        // Prevent auto-close if needed, but AlertDialogAction usually closes.
                        // We want to execute logic then close.
                        e.preventDefault(); 
                        await confirmation.onConfirm();
                        setConfirmation(prev => ({ ...prev, open: false }));
                    }}
                    className={`rounded-xl font-semibold ${confirmation.variant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {confirmation.actionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

      {/* Friend Habits Modal */}
      <FriendHabitsModal
        friend={selectedFriendForHabits}
        isOpen={showFriendHabitsModal}
        onClose={() => {
          setShowFriendHabitsModal(false);
          setSelectedFriendForHabits(null);
        }}
      />
    </>
  );
}
