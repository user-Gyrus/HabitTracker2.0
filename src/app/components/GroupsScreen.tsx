import { useState, useEffect } from "react";
import { Plus, Ticket, Users, Calendar, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import api from "../../lib/api";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend";

interface GroupsScreenProps {
  onNavigate: (screen: Screen) => void;
  onSelectGroup: (id: string) => void;
}

export function GroupsScreen({ onNavigate, onSelectGroup }: GroupsScreenProps) {
  const [mySquads, setMySquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Get current user ID from API
      let currentUserId = null;
      try {
        const userRes = await api.get("/auth/me");
        currentUserId = userRes.data._id;
      } catch (err) {
        console.error("Failed to get current user", err);
      }
      
      const res = await api.get("/groups");
      
      const mappedGroups = res.data.map((group: any) => {
        // Calculate pot for staked groups
        const pot = group.groupType === "staked" && group.stakeAmount 
          ? group.stakeAmount * group.members.length 
          : null;
        
        // Calculate user's rank based on streak (members are already sorted by streak from backend)
        let rank = null;
        if (group.groupType !== "staked" && group.members && currentUserId) {
          const userIndex = group.members.findIndex((m: any) => m._id === currentUserId || m._id.toString() === currentUserId);
          if (userIndex !== -1) {
            rank = userIndex + 1; // 1-indexed rank
          }
        }
        
        // Calculate habit progress (X/Y completed today)
        const completedToday = group.completedCount || 0;
        const totalMembers = group.members.length;
        const habitProgress = totalMembers > 0 ? completedToday / totalMembers : 0;
        
        return {
          id: group._id,
          name: group.name,
          description: group.groupCode || "SQUAD", 
          members: group.members.length,
          maxMembers: group.capacity || 10, 
          pot,
          rank,
          habitProgress, // Progress of habit completion today
          completedToday, // How many completed today
          avatars: group.members.slice(0, 3).map((m: any) => m.avatar || m.displayName?.charAt(0).toUpperCase() || "?"),
          extraMembers: Math.max(0, group.members.length - 3),
          isActive: group.isActive,
          progress: group.members.length / (group.capacity || 10),
          groupStreak: group.groupStreak,
          groupType: group.groupType
        };
      });
      setMySquads(mappedGroups);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinGroup = async () => {
      if (!joinCode.trim()) return;
      
      try {
          await api.post('/groups/join', { groupCode: joinCode.trim() });
          toast.success("Successfully joined the squad! 🎉");
          setShowJoinModal(false);
          setJoinCode("");
          // Refresh list
          fetchGroups();
      } catch (err: any) {
          console.error("Failed to join group", err);
          const msg = err.response?.data?.message || "Failed to join squad";
          toast.error(msg);
      }
  };



  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          GROUPS
        </h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-2xl text-[10px] font-bold tracking-wide hover:bg-primary/20 transition-all active:scale-95 shadow-[0_4px_10px_rgba(255,107,0,0.1)]"
          >
            <Ticket size={14} className="fill-primary/20" />
            JOIN CODE
          </button>
          <button 
            onClick={() => onNavigate("create-group")}
            className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-90 shadow-[0_4px_10px_rgba(255,107,0,0.1)]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Your Squads Section */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Your Squads</h2>
        
        <div className="space-y-5">
          {loading ? (
             <div className="text-center py-10 text-muted-foreground text-xs">Loading squads...</div>
          ) : mySquads.length === 0 ? (
             <div className="bg-card-bg/50 border border-card-border rounded-2xl p-6 text-center">
                 <p className="text-muted-foreground text-sm font-medium mb-2">You haven't joined any squads yet.</p>
                 <button className="text-primary text-xs font-bold uppercase tracking-wide">Create or Join One!</button>
             </div>
          ) : (
          mySquads.map((squad) => (
            <motion.div
              key={squad.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="bg-card-bg/80 backdrop-blur-md border border-card-border/50 rounded-[2rem] p-5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(255,107,0,0.08)] hover:border-primary/20 transition-all group"
            >
                {/* Subtle Gradient Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-5">
                        {/* Progress Circle Visual - Group Habit Progress */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                                <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
                                <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-primary" strokeDasharray={144} strokeDashoffset={144 - (144 * (squad.habitProgress || 0))} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-[10px] font-black text-foreground">{squad.completedToday}/{squad.members}</span>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">{squad.name}</h3>
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-90">{squad.description}</p>
                        </div>
                    </div>


                    {/* Badge: Pot for staked groups, Rank for normal groups */}
                    {squad.pot ? (
                         <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
                            <svg className="w-3.5 h-3.5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                                <text x="12" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white">₹</text>
                            </svg>
                            <div className="flex flex-col leading-none">
                                <span className="text-xs text-yellow-700 dark:text-yellow-500 font-extrabold">₹{squad.pot}</span>
                                <span className="text-[8px] text-yellow-700/70 dark:text-yellow-500/70 font-semibold uppercase">Pot</span>
                            </div>
                         </div>
                    ) : squad.rank ? (
                         <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm shadow-lg shadow-orange-500/10">
                            <Trophy size={14} className="text-orange-600 fill-orange-600/20" />
                            <div className="flex flex-col leading-none">
                                <span className="text-xs text-orange-700 dark:text-orange-500 font-extrabold">#{squad.rank}</span>
                                <span className="text-[8px] text-orange-700/70 dark:text-orange-500/70 font-semibold uppercase">Rank</span>
                            </div>
                         </div>
                    ) : null}
                </div>

                <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center -space-x-2 pl-2">
                         {squad.avatars.map((avatar: string, i: number) => (
                             <div key={i} className="w-8 h-8 rounded-full bg-card-bg border-[3px] border-card-bg flex items-center justify-center text-sm shadow-sm ring-1 ring-black/5 z-0 hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                                 {avatar}
                             </div>
                         ))}
                         {squad.extraMembers > 0 && (
                             <div className="w-8 h-8 rounded-full bg-muted border-[3px] border-card-bg flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 z-0">
                                 +{squad.extraMembers}
                             </div>
                         )}
                     </div>

                     <button 
                       onClick={() => onSelectGroup(squad.id)}
                       className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-6 py-2.5 rounded-full transition-all shadow-md shadow-primary/20 active:scale-95"
                     >
                         View
                     </button>
                </div>
            </motion.div>
          )))}
        </div>
      </div>

      {/* Discover New Squads Section - Coming Soon */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Discover New Squads</h2>
        </div>

        <div className="bg-gradient-to-br from-card-bg/80 to-card-bg/40 backdrop-blur-md p-8 rounded-[2rem] border border-card-border/50 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[200px]">
            {/* Decorative Background */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-black text-foreground mb-2 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground max-w-[250px] leading-relaxed">
                    Discover and join public squads with people who share your goals!
                </p>
            </div>
        </div>
      </div>

      {/* JOIN SQUAD MODAL */}
      {showJoinModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
             <div className="relative w-full max-w-sm bg-card-bg border border-card-border rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
                
                <div className="text-center mb-6">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Ticket size={32} className="text-primary" />
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-2">Join a Squad</h3>
                   <p className="text-sm text-muted-foreground">Enter the squad code shared by your friend.</p>
                </div>

                <div className="mb-6">
                   <input 
                      type="text"
                      placeholder="ENTER CODE (e.g. SQUAD-123)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-center font-mono font-bold text-lg tracking-widest text-foreground focus:outline-none focus:border-primary/50 transition-colors uppercase placeholder:text-muted-foreground/50"
                      autoFocus
                   />
                </div>

                <button
                  onClick={handleJoinGroup}
                  disabled={!joinCode.trim()}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  Join Squad
                </button>
             </div>
          </div>
      )}

    </div>
  );
}
