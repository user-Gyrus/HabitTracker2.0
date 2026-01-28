import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Link as LinkIcon, MessageCircle, Share2 } from "lucide-react";
import api from "../../lib/api";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend";

interface InviteFriendScreenProps {
  onNavigate: (screen: Screen) => void;
  groupId: string;
}

export function InviteFriendScreen({ onNavigate, groupId }: InviteFriendScreenProps) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
        try {
            const res = await api.get(`/groups/${groupId}`);
            setGroup(res.data);
        } catch (error) {
            console.error("Failed to load group", error);
        } finally {
            setLoading(false);
        }
    };
    fetchGroup();
  }, [groupId]);

  if (loading || !group) return <div className="min-h-screen bg-black flex items-center justify-center text-muted-foreground text-xs">Loading...</div>;

  // Mock Progress (same logic as details)
  const startDate = new Date(group.startDate || group.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const progress = Math.min(diffDays, group.duration);

  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] flex flex-col items-center">
       {/* Header */}
       <div className="w-full flex items-center justify-between mb-8">
          <button 
             onClick={() => onNavigate("group-details")}
             className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
             <ArrowLeft size={20} />
          </button>
          <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">Invite To Squad</h1>
          <div className="w-10"></div> {/* Spacer */}
       </div>

       {/* Squad Info */}
       <div className="flex flex-col items-center mb-8">
           <div className="relative w-24 h-24 flex items-center justify-center mb-4">
               {/* Background Circle */}
               <svg className="w-full h-full -rotate-90">
                   <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                   <circle 
                       cx="48" cy="48" r="40" 
                       stroke="#f97316" strokeWidth="8" fill="transparent" 
                       strokeDasharray={251} 
                       strokeDashoffset={251 - (251 * (progress / group.duration))} 
                       strokeLinecap="round"
                   />
               </svg>
               <div className="absolute text-xl font-black text-foreground tracking-tighter flex flex-col items-center leading-none">
                   <span>{progress}</span>
                   <span className="text-muted-foreground text-sm font-bold">/{group.duration}</span>
               </div>
           </div>
           
           <h2 className="text-xl font-bold mb-1 text-foreground">{group.name}</h2>
           <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">{group.description}</p>
       </div>

       {/* Invite Card */}
       <div className="w-full bg-card-bg border border-card-border rounded-3xl p-5 mb-8 shadow-sm">
           
           {/* Share Header */}
           <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                   <LinkIcon size={16} />
               </div>
               <span className="text-sm font-bold text-foreground">Share Invite Link</span>
           </div>

           {/* Link Input */}
           <div className="bg-muted/50 border border-card-border rounded-xl flex items-center justify-between p-1 pl-4 mb-4">
               <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">atomiq.app/join/{group.groupCode.toLowerCase()}</span>
               <button className="w-8 h-8 rounded-lg bg-card-bg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-card-border">
                   <Copy size={14} />
               </button>
           </div>

           {/* Main CTA */}
           <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors mb-6 shadow-lg shadow-orange-500/20 active:scale-[0.98]">
               Copy Link
           </button>

           {/* Social Grid */}
           <div className="grid grid-cols-2 gap-3">
               <button className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group border border-transparent hover:border-card-border">
                   <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                       <MessageCircle size={20} fill="currentColor" className="opacity-20 absolute" />
                       <MessageCircle size={20} />
                   </div>
                   <span className="text-[9px] font-bold text-muted-foreground uppercase">Whatsapp</span>
               </button>

               <button className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group border border-transparent hover:border-card-border">
                   <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                       <Share2 size={20} />
                   </div>
                   <span className="text-[9px] font-bold text-muted-foreground uppercase">More</span>
               </button>
           </div>
       </div>

       {/* Squad Code Section */}
       <div className="w-full">
           <div className="flex items-center gap-4 mb-4">
               <div className="h-[1px] flex-1 bg-card-border" />
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Or Join With Squad Code</span>
               <div className="h-[1px] flex-1 bg-card-border" />
           </div>

           <div className="flex gap-2">
               <div className="flex-1 bg-card-bg border border-card-border rounded-xl py-4 flex items-center justify-center shadow-sm">
                   <span className="text-xl font-black tracking-widest text-foreground">{group.groupCode}</span>
               </div>
               <button className="w-14 bg-card-bg border border-card-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:border-primary/50">
                   <Copy size={20} />
               </button>
           </div>
       </div>

    </div>
  );
}
