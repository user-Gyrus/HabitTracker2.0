import { useState, useEffect } from "react";
import { Plus, Ticket, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import api from "../../lib/api";
import { SquadsListSkeleton } from "./LoadingSkeletons";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend" | "privacy-policy";

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
        // DEBUG LOGGING
        if (group.groupType === 'staked') {
            console.log(`[GroupsScreen] Staked Group: ${group.name}`, group.members);
            group.members.forEach((m: any, i: number) => {
                console.log(`Member ${i} (${m.displayName}): Streak=${m.streak}, LinkedHabit=${!!m.linkedHabit}`);
            });
        }
        
        // Calculate pot for staked groups (Dynamic: Total Pot / Survivors)
        // Check if current user has linked a habit to this squad (moved up to be used in pot logic)
        const currentUserMember = currentUserId ? group.members.find((m: any) => m._id === currentUserId || m._id.toString() === currentUserId) : null;
        const hasLinkedHabit = currentUserMember ? !!currentUserMember.linkedHabit : false;

        // Calculate pot for staked groups (Dynamic: Total Pot / Survivors)
        let pot = null;
        if (group.groupType === "staked" && group.stakeAmount) {
            const totalPot = group.stakeAmount * group.members.length;
            // Survivors = members with streak > 0 AND a linked habit
            // Note: In `getUserGroups` controller, `member.streak` is 0 if no habit is linked anyway.
            // But let's be explicit: 
            // In the mapped object below, we check `hasLinkedHabit` for the CURRENT user, but for OTHERS,
            // we need to know if THEY have a linked habit. 
            // The controller `getUserGroups` populates `member.streak` as 0 if no habit. 
            // So `m.streak > 0` should implicitly cover "has linked habit" because 0 streak = dropout.
            // However, the user specifically asked for "not linked habit as well". 
            // If they just joined, streak might be 0 but they haven't linked yet.
            // Let's rely on the controller logic: "No linked habit = 0 streak".
            // So filtering by `m.streak > 0` is safe and correct.
            // Wait, user says they are seeing > 0 share even though they haven't linked.
            // This means they have a streak > 0 without a linked habit. 
            // We MUST check `linkedHabit` explicitly.
            const survivors = group.members.filter((m: any) => (m.streak || 0) > 0 && !!m.linkedHabit).length;
            
            // Potential share for a survivor
            const share = survivors > 0 ? Math.floor(totalPot / survivors) : 0;
            
            // User share: If user is a survivor, show share. Else show 0.
            // User specifically requested: "if the share received by the user is 0, then show it as 0"
            const isSurvivor = currentUserMember && (currentUserMember.streak > 0) && !!currentUserMember.linkedHabit;
            pot = isSurvivor ? share : 0;
        }
        
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
        
          
          const startDate = group.startDate ? new Date(group.startDate) : new Date(group.createdAt);
          const now = new Date();
          const diffTime = now.getTime() - startDate.getTime();
          // Calculate days elapsed (1-indexed)
          // If started today or future, it should be at least Day 1 or calculated correctly
          const daysRunning = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

          return {
            id: group._id,
            name: group.name,
            description: group.groupCode || "SQUAD", 
            members: group.members.length,
            maxMembers: group.capacity || 10, 
            pot,
            rank,
            habitProgress, // Keep for potential use, but UI now uses duration
            completedToday, 
            avatars: group.members.slice(0, 3).map((m: any) => ({
                label: m.avatar || m.displayName?.charAt(0).toUpperCase() || "?",
                streak: m.streak || 0,
                id: m._id,
                hasLinkedHabit: !!m.linkedHabit
            })),
            extraMembers: Math.max(0, group.members.length - 3),
            isActive: group.isActive,
            progress: group.members.length / (group.capacity || 10),
            groupStreak: group.groupStreak,
            groupType: group.groupType,
            hasLinkedHabit,
            duration: group.duration,
            daysRunning
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
             <SquadsListSkeleton />
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
              className={`bg-card-bg/80 backdrop-blur-md border rounded-[2rem] p-5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(255,107,0,0.08)] transition-all group ${
                squad.groupType === 'staked' 
                  ? 'border-yellow-500/80 shadow-[0_0_25px_rgba(234,179,8,0.2)]' 
                  : 'border-card-border/50 hover:border-primary/20'
              }`}
            >
                {/* Subtle Gradient Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-5">
                        {/* Progress Circle Visual - Squad Duration Progress */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                                <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
                                <circle 
                                  cx="28" 
                                  cy="28" 
                                  r="23" 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="transparent" 
                                  className="text-primary" 
                                  strokeDasharray={144} 
                                  strokeDashoffset={144 - (144 * (Math.min(squad.daysRunning / squad.duration, 1) || 0))} 
                                  strokeLinecap="round" 
                                />
                            </svg>
                            <div className="absolute text-[8px] font-black text-foreground flex flex-col items-center leading-none">
                                <span>Day</span>
                                <span className="text-[10px]">{squad.daysRunning}/{squad.duration}</span>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">{squad.name}</h3>
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-90">{squad.description}</p>
                            
                            {/* Unlinked Habit Indicator */}
                            {!squad.hasLinkedHabit && (
                                <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 border-dashed rounded-md w-fit">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wide">Link Habit</span>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Badge: Pot for staked groups, Rank for normal groups */}
                    {squad.pot !== null ? (
                         <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
                            <svg className="w-3.5 h-3.5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                                <text x="12" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white">₹</text>
                            </svg>
                            <div className="flex flex-col leading-none">
                                <span className="text-xs text-yellow-700 dark:text-yellow-500 font-extrabold">₹{squad.pot}</span>
                                <span className="text-[8px] text-yellow-700/70 dark:text-yellow-500/70 font-semibold uppercase">Pot Share</span>
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
                         {squad.avatars.map((member: any, i: number) => {
                             // Generate varied gradient colors for each member
                             const gradients = [
                               'from-violet-500 to-fuchsia-600',
                               'from-amber-500 to-orange-600',
                               'from-emerald-500 to-teal-600',
                               'from-rose-500 to-pink-600',
                               'from-blue-500 to-indigo-600',
                               'from-green-500 to-emerald-600',
                               'from-yellow-500 to-amber-600',
                               'from-cyan-500 to-blue-600',
                             ];
                             const gradient = gradients[i % gradients.length];
                             
                             // Check for Dropout (Staked only + (0 streak OR no habit))
                             const isDroppedOut = squad.groupType === 'staked' && ((member.streak || 0) === 0 || !member.hasLinkedHabit);

                             return (
                               <div 
                                 key={i} 
                                 className={`w-9 h-9 rounded-full border-[3px] border-card-bg flex items-center justify-center text-sm font-bold text-white shadow-md active:scale-95 transition-transform cursor-pointer relative z-0 active:z-10
                                    ${isDroppedOut 
                                        ? 'bg-zinc-600 grayscale opacity-70 ring-2 ring-red-500/50' 
                                        : `bg-gradient-to-br ${gradient}`
                                    }
                                 `}
                                 title={isDroppedOut ? "Dropped Out" : "Active Survivor"}
                               >
                                   {member.label}
                                   {isDroppedOut && (
                                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                           <span className="text-[10px]">💀</span>
                                       </div>
                                   )}
                               </div>
                             );
                         })}
                         {squad.extraMembers > 0 && (
                             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-[3px] border-card-bg flex items-center justify-center text-[10px] font-bold text-white shadow-md relative z-0">
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
