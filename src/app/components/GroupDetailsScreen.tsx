// ... (imports remain the same)
import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, ChevronRight, UserPlus, LogOut, X, Copy, Share2, MessageCircle, Trash2, Users, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import api from "../../lib/api";

// ... (types and interfaces remain the same)
type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend" | "privacy-policy";

interface GroupDetailsScreenProps {
  onNavigate: (screen: Screen, data?: any) => void; // Updated to accept optional data
  groupId: string;
}

export function GroupDetailsScreen({ onNavigate, groupId }: GroupDetailsScreenProps) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // ... (Share functions remain the same)
  const handleNativeShare = async () => {
     if (!group?.groupCode) return;
     
     const shareText = `Join my squad "${group.name}" on Atomiq! 🔥\nCode: ${group.groupCode}\n`;
     const shareUrl = `https://atomiq.club/join/${group.groupCode}`;
     const shareTitle = `Join ${group.name}`;

     const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
     };



     try {
       if (navigator.share) {
         await navigator.share(shareData);
       } else {
         await navigator.clipboard.writeText(shareText + shareUrl);
         toast.success("Copied to Clipboard");
       }
     } catch (err) {
       console.error("Error sharing:", err);
       if ((err as any).name !== 'AbortError') {
          try {
             await navigator.clipboard.writeText(shareText + shareUrl);
             toast.success("Copied to Clipboard");
          } catch (clipboardErr) {
             toast.error("Failed to share or copy");
          }
       }
     }
  };

  const handleWhatsAppShare = () => {
    if (!group?.groupCode) return;
    const shareText = `Join my squad "${group.name}" on Atomiq! 🔥\nCode: ${group.groupCode}\nLink: https://atomiq.club/join/${group.groupCode}`;
    const encodedText = encodeURIComponent(shareText);
    
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  // ... (Leave/Delete functions remain the same)
  const handleLeaveGroup = async () => {
    try {
      await api.post('/groups/leave', { groupId });
      toast.success('Left the squad successfully');
      setShowLeaveConfirm(false);
      onNavigate('groups'); // Navigate back to groups list
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast.error(error.response?.data?.message || 'Failed to leave squad');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${groupId}`);
      toast.success('Squad deleted successfully');
      setShowDeleteConfirm(false);
      onNavigate('groups');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete squad');
    }
  };

  const fetchGroupDetails = async () => {
      try {
          const res = await api.get(`/groups/${groupId}`);
          setGroup(res.data);
      } catch (error) {
          console.error("Failed to fetch group details", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);




  const handleCreateSquadHabit = async () => {
     // If habit already linked, EDIT it instead of creating new
     if (group.myLinkedHabit) {
         try {
             // Fetch full habit details for editing
             const res = await api.get(`/habits`);
             const linkedHabit = res.data.find((h: any) => h._id === group.myLinkedHabit._id);
             
             if (linkedHabit) {
                 onNavigate('create', linkedHabit); // Pass existing habit for editing
             } else {
                 toast.error("Linked habit not found");
             }
         } catch (error) {
             console.error("Failed to fetch habit for editing", error);
             toast.error("Failed to load habit");
         }
     } else {
         // No linked habit → Create new with squad context
         onNavigate('create', {
             associatedGroup: group._id,
             duration: group.duration,
             name: `${group.name} Habit`, 
         });
     }
  };



  const handleApproveRequest = async (userId: string) => {
      try {
          await api.post('/groups/approve-request', {
              groupId,
              userId
          });
          toast.success("Request approved!");
          fetchGroupDetails(); // Refresh to show updated members
      } catch (error: any) {
          console.error("Failed to approve request", error);
          toast.error(error.response?.data?.message || "Failed to approve request");
      }
  };

  const handleDenyRequest = async (userId: string) => {
      try {
          await api.post('/groups/deny-request', {
              groupId,
              userId
          });
          toast.success("Request denied");
          fetchGroupDetails(); // Refresh to remove the request
      } catch (error: any) {
          console.error("Failed to deny request", error);
          toast.error(error.response?.data?.message || "Failed to deny request");
      }
  };

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

  // Calculate Campaign Day (Days Running)
  const startDate = group.startDate ? new Date(group.startDate) : new Date(group.createdAt);
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const daysRunning = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Use isCreator from API response (database is source of truth)
  const isCreator = group.isCreator || false;

  return (
    <div className="min-h-screen px-5 pt-6 pb-28 text-foreground bg-gradient-to-b from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-50">
        <button 
          onClick={() => onNavigate("groups")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-full transition-colors ${showMenu ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            >
                <MoreHorizontal size={20} />
            </button>
            {/* Same Menu Logic as before */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 ring-1 ring-black/20"
                    >
                        {isCreator ? (
                            <>
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowTransferModal(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-primary hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                                >
                                    <Users size={14} />
                                    Transfer Ownership
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete Squad
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => {
                                    setShowMenu(false);
                                    setShowLeaveConfirm(true);
                                }}
                                className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={14} />
                                Leave Squad
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Backdrop for closing menu */}
         {showMenu && (
            <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setShowMenu(false)}
            />
         )}
      </div>

      {/* Hero Section - Modernized */}
      <div className="relative mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 border border-primary/20 backdrop-blur-sm overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between relative z-10">
              <div className="flex-1">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2 leading-tight">{group.name}</h1>
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      {group.description}
                  </p>
              </div>

              {/* Enhanced Progress Circle */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-md"></div>
                    
                    <svg className="w-full h-full -rotate-90 relative z-10">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-muted/10" />
                        <circle 
                            cx="40" cy="40" r="34" 
                            stroke="url(#progressGradient)" strokeWidth="5" fill="transparent" 
                            strokeDasharray={213} 
                            strokeDashoffset={213 - (213 * (Math.min(daysRunning / group.duration, 1) || 0))} 
                            strokeLinecap="round" 
                            className="transition-all duration-500"
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Day</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-black bg-gradient-to-br from-primary to-orange-600 bg-clip-text text-transparent">{daysRunning}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">/ {group.duration}</span>
                        </div>
                    </div>
              </div>
          </div>
      </div>
      
      {/* POT SHARE SECTION (Staked Squads Only) */}
      {group.groupType === 'staked' && group.stakeAmount && (
        <div className="mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-transparent blur-xl"></div>
            <div className="bg-card-bg/50 backdrop-blur-md border border-yellow-500/30 rounded-3xl p-6 relative z-10 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-lg">💰</span> Pot Share
                    </h2>
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-md border border-yellow-500/20">
                        STAKED
                    </span>
                </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium mb-1">Your Projected Share</p>
                        <div className="text-4xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                           <span className="text-yellow-500">₹</span>
                           {(() => {
                               const totalPot = group.stakeAmount * group.members.length;
                               const survivors = group.members.filter((m: any) => (m.streak || 0) > 0).length;
                               const share = survivors > 0 ? Math.floor(totalPot / survivors) : 0;
                               return share.toLocaleString();
                           })()}
                        </div>
                    </div>
                     <div className="text-right">
                         <p className="text-muted-foreground text-[10px] font-medium mb-1">Total Pool</p>
                         <p className="text-lg font-bold text-muted-foreground/80">
                             ₹{(group.stakeAmount * group.members.length).toLocaleString()}
                         </p>
                     </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-yellow-600/80 bg-yellow-500/5 p-2 rounded-lg">
                    <Users size={12} />
                    <span>Based on {group.members.filter((m: any) => (m.streak || 0) > 0).length} active survivors</span>
                </div>
            </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="mb-8">
           <button 
               onClick={() => setShowPendingRequests(!showPendingRequests)}
               className="flex items-center justify-between mb-4 px-1 w-full text-left group"
           >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Requests</h2>
              <div className="flex items-center gap-2">
                  {group.pendingRequests && group.pendingRequests.length > 0 && (
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/30 animate-pulse">
                          {group.pendingRequests.length} NEW
                      </span>
                  )}
                  <ChevronRight 
                      size={14} 
                      className={`text-muted-foreground transition-transform ${showPendingRequests ? 'rotate-90' : ''}`} 
                  />
              </div>
           </button>
           
           <AnimatePresence>
               {showPendingRequests && (
                   <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       transition={{ duration: 0.2 }}
                   >
                       {group.pendingRequests && group.pendingRequests.length > 0 ? (
                           <div className="space-y-3">
                               {group.pendingRequests.map((request: any) => (
                                   <div key={request.user._id} className="bg-card-bg border border-card-border rounded-2xl p-4">
                                       <div className="flex items-center gap-3 mb-4">
                                           <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg border-2 border-card-bg">
                                               {request.user.displayName?.[0] || "?"}
                                           </div>
                                           <div>
                                               <h3 className="font-bold text-sm text-foreground">{request.user.displayName || "Unknown"}</h3>
                                               <p className="text-[10px] text-muted-foreground">Wants to join</p>
                                           </div>
                                       </div>
                                       <div className="grid grid-cols-2 gap-3">
                                           <button 
                                               onClick={() => handleDenyRequest(request.user._id)}
                                               className="bg-muted/30 text-muted-foreground text-[10px] font-bold py-2.5 rounded-xl hover:bg-muted/50 transition-colors uppercase tracking-wide"
                                           >
                                               Decline
                                           </button>
                                           <button 
                                               onClick={() => handleApproveRequest(request.user._id)}
                                               className="bg-orange-500 text-white text-[10px] font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors uppercase tracking-wide shadow-lg shadow-orange-500/20"
                                           >
                                               Accept
                                           </button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="bg-card-bg border border-card-border rounded-2xl p-4 text-center">
                               <p className="text-xs text-muted-foreground">No pending requests</p>
                           </div>
                       )}
                   </motion.div>
               )}
           </AnimatePresence>
      </div>

      {/* Your Squad Habit - Enhanced */}
      <div className="mb-8">
           <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Your Squad Habit</h2>
           <div className="relative bg-gradient-to-br from-primary/5 via-orange-500/5 to-transparent border border-primary/20 rounded-3xl p-6 overflow-hidden backdrop-blur-sm">
               {/* Decorative glow */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-2xl rounded-full" />
               
               {group.myLinkedHabit ? (
                   <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                 {/* Outer glow */}
                                 <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-md"></div>
                                 
                                 <svg className="w-full h-full -rotate-90 relative z-10">
                                     <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/10" />
                                     <circle 
                                         cx="32" cy="32" r="28" 
                                         stroke="url(#habitGradient)" strokeWidth="4" fill="transparent" 
                                         strokeDasharray={175} 
                                         strokeDashoffset={175 - (175 * ((group.myLinkedHabit.progress || 0) / (group.myLinkedHabit.duration || 21)))} 
                                         strokeLinecap="round" 
                                         className="transition-all duration-500"
                                     />
                                     <defs>
                                         <linearGradient id="habitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                             <stop offset="0%" stopColor="#f97316" />
                                             <stop offset="100%" stopColor="#fb923c" />
                                         </linearGradient>
                                     </defs>
                                 </svg>
                                 <div className="absolute flex flex-col items-center">
                                     <span className="text-[10px] font-black leading-none">
                                         <span className="bg-gradient-to-br from-primary to-orange-600 bg-clip-text text-transparent">{group.myLinkedHabit.progress || 0}</span>
                                         <span className="text-muted-foreground">/{group.myLinkedHabit.duration || 21}</span>
                                     </span>
                                 </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-foreground mb-1 truncate">{group.myLinkedHabit.name}</h3>
                                <p className="text-xs">
                                    <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                        {group.myLinkedHabit.microIdentity || "SQUAD"}
                                    </span>
                                </p>
                            </div>
                       </div>
                       <button 
                         onClick={handleCreateSquadHabit}
                         className="text-xs font-bold text-foreground/70 hover:text-foreground border-2 border-card-border hover:border-primary/30 bg-background/50 hover:bg-background/80 backdrop-blur-sm px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap shadow-sm hover:shadow-md"
                       >
                           Change
                       </button>
                   </div>
               ) : (
                   <div className="text-center py-8 relative z-10">
                       <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/10">
                            <Plus size={24} className="text-orange-500" strokeWidth={2.5} />
                       </div>
                       <h3 className="font-bold text-base text-foreground mb-2">No Habit Linked</h3>
                       <p className="text-sm text-muted-foreground mb-5">Connect a habit to track with your squad</p>
                       <button 
                         onClick={handleCreateSquadHabit}
                         className="text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 px-6 py-2.5 rounded-xl transition-all uppercase shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                       >
                           Connect Habit
                       </button>
                   </div>
               )}
           </div>
       </div>


      {/* Squad Members - Enhanced */}
      <div className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Squad Members</h2>
          <div className="bg-gradient-to-br from-card-bg to-card-bg/50 border border-card-border rounded-3xl p-2 divide-y divide-card-border/50 shadow-lg">
              {group.members.map((member: any, index: number) => {
                  const isDroppedOut = group.groupType === 'staked' && (member.streak || 0) === 0;
                  
                  return (
                   <div key={member._id} className={`flex items-center justify-between p-4 relative group transition-all rounded-2xl border border-transparent
                       ${isDroppedOut ? 'opacity-60 grayscale hover:opacity-80' : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent'}`}>
                        
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-shrink-0">
                                <span className={`text-sm font-black ${
                                    isDroppedOut ? "text-red-500" :
                                    index === 0 ? "text-yellow-500" : 
                                    index === 1 ? "text-orange-500" : 
                                    index === 2 ? "text-slate-400" : "text-muted-foreground/50"
                                }`}>
                                    {isDroppedOut ? "💀" : index + 1}
                                </span>
                            </div>
                            <div className="relative flex-shrink-0">
                                <div className={`w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-base border-2 transition-all shadow-md relative overflow-hidden ${
                                    isDroppedOut ? 'from-zinc-700 to-zinc-800 border-red-500/30' :
                                    index === 0 ? 'from-yellow-400 to-orange-500 border-yellow-500/30 shadow-yellow-500/20' :
                                    index === 1 ? 'from-orange-400 to-red-500 border-orange-500/30 shadow-orange-500/20' :
                                    index === 2 ? 'from-slate-300 to-slate-400 border-slate-400/30 shadow-slate-400/20' :
                                    'from-muted to-muted/50 border-transparent group-hover:border-primary/20'
                                }`}>
                                    {member.avatar || member.displayName?.charAt(0).toUpperCase() || "?"}
                                    
                                    {isDroppedOut && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-full h-[2px] bg-red-500 rotate-45 absolute"></div>
                                        </div>
                                    )}
                                </div>
                                {!isDroppedOut && index === 0 && <span className="absolute -top-1 -right-1 text-base drop-shadow-lg">👑</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className={`font-bold text-sm truncate ${isDroppedOut ? "text-muted-foreground line-through decoration-red-500/50" : "text-foreground"}`}>
                                        {member.displayName}
                                    </h3>
                                    {member.linkedHabit && !isDroppedOut && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">Active</span>}
                                    {isDroppedOut && <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">Eliminated</span>}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {member.linkedHabit ? (member.linkedHabit.microIdentity || member.linkedHabit.name) : "No habit linked"}
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-3">
                            <div className={`text-sm font-black ${isDroppedOut ? "text-red-500" : "text-foreground"}`}>{member.streak || 0}d</div>
                            <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Streak</div>
                        </div>
                   </div>
               );
              })}
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-3 opacity-60">Rank reflects consecutive streak days in this group.</p>
      </div>

      {/* Footer Actions - Enhanced */}
      <div className="mt-8">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="relative w-full bg-gradient-to-r from-primary via-orange-500 to-orange-600 hover:from-primary/90 hover:via-orange-500/90 hover:to-orange-600/90 text-white font-black uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all overflow-hidden group"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <UserPlus size={20} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10">Invite Friend</span>
          </button>
      </div>

      {/* HABIT SELECTOR MODAL */}


      {/* INVITE SQUAD MODAL */}
      {showInviteModal && group && (
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
                   <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                      <UserPlus size={32} className="text-orange-500" />
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-2">Invite to Squad</h3>
                   <p className="text-sm text-muted-foreground">Share the code or link to grow your squad!</p>
                </div>

                {/* Squad Code */}
                <div className="mb-4">
                   <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Squad Code</label>
                   <div 
                      onClick={() => copyToClipboard(group.groupCode || "")}
                      className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                   >
                      <span className="font-mono text-lg font-bold text-primary tracking-wider">{group.groupCode || "..."}</span>
                      <Copy size={18} className="text-muted-foreground" />
                   </div>
                </div>

                {/* Website Link */}
                 <div className="mb-6">
                   <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Invite Link</label>
                   <div 
                      onClick={() => copyToClipboard(`https://atomiq.club/join/${group.groupCode}`)}
                      className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                   >
                      <span className="text-sm text-foreground truncate">{`atomiq.club/join/${group.groupCode}`}</span>
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
                      Share
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

      {/* TRANSFER OWNERSHIP MODAL and OTHERS (Same as original) */}
      {showTransferModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransferModal(false)} />
              
              <div className="relative w-full max-w-sm bg-card-bg border border-card-border rounded-3xl p-6 shadow-2xl">
                  <button 
                      onClick={() => setShowTransferModal(false)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Users size={32} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Transfer Ownership</h3>
                      <p className="text-sm text-muted-foreground">
                          Select a member to become the new squad creator
                      </p>
                  </div>

                  {/* Member List */}
                  <div className="mb-6 max-h-64 overflow-y-auto space-y-2">
                      {group.members
                          .filter((member: any) => {
                              const creatorId = typeof group.creator === 'object' ? group.creator._id : group.creator;
                              return member._id.toString() !== creatorId.toString();
                          })
                          .map((member: any) => (
                              <button
                                  key={member._id}
                                  onClick={() => setSelectedMemberId(member._id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                      selectedMemberId === member._id
                                          ? 'bg-primary/10 border-primary'
                                          : 'bg-card-bg border-card-border hover:border-primary/30'
                                  }`}
                              >
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
                                      {member.displayName?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div className="flex-1 text-left">
                                      <p className="font-semibold text-sm text-foreground">{member.displayName}</p>
                                      <p className="text-xs text-muted-foreground">{member.streak || 0}d streak</p>
                                  </div>
                                  {selectedMemberId === member._id && (
                                      <Check size={20} className="text-primary" />
                                  )}
                              </button>
                          ))}
                  </div>

                  <div className="flex gap-3">
                      <button
                          onClick={() => {
                              setShowTransferModal(false);
                              setSelectedMemberId(null);
                          }}
                          className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl transition-all"
                      >
                          Cancel
                      </button>
                      <button
                          onClick={async () => {
                              if (!selectedMemberId) return;
                              try {
                                  await api.put(`/groups/${groupId}/transfer-ownership`, {
                                      newCreatorId: selectedMemberId
                                  });
                                  toast.success('Ownership transferred successfully');
                                  setShowTransferModal(false);
                                  setSelectedMemberId(null);
                                  // Refresh group data
                                  fetchGroupDetails();
                              } catch (err: any) {
                                  toast.error(err.response?.data?.message || 'Failed to transfer ownership');
                              }
                          }}
                          disabled={!selectedMemberId}
                          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed"
                      >
                          Transfer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEAVE GROUP CONFIRMATION DIALOG (Same as original) */}
      {showLeaveConfirm && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div 
            className="relative w-full max-w-sm bg-card-bg border border-card-border rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Leave Squad?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to leave "{group?.name}"? You can always rejoin later with the squad code.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE GROUP CONFIRMATION DIALOG (Same as original) */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          onClick={() => setShowDeleteConfirm(false)}
        >
          {/* Backdrop with strong blur/darkening for dangerous action */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          {/* Dialog */}
          <div 
            className="relative w-full max-w-sm bg-[#1A1A1A] border border-red-500/30 rounded-3xl p-6 shadow-2xl ring-1 ring-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 size={32} className="text-red-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-red-500 mb-2 uppercase tracking-wide">Delete Squad</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 You are the creator of <span className="text-foreground font-bold">"{group?.name}"</span>. 
              </p>
              <p className="text-xs text-red-400 mt-2 font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                 ⚠️ This action is permanent and cannot be undone. All data will be lost.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all uppercase tracking-wider"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
