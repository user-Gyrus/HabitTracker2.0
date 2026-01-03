import { useEffect, useState } from "react";
import { ChevronLeft, Flame, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

type Screen = "habits" | "create" | "profile" | "social";

interface SocialScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Friend {
  id: string;
  name: string;
  progress: number;
  status: "done" | "progress" | "not-started";
  completedCount: number;
  totalCount: number;
}

export function SocialScreen({ onNavigate }: SocialScreenProps) {
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  const today: string = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const loadSocialData = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      /* ---------------------------
         CURRENT USER
      ---------------------------- */
      const { data: myHabits } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id);

      const { data: myCompletions } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("completion_date", today)
        .eq("completed", true);

      const total: number = myHabits?.length ?? 0;
      const completed: number = myCompletions?.length ?? 0;

      setCurrentUser({
        id: user.id,
        name: "You",
        completedCount: completed,
        totalCount: total,
        progress: total ? Math.round((completed / total) * 100) : 0,
        status:
          completed === total && total > 0
            ? "done"
            : completed > 0
            ? "progress"
            : "not-started",
      });

      /* ---------------------------
         FRIENDS
      ---------------------------- */
      const { data: friendLinks } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", user.id);

      if (!friendLinks) return;

      const friendData: Friend[] = [];

      for (const link of friendLinks) {
        const friendId: string = link.friend_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", friendId)
          .single();

        const { data: habits } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", friendId);

        const { data: completions } = await supabase
          .from("habit_completions")
          .select("habit_id")
          .eq("user_id", friendId)
          .eq("completion_date", today)
          .eq("completed", true);

        const totalHabits: number = habits?.length ?? 0;
        const completedHabits: number = completions?.length ?? 0;

        friendData.push({
          id: friendId,
          name: profile?.display_name ?? "Friend",
          completedCount: completedHabits,
          totalCount: totalHabits,
          progress: totalHabits
            ? Math.round((completedHabits / totalHabits) * 100)
            : 0,
          status:
            completedHabits === totalHabits && totalHabits > 0
              ? "done"
              : completedHabits > 0
              ? "progress"
              : "not-started",
        });
      }

      setFriends(friendData);
    };

    loadSocialData();
  }, []);

  if (!currentUser) return null;

  /* ---------------------------
     FILTERED GROUPS (TS SAFE)
  ---------------------------- */
  const doneToday: Friend[] = friends.filter(
    (f: Friend) => f.status === "done"
  );

  const inProgress: Friend[] = friends.filter(
    (f: Friend) => f.status === "progress"
  );

  const notStarted: Friend[] = friends.filter(
    (f: Friend) => f.status === "not-started"
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6">
        <button onClick={() => onNavigate("habits")}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Accountability Board</h1>
        <Plus size={24} className="text-[#ff5722]" />
      </div>

      <div className="px-5 pb-6 space-y-6">
        {/* Status Card */}
        <div className="bg-gradient-to-br from-[#ff5722] to-[#ff6b3d] rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold mb-2">
            {doneToday.length} friends crushed it today
          </p>
          <p className="text-white/80">Keep the momentum going!</p>
        </div>

        {/* Current User */}
        <div className="bg-[#2a1f19] rounded-2xl p-4">
          <p className="font-semibold mb-1">You</p>
          <p className="text-sm text-[#ff5722] mb-2">
            {currentUser.completedCount} / {currentUser.totalCount}
          </p>
          <div className="h-2 bg-[#3d2f26] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff5722]"
              style={{ width: `${currentUser.progress}%` }}
            />
          </div>
        </div>

        {/* Done Today */}
        {doneToday.length > 0 && (
          <div>
            <h2 className="font-semibold text-green-400 mb-3">Done Today</h2>
            {doneToday.map((f: Friend) => (
              <div
                key={f.id}
                className="bg-[#2a1f19] p-3 rounded-xl flex justify-between"
              >
                <p>{f.name}</p>
                <Flame className="text-[#ff5722]" fill="#ff5722" />
              </div>
            ))}
          </div>
        )}

        {/* Still In Progress */}
        {inProgress.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Still In Progress</h2>
            {inProgress.map((f: Friend) => (
              <div key={f.id} className="bg-[#2a1f19] p-3 rounded-xl">
                <p>{f.name}</p>
                <div className="h-1.5 bg-[#3d2f26] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ff5722]/60"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Not Started */}
        {notStarted.length > 0 && (
          <div>
            <h2 className="font-semibold text-[#8a7a6e] mb-3">Not Started</h2>
            {notStarted.map((f: Friend) => (
              <div
                key={f.id}
                className="bg-[#2a1f19] p-3 rounded-xl opacity-60"
              >
                <p>{f.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
