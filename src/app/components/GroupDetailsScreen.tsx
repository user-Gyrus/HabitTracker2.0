import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, User, Trophy, Flame, Play, Clock, ChevronRight, UserPlus, LogOut, X, Copy, Share2, MessageCircle, Link as LinkIcon, Trash2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import api from "../../lib/api";

type Screen = "habits" | "create" | "profile" | "social" | "groups" | "create-group" | "group-details" | "invite-friend";

interface GroupDetailsScreenProps {
  onNavigate: (screen: Screen) => void;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

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

  useEffect(() => {
    const fetchGroupDetails = async () => {
        try {
            const res = await api.get(`/groups/${groupId}`);
            console.log("📦 Group Details Response:", res.data);
            console.log("🔑 Group Code:", res.data.groupCode);
            console.log("👑 Is Creator:", res.data.isCreator);
            setGroup(res.data);
            
            // Alert if groupCode is missing
            if (!res.data.groupCode) {
                console.warn("⚠️ Group is missing groupCode field!");
            }
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
            
            {/* Dropdown Menu */}
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
      <div className="mt-8">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
              <UserPlus size={18} />
              Invite Friend
          </button>
      </div>

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
                    </button>
                 </div>
             </div>
          </div>
       )}

      {/* TRANSFER OWNERSHIP MODAL */}
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
                                  const res = await api.get(`/groups/${groupId}`);
                                  setGroup(res.data);
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

      {/* LEAVE GROUP CONFIRMATION DIALOG */}
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

      {/* DELETE GROUP CONFIRMATION DIALOG */}
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
