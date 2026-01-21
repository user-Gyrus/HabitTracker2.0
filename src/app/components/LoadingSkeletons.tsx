import { Skeleton } from "./ui/skeleton";

/**
 * Loading skeleton for habit cards on the main habits screen
 */
export function HabitCardSkeleton() {
  return (
    <div className="bg-card-bg rounded-2xl p-5 border border-card-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for friend list items in social screen
 */
export function FriendCardSkeleton() {
  return (
    <div className="bg-card-bg rounded-2xl p-4 flex items-center justify-between border border-card-border shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

/**
 * Loading skeleton for squad/group cards
 */
export function GroupCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[85%] snap-center">
      <div className="bg-card-bg rounded-2xl p-5 border border-card-border shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex -space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>

        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for streak display card
 */
export function StreakCardSkeleton() {
  return (
    <div className="bg-card-bg rounded-3xl p-6 border border-card-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-2 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the habits screen (multiple habit cards)
 */
export function HabitsScreenSkeleton() {
  return (
    <div className="px-5 space-y-4">
      {/* Streak Card Skeleton */}
      <StreakCardSkeleton />
      
      {/* Habits Section */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <HabitCardSkeleton />
          <HabitCardSkeleton />
          <HabitCardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for friends list in social screen
 */
export function FriendsListSkeleton() {
  return (
    <div className="space-y-3">
      <FriendCardSkeleton />
      <FriendCardSkeleton />
      <FriendCardSkeleton />
      <FriendCardSkeleton />
    </div>
  );
}

/**
 * Loading skeleton for groups carousel
 */
export function GroupsCarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
      <GroupCardSkeleton />
      <GroupCardSkeleton />
    </div>
  );
}

/**
 * Loading skeleton for profile stats grid
 */
export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-card-bg rounded-2xl p-6 border border-card-border">
        <Skeleton className="h-4 w-16 mb-2 mx-auto" />
        <Skeleton className="h-10 w-12 mb-1 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
      <div className="bg-card-bg rounded-2xl p-6 border border-card-border">
        <Skeleton className="h-4 w-16 mb-2 mx-auto" />
        <Skeleton className="h-10 w-12 mb-1 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  );
}
