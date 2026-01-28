import { Plus, Ticket, Users, Calendar, Trophy } from "lucide-react";
import { motion } from "motion/react";

type Screen = "habits" | "create" | "profile" | "social" | "groups";

interface GroupsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function GroupsScreen({}: GroupsScreenProps) {
  // Mock Data for "Your Squads"
  const mySquads = [
    {
      id: "1",
      name: "Morning Runners",
      description: "5AM RUN PROTOCOL",
      members: 12,
      maxMembers: 21,
      pot: "₹1000",
      avatars: ["👩‍🎤", "👨‍🎤", "👩‍🚀"],
      extraMembers: 9,
      isActive: true,
      progress: 0.6,
    },
    {
      id: "2",
      name: "Deep Work Club",
      description: "4H FOCUS BLOCK",
      members: 5,
      maxMembers: 14,
      rank: "#5",
      avatars: ["👨‍💻", "👩‍💻"],
      extraMembers: 0,
      isActive: true,
      progress: 0.4,
    }
  ];

  // Mock Data for "Discover New Squads"
  const discoverSquads = [
    {
      id: "3",
      name: "Yoga Daily",
      description: "Master flexibility in 30 days.",
      creator: "Kate",
      creatorAvatar: "🧘‍♀️",
      membersCount: "2 others",
      startDate: "Jan 25",
      totalMembers: 124,
    },
    {
      id: "4",
      name: "Keto Life",
      description: "Strict low carb for elite focus.",
      creator: "Sam",
      creatorAvatar: "🥗",
      membersCount: "5 others",
      startDate: "Feb 01",
      totalMembers: 89,
    }
  ];

  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          GROUPS
        </h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-2xl text-[10px] font-bold tracking-wide hover:bg-primary/20 transition-all active:scale-95 shadow-[0_4px_10px_rgba(255,107,0,0.1)]">
            <Ticket size={14} className="fill-primary/20" />
            JOIN CODE
          </button>
          <button className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-90 shadow-[0_4px_10px_rgba(255,107,0,0.1)]">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Your Squads Section */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Your Squads</h2>
        
        <div className="space-y-5">
          {mySquads.map((squad) => (
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
                        {/* Progress Circle Visual */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                                <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
                                <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-primary" strokeDasharray={144} strokeDashoffset={144 - (144 * squad.progress)} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-[10px] font-black text-foreground">{squad.members}/{squad.maxMembers}</span>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">{squad.name}</h3>
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-90">{squad.description}</p>
                        </div>
                    </div>

                    {squad.pot ? (
                         <div className="bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-sm flex items-center justify-center text-[9px] text-black font-black">$</div>
                            <div className="flex flex-col leading-none">
                                <span className="text-xs text-yellow-600 font-extrabold">{squad.pot}</span>
                                <span className="text-[8px] text-yellow-600/70 font-semibold uppercase">Pot</span>
                            </div>
                         </div>
                    ) : squad.rank ? (
                        <div className="bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm">
                             <Trophy size={14} className="text-orange-500" />
                             <div className="flex flex-col leading-none">
                                <span className="text-xs text-orange-600 font-extrabold">{squad.rank}</span>
                                <span className="text-[8px] text-orange-600/70 font-semibold uppercase">Rank</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center -space-x-2 pl-2">
                         {squad.avatars.map((avatar, i) => (
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

                     <button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-6 py-2.5 rounded-full transition-all shadow-md shadow-primary/20 active:scale-95">
                         View
                     </button>
                </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Discover New Squads Section */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Discover New Squads</h2>
            <button className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors uppercase tracking-wide">View All</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {discoverSquads.map((squad) => (
                <div key={squad.id} className="bg-card-bg/50 backdrop-blur-sm p-4 rounded-[1.5rem] border border-card-border/60 flex flex-col h-full relative overflow-hidden group hover:bg-card-bg hover:border-primary/30 transition-all shadow-sm hover:shadow-lg hover:shadow-primary/5">
                     
                     <div className="mb-4 relative z-10">
                         <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{squad.name}</h3>
                         <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{squad.description}</p>
                     </div>

                     <div className="flex items-center gap-2 mb-4 relative z-10">
                         <div className="w-5 h-5 rounded-full bg-muted/50 border border-muted flex items-center justify-center text-[10px] shadow-sm">{squad.creatorAvatar}</div>
                         <span className="text-[9px] text-muted-foreground font-medium">{squad.creator} & {squad.membersCount}</span>
                     </div>

                     <div className="mt-auto relative z-10 w-full">
                         <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar size={12} className="opacity-70" />
                                <span className="text-[9px] font-medium">{squad.startDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users size={12} className="opacity-70" />
                                <span className="text-[9px] font-medium">{squad.totalMembers}</span>
                            </div>
                         </div>
                         
                         <button className="w-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-extrabold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all uppercase tracking-wider shadow-sm">
                             Join Squad
                         </button>
                     </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
