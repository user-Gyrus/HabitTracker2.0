import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, User, Trophy, Flame, Play, Clock, ChevronRight, UserPlus, LogOut } from "lucide-react";
import { motion } from "motion/react";
import api from "../../lib/api";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend";

interface GroupDetailsScreenProps {
  onNavigate: (screen: Screen) => void;
  groupId: string;
}

export function GroupDetailsScreen({ onNavigate, groupId }: GroupDetailsScreenProps) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
        try {
            // For now, we reuse the list endpoint or simpler ID fetch if available. 
            // Since we need detailed member info, let's assume we can fetch via /api/groups or a specific one.
            // I'll assume we need to add a specific get endpoint or filter clientside for now if strict.
            // Let's TRY to fetch specifically. If not, I'll implement the backend endpoint next.
            const res = await api.get(`/groups/${groupId}`);
            setGroup(res.data);
        } catch (error) {
            console.error("Failed to fetch group details", error);
        } finally {
            setLoading(false);
        }
    };
    fetchGroupDetails();
  }, [groupId]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-xs">Loading squad details...</div>;
  }

  if (!group) {
      return (
          <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-4">Squad not found.</p>
              <button onClick={() => onNavigate("groups")} className="text-primary text-xs font-bold">Go Back</button>
          </div>
      );
  }

  // Calculate Progress (Mocking logic based on dates if real tracking not fully populated)
  // Logic: Days elapsed since startDate / Total Duration
  const startDate = new Date(group.startDate || group.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const progress = Math.min(diffDays, group.duration); // Cap at duration

  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => onNavigate("groups")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="flex items-start justify-between mb-8">
          <div>
              <h1 className="text-2xl font-black text-foreground mb-1 leading-tight">{group.name}</h1>
              <p className="text-xs text-muted-foreground font-medium">{group.description}</p>
          </div>

          {/* Progress Circle Visual */}
          <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
                    <circle 
                        cx="32" cy="32" r="28" 
                        stroke="currentColor" strokeWidth="6" fill="transparent" 
                        className="text-orange-500" 
                        strokeDasharray={175} 
                        strokeDashoffset={175 - (175 * (progress / group.duration))} 
                        strokeLinecap="round" 
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-[10px] font-black text-foreground leading-none">{progress}/{group.duration}</span>
                </div>
          </div>
      </div>

      {/* Pending Requests (Mock for UI as requested) */}
      <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
             <h2 className="text-[10px] font-bold text-foreground">Pending Requests</h2>
             <span className="bg-orange-500/20 text-orange-500 text-[9px] font-bold px-2 py-0.5 rounded-full">1 NEW</span>
          </div>

          <div className="bg-card-bg border border-card-border rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-card-bg relative">
                      👨‍💻
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-card-bg flex items-center justify-center">
                          <Clock size={10} className="text-muted-foreground" />
                      </div>
                  </div>
                  <div>
                      <h3 className="font-bold text-sm text-foreground">Alex Rivera</h3>
                      <p className="text-[10px] text-muted-foreground">Wants to join</p>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <button className="bg-muted/30 text-muted-foreground text-[10px] font-bold py-2.5 rounded-xl hover:bg-muted/50 transition-colors uppercase tracking-wide">Decline</button>
                  <button className="bg-orange-500 text-white text-[10px] font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors uppercase tracking-wide shadow-lg shadow-orange-500/20">Accept</button>
              </div>
          </div>
      </div>

      {/* Your Squad Habit */}
      <div className="mb-8">
          <h2 className="text-[10px] font-bold text-foreground mb-3 px-1">Your Squad Habit</h2>
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-all">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                       <Play size={18} fill="currentColor" />
                   </div>
                   <div>
                       <h3 className="font-bold text-sm text-foreground">Running</h3>
                       <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Athlete</p>
                   </div>
               </div>
               <button className="text-[10px] font-bold text-muted-foreground hover:text-foreground border border-card-border bg-card-bg hover:bg-muted px-3 py-1.5 rounded-lg transition-all uppercase">
                   Change
               </button>
          </div>
      </div>

      {/* Squad Members */}
      <div>
          <h2 className="text-[10px] font-bold text-foreground mb-3 px-1">Squad Members</h2>
          <div className="bg-card-bg border border-card-border rounded-3xl p-1 divide-y divide-card-border/50">
              {group.members.map((member: any, index: number) => (
                  <div key={member._id} className="flex items-center justify-between p-4 relative group hover:bg-muted/5 transition-colors rounded-2xl">
                       <div className="flex items-center gap-4">
                           <span className={`text-xs font-black w-4 text-center ${index === 0 ? "text-yellow-500" : index === 1 ? "text-orange-500" : index === 2 ? "text-slate-400" : "text-muted-foreground/50"}`}>
                               {index + 1}
                           </span>
                           <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-transparent group-hover:border-orange-500/20 transition-all relative">
                               {member.avatar || member.displayName?.charAt(0).toUpperCase() || "?"}
                               {index === 0 && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
                           </div>
                           <div>
                               <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                   {member.displayName}
                                   {/* Mock Badges */}
                                   {index === 0 && <span className="text-[8px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground lowercase">marathon trainer</span>}
                               </h3>
                               <p className="text-[10px] text-muted-foreground">
                                   {index === 1 ? "On fire! 🔥" : index === 2 ? "Trailing behind" : "Consistent"}
                               </p>
                           </div>
                       </div>
                       
                       <div className="text-right">
                           <div className="text-sm font-black text-foreground">{member.streak || 0}d</div>
                           <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Streak</div>
                       </div>

                       {/* Highlight Current User Row style if matched (Mock logic) */}
                       {/* In a real app check member._id === user._id */}
                       {index === 1 && <div className="absolute inset-0 bg-orange-500/5 border-l-2 border-orange-500 rounded-r-2xl pointer-events-none" />}
                  </div>
              ))}
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-3 opacity-60">Rank reflects consecutive streak days in this group.</p>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 space-y-3">
          <button 
            onClick={() => onNavigate("invite-friend")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
              <UserPlus size={18} />
              Invite Friend
          </button>
          
          <button className="w-full text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-red-500/5 transition-colors">
              Leave Group
          </button>
      </div>

    </div>
  );
}
