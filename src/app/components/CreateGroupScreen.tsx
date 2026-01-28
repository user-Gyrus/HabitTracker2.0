import { useState, useEffect } from "react";
import { ArrowLeft, Users, Calendar, Rocket, Search, Check } from "lucide-react";
import { motion } from "motion/react";
import api from "../../lib/api";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details";

interface CreateGroupScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function CreateGroupScreen({ onNavigate }: CreateGroupScreenProps) {
  const [missionType, setMissionType] = useState<"social" | "staked">("staked");
  const [duration, setDuration] = useState<number>(48);
  const [isPrivate, setIsPrivate] = useState(true);
  const [capacity, setCapacity] = useState(5);
  const [stakeAmount, setStakeAmount] = useState("5000");
  
  // New State Fields
  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCustomInput, setIsCustomInput] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
        try {
            const res = await api.get("/friends");
            setFriends(res.data);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        }
    };
    fetchFriends();
  }, []);
  
  const handleInitialize = async () => {
      try {
          if (!name || !protocol || !startDate) {
              alert("Please fill in all required fields (Identifier, Protocol, Date)");
              return;
          }

          setLoading(true);
          const payload = {
              name,
              description: protocol, // Using protocol as description/objective
              duration: typeof duration === 'string' ? parseInt(duration) : duration,
              groupType: missionType,
              isPrivate,
              capacity,
              stakeAmount: missionType === "staked" ? parseInt(stakeAmount) : undefined,
              startDate,
              members: selectedMembers, // Sending selected IDs
              trackingType: "shared" // Default
          };

          await api.post("/groups/create", payload);
          setLoading(false);
          onNavigate("groups");
      } catch (error) {
          console.error("Failed to create squad", error);
          alert("Failed to initialize squad");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => onNavigate("groups")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">INITIALIZE SQUAD</h1>
      </div>

      <div className="space-y-6">
        {/* Mission Type */}
        <section>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Mission Type</h2>
          <div className="grid gap-3">
             <div 
               onClick={() => setMissionType("social")}
               className={`p-4 rounded-xl border cursor-pointer transition-all ${missionType === "social" ? "bg-card-bg border-primary ring-1 ring-primary" : "bg-card-bg/50 border-card-border opacity-60 hover:opacity-100"}`}
             >
                <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-sm">Social Squad</h3>
                   <Users size={16} className={missionType === "social" ? "text-primary" : "text-muted-foreground"} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Casual accountability. Build habits together with friend support.
                </p>
             </div>

             <div 
               onClick={() => setMissionType("staked")}
               className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${missionType === "staked" ? "bg-card-bg border-primary ring-1 ring-primary" : "bg-card-bg/50 border-card-border opacity-60 hover:opacity-100"}`}
             >
                {/* Glow for Staked */}
                {missionType === "staked" && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 blur-[30px] rounded-full pointer-events-none" />}
                
                <div className="flex items-center justify-between mb-2 relative z-10">
                   <h3 className="font-bold text-sm text-foreground">Staked Squad</h3>
                   <div className="w-4 h-4 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/50">
                      <span className="text-[10px] text-yellow-500 font-bold">$</span>
                   </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed relative z-10">
                   High commitment. Pledge money. 100% completion or forfeit.
                </p>

                {missionType === "staked" && (
                  <div className="mt-3 pt-3 border-t border-dashed border-primary/20">
                     <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        <span className="text-[9px] font-bold text-orange-500 uppercase">How It Works</span>
                     </div>
                     <ul className="pl-4 list-disc space-y-0.5 text-[9px] text-muted-foreground marker:text-orange-500/50">
                        <li>All members pledge a buy-in amount.</li>
                        <li>Miss a day? Your pledge goes to the pot.</li>
                        <li>Survivors split the total pot.</li>
                     </ul>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Squad Identifier */}
        <section>
           <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Squad Identifier</h2>
           <input 
             type="text" 
             value={name}
             onChange={(e) => setName(e.target.value)}
             placeholder="e.g. 5AM Club" 
             className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
           />
        </section>

        {/* Objective Protocol */}
        <section>
           <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Objective Protocol</h2>
           <input 
             type="text" 
             value={protocol}
             onChange={(e) => setProtocol(e.target.value)}
             placeholder="e.g. Daily Run, Meditation, Deep Work" 
             className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
           />
        </section>

        {/* Duration Cycle */}
        <section>
           <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration Cycle</h2>
              <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Habit Formation</span>
           </div>
           
           <div className="grid grid-cols-4 gap-2">
              {[21, 48, 66].map((d) => (
                 <button
                   key={d}
                   onClick={() => {
                       setDuration(d);
                       setIsCustomInput(false);
                   }}
                   className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${duration === d && !isCustomInput ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card-bg border-card-border text-muted-foreground hover:bg-card-bg/80"}`}
                 >
                    <span className="block text-lg font-black leading-none text-center">{d}</span>
                    <span className="block text-[8px] font-bold uppercase text-center mt-1">Days</span>
                 </button>
              ))}
              
              <button
                onClick={() => setIsCustomInput(true)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${isCustomInput ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card-bg border-card-border text-muted-foreground hover:bg-card-bg/80"}`}
              >
                 <span className="block text-lg font-black leading-none text-center">?</span>
                 <span className="block text-[8px] font-bold uppercase text-center mt-1">Custom</span>
              </button>
           </div>

           {isCustomInput && (
             <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 relative"
             >
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-primary/50 transition-colors text-foreground pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">Days</span>
             </motion.div>
           )}
           
           <div className="mt-2 flex items-start gap-2 text-muted-foreground">
              <div className="mt-0.5"><div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary font-bold">i</div></div>
              <p className="text-[9px] leading-tight">Shorter challenges improve completion rates by 24%.</p>
           </div>
        </section>

        {/* Protocol Launch */}
         <section>
           <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Protocol Launch</h2>
           <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors text-foreground uppercase tracking-wide opacity-90"
              />
              <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
           </div>
        </section>

        {/* Visibility & Capacity */}
        <div className="grid grid-cols-2 gap-4">
             <section className="bg-card-bg border border-card-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Visibility</h2>
                  <p className="text-sm font-bold">{isPrivate ? "Private" : "Public"}</p>
                </div>
                <div 
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${isPrivate ? "bg-primary" : "bg-muted"}`}
                >
                   <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPrivate ? "translate-x-4" : ""}`} />
                </div>
             </section>

             <section className="bg-card-bg border border-card-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Capacity</h2>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setCapacity(Math.max(2, capacity - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80">-</button>
                     <span className="text-sm font-bold w-4 text-center">{capacity.toString().padStart(2, '0')}</span>
                     <button onClick={() => setCapacity(Math.min(10, capacity + 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80">+</button>
                  </div>
                </div>
                <Users size={18} className="text-muted-foreground opacity-50" />
             </section>
        </div>

        {/* Set The Stakes */}
        {missionType === "staked" && (
           <motion.section 
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             className="border border-orange-500/30 bg-[linear-gradient(135deg,_rgba(255,107,0,0.05)_0%,_rgba(0,0,0,0)_100%)] rounded-2xl p-5 relative overflow-hidden"
           >
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <h2 className="text-sm font-black text-foreground">Set The Stakes</h2>
                    <p className="text-[10px] text-muted-foreground">Per person buy-in amount</p>
                 </div>
                 <div className="bg-orange-950/40 text-orange-500 border border-orange-500/20 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                    Live
                 </div>
              </div>

              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
                 <input 
                   type="number"
                   value={stakeAmount}
                   onChange={(e) => setStakeAmount(e.target.value)}
                   className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-xl pl-10 pr-4 py-4 text-xl font-bold text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                 />
              </div>
           </motion.section>
        )}

        {/* Recruit Members */}
        <section>
           <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recruit Members</h2>
              <button 
                onClick={() => {
                    if (selectedMembers.length === friends.length) {
                        setSelectedMembers([]);
                    } else {
                        setSelectedMembers(friends.map(f => f._id)); 
                    }
                }}
                className="text-[9px] font-bold text-orange-500 uppercase hover:text-orange-400 transition-colors"
              >
                {selectedMembers.length === friends.length && friends.length > 0 ? "Deselect All" : "Select All"}
              </button>
           </div>
           
           <div className="relative mb-4">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handle or name..." 
                className="w-full bg-card-bg border border-card-border rounded-xl pl-10 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
              />
           </div>

           <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
              {friends.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-4">No friends found. Add some friends first!</p>
              ) : (
                  friends
                  .filter(friend => 
                    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    friend.friendCode?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((friend: any) => {
                      const isSelected = selectedMembers.includes(friend._id);
                      return (
                          <div 
                            key={friend._id} 
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedMembers(prev => prev.filter(id => id !== friend._id));
                                } else {
                                    setSelectedMembers(prev => [...prev, friend._id]);
                                }
                            }}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${isSelected ? "bg-card-bg border-orange-500/50 shadow-sm shadow-orange-500/5" : "bg-card-bg/50 border-card-border hover:bg-card-bg"}`}
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-lg relative border border-card-border">
                                     {/* Use emoji or initial if no avatar */}
                                     {friend.avatar || "😎"} 
                                     {isSelected && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card-bg" />}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-sm text-foreground">{friend.displayName}</h3>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                          <span>{friend.friendCode}</span>
                                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                          {/* Show Streak as "Rate" proxy for now */}
                                          <span className="text-orange-500 font-bold">{friend.streak || 0} Day Streak</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? "bg-orange-500 border-orange-500" : "border-muted-foreground/30"}`}>
                                  {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                          </div>
                      );
                  })
              )}
           </div>
        </section>

        {/* Action Button */}
        <button 
           onClick={handleInitialize}
           disabled={loading || !name || !protocol || !startDate}
           className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-4 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none"
        >
           {loading ? "INITIALIZING..." : "INITIALIZE SQUAD"}
           {!loading && <Rocket size={18} />}
        </button>
      </div>
    </div>
  );
}
