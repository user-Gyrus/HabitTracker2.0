import { NextFunction, Request, Response } from "express";
import Group from "../models/Group";
import User from "../models/User";
import Streak from "../models/Streak";
import Habit from "../models/Habit";
import { generateGroupCode } from "../utils/generateGroupCode";
import { getISTDate } from "../utils/dateUtils";

// @desc    Create a new Squad
// @route   POST /api/groups/create
// @access  Private
export const createGroup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, members, trackingType, duration, avatar, description, groupType, isPrivate, capacity, stakeAmount, startDate } = req.body;

        if (!name || !duration) {
            res.status(400).json({ message: "Name and duration are required" });
            return;
        }

        const maxCapacity = capacity || 10;
        if (members.length > maxCapacity) {
             res.status(400).json({ message: `Squads can have a maximum of ${maxCapacity} members` });
             return;
        }

        // Add creator to members list if not already there
        const allMembers = [...new Set([...members, req.user._id.toString()])];

        const group = await Group.create({
            name,
            groupCode: generateGroupCode(), // Generate unique code
            members: allMembers,
            creator: req.user._id,
            trackingType,
            duration,
            avatar: avatar || "🚀",
            description,
            groupType,
            isPrivate,
            capacity: maxCapacity,
            stakeAmount: groupType === "staked" ? stakeAmount : undefined,
            startDate
        });

        res.status(201).json(group);
    } catch (error) {
        next(error);
    }
};



// @desc    Get user's squads
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Find groups where the user is a member
        const groups = await Group.find({ 
            members: req.user._id 
        })
        .populate("members", "displayName username friendCode") // Removed stale 'streak'
        .sort({ createdAt: -1 })
        .lean();

        // 1. Collect all unique member IDs from all groups
        const uniqueMemberIds = new Set<string>();
        // 2. Collect all linked habit IDs
        const uniqueHabitIds = new Set<string>();

        groups.forEach((group: any) => {
            if (group.members && Array.isArray(group.members)) {
                group.members.forEach((member: any) => {
                   if (member._id) uniqueMemberIds.add(member._id.toString());
                });
            }
            if (group.memberHabits && Array.isArray(group.memberHabits)) {
                group.memberHabits.forEach((mh: any) => {
                    if (mh.habit) uniqueHabitIds.add(mh.habit.toString());
                });
            }
        });

        // 2. Fetch Streak documents for all these members
        const streakDocs = await Streak.find({ user: { $in: Array.from(uniqueMemberIds) } });

        // 3. Create a Map for O(1) streak lookup
        const streakMap: { [key: string]: number } = {};
        streakDocs.forEach(doc => {
            streakMap[doc.user.toString()] = doc.streakCount;
        });

        // 4. Fetch Habit documents for linked habits
        const habitDocs = await Habit.find({ _id: { $in: Array.from(uniqueHabitIds) } });
        const habitMap: { [key: string]: { name: string, completedToday: boolean, completions: string[] } } = {};
        
        // Get IST Dates
        const todayIST = getISTDate();
        const dateObj = new Date();
        // Adjust for IST manually if needed or use simple logic since getISTDate returns YYYY-MM-DD
        // Better to parse the String from getISTDate or use ISO
        // If getISTDate uses local time of server if configured to IST, or specific logic?
        // Let's assume getISTDate() returns accurate "today".
        // To get "yesterday", we subtract 1 day.
        // We can parse todayIST string.
        const [y, m, d] = todayIST.split('-').map(Number);
        const yesterdayObj = new Date(y, m - 1, d - 1);
        const yY = yesterdayObj.getFullYear();
        const yM = String(yesterdayObj.getMonth() + 1).padStart(2, '0');
        const yD = String(yesterdayObj.getDate()).padStart(2, '0');
        const yesterdayIST = `${yY}-${yM}-${yD}`;

        habitDocs.forEach(doc => {
            habitMap[doc._id.toString()] = {
                name: doc.name,
                completedToday: doc.completions && doc.completions.includes(todayIST),
                completions: doc.completions || []
            };
        });

        // 5. Inject streak AND linked habit data into the group members AND Update Group Streak
        const groupUpdates = groups.map(async (group: any) => {
            // Create a lookup for member Habits within this group
            const groupMemberHabits: { [userId: string]: string } = {}; // userId -> habitId
            if (group.memberHabits) {
                group.memberHabits.forEach((mh: any) => {
                    groupMemberHabits[mh.user.toString()] = mh.habit.toString();
                });
            }

            let allMembersCompletedToday = true;
            let hasAnyLinkedHabit = false; // If no one has linked habits, streak shouldn't increment

            if (group.members && Array.isArray(group.members)) {
                group.members.forEach((member: any) => {
                    if (!member || !member._id) return;
                    const memberId = member._id.toString();
                    member.streak = streakMap[memberId] || 0;
                    
                    // Check for linked habit
                    const linkedHabitId = groupMemberHabits[memberId];
                    if (linkedHabitId && habitMap[linkedHabitId]) {
                        member.linkedHabit = {
                            name: habitMap[linkedHabitId].name,
                            completedToday: habitMap[linkedHabitId].completedToday
                        };
                        hasAnyLinkedHabit = true;
                        
                        // Check if THIS member completed today
                        if (!habitMap[linkedHabitId].completedToday) {
                            allMembersCompletedToday = false;
                        }
                    } else {
                        member.linkedHabit = null;
                        // Strict Rule: No linked habit = Incomplete
                        allMembersCompletedToday = false;
                    }
                });
            }

            // --- Group Streak Logic ---
            let groupModified = false;
            // 1. Reset Check
            // If last completed date is older than yesterday, streak is broken.
            // But we must handle the case where it might be null (new group).
            if (group.lastCompletedDateIST) {
                if (group.lastCompletedDateIST < yesterdayIST) {
                     // Streak broken
                     if (group.groupStreak !== 0) {
                         group.groupStreak = 0;
                         groupModified = true;
                     }
                }
            }

            // 2. Increment Check
            if (hasAnyLinkedHabit && allMembersCompletedToday) {
                // If we haven't already marked it for today
                if (group.lastCompletedDateIST !== todayIST) {
                    group.groupStreak = (group.groupStreak || 0) + 1;
                    group.lastCompletedDateIST = todayIST;
                    groupModified = true;
                }
            }
            
            // To persist these changes, we need to call save().
            // But 'group' here is a POJO (lean). We need to update the database.
            if (groupModified) {
                await Group.updateOne(
                    { _id: group._id }, 
                    { 
                        groupStreak: group.groupStreak, 
                        lastCompletedDateIST: group.lastCompletedDateIST 
                    }
                );
            }
        });

        await Promise.all(groupUpdates);

        // Add isCreator flag to each group
        const groupsWithCreatorFlag = groups.map((group: any) => {
            const creatorId = typeof group.creator === 'object' ? group.creator._id : group.creator;
            const isCreator = req.user._id.toString() === creatorId.toString();
            return {
                ...group,
                isCreator
            };
        });

        res.json(groupsWithCreatorFlag);
    } catch (error) {
        next(error);
    }
};

// @desc    Link a habit to a squad
// @route   POST /api/groups/link-habit
// @access  Private
export const linkHabitToGroup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId, habitId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            res.status(404).json({ message: "Group not found" });
            return;
        }

        const habit = await Habit.findById(habitId);
        if (!habit) {
            res.status(404).json({ message: "Habit not found" });
            return; 
        }

        // Verify user owns the habit
        if (habit.user.toString() !== req.user._id.toString()) {
            res.status(401).json({ message: "Not authorized to link this habit" });
            return;
        }

        // Verify user is in the group
        if (!group.members.includes(req.user._id)) {
            res.status(400).json({ message: "You are not a member of this squad" });
            return;
        }

        // Initialize memberHabits if missing
        if (!group.memberHabits) {
            group.memberHabits = [];
        }

        // Update or Add entry
        const existingIndex = group.memberHabits.findIndex(mh => mh.user.toString() === req.user._id.toString());
        if (existingIndex > -1) {
            group.memberHabits[existingIndex].habit = habitId;
        } else {
            group.memberHabits.push({ user: req.user._id, habit: habitId });
        }

        await group.save();
        res.status(200).json({ message: "Habit linked successfully" });

    } catch (error) {
        next(error);
    }
}

// @desc    Leave a Squad
// @route   POST /api/groups/leave
// @access  Private
export const leaveGroup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId } = req.body;
        const group = await Group.findById(groupId);

        if (!group) {
            res.status(404).json({ message: "Group not found" });
            return;
        }

        if (group.creator.toString() === req.user._id.toString()) {
             res.status(400).json({ message: "Creator cannot leave the group. You must delete it." });
             return;
        }

        // Remove user from members
        group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
        
        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            res.status(200).json({ message: "Left group successfully. Squad deleted as it is now empty." });
            return;
        }

        await group.save();

        res.status(200).json({ message: "Left group successfully" });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a Squad
// @route   DELETE /api/groups/:groupId
// @access  Private
export const deleteGroup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            res.status(404).json({ message: "Group not found" });
            return;
        }

        if (group.creator.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "Not authorized to delete this group" });
            return;
        }

        await Group.findByIdAndDelete(groupId);
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// @desc    Transfer squad ownership to another member
// @route   PUT /api/groups/:groupId/transfer-ownership
// @access  Private (Creator only)
export const transferOwnership = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId } = req.params;
        const { newCreatorId } = req.body;
        
        if (!newCreatorId) {
            res.status(400).json({ message: "New creator ID is required" });
            return;
        }
        
        const group = await Group.findById(groupId);
        
        if (!group) {
            res.status(404).json({ message: "Squad not found" });
            return;
        }
        
        // Verify current user is the creator
        if (group.creator.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "Only the creator can transfer ownership" });
            return;
        }
        
        // Verify new creator is a member
        const isMember = group.members.some((memberId: any) => memberId.toString() === newCreatorId.toString());
        if (!isMember) {
            res.status(400).json({ message: "New creator must be a squad member" });
            return;
        }
        
        // Prevent transferring to self
        if (newCreatorId.toString() === req.user._id.toString()) {
            res.status(400).json({ message: "You are already the creator" });
            return;
        }
        
        // Update creator
        group.creator = newCreatorId;
        await group.save();
        
        res.json({ message: "Ownership transferred successfully", group });
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to a Squad
// @route   POST /api/groups/add-member
// @access  Private
export const addMemberToGroup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId, memberId } = req.body;
        const group = await Group.findById(groupId);

        if (!group) {
            res.status(404).json({ message: "Group not found" });
            return;
        }

        const groupCapacity = group.capacity || 10;
        if (group.members.length >= groupCapacity) {
            res.status(400).json({ message: `Squad is full (max ${groupCapacity} members)` });
            return;
        }

        if (group.members.includes(memberId)) {
            res.status(400).json({ message: "User is already a member" });
            return;
        }

        group.members.push(memberId);
        await group.save();

        res.status(200).json({ message: "Member added successfully", group });
    } catch (error) {
        next(error);
    }
};

// @desc    Join a Squad by Code
// @route   POST /api/groups/join
// @access  Private
export const joinGroupByCode = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupCode } = req.body;

        if (!groupCode) {
             res.status(400).json({ message: "Group code is required" });
             return;
        }

        const group = await Group.findOne({ groupCode: groupCode.toUpperCase() });

        if (!group) {
            res.status(404).json({ message: "Invalid Squad Code" });
            return;
        }

        const groupCapacity = group.capacity || 10;
        if (group.members.length >= groupCapacity) {
            res.status(400).json({ message: `Squad is full (max ${groupCapacity} members)` });
            return;
        }

        if (group.members.includes(req.user._id)) {
            res.status(400).json({ message: "You are already a member of this squad" });
            return;
        }

        group.members.push(req.user._id);
        await group.save();

        res.status(200).json({ message: "Joined squad successfully", group });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Specific Squad Details
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroupById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId)
            .populate("members", "displayName username friendCode") // Fetch basic member info
            .lean();

        if (!group) {
            res.status(404).json({ message: "Squad not found" });
            return;
        }

        // Calculate Member Streaks (Reusing logic from getUserGroups for consistency)
        // 1. Collect all members
        const memberIds = group.members.map((m: any) => m._id.toString());
        
        // 2. Fetch Streaks
        const streakDocs = await Streak.find({ user: { $in: memberIds } });
        const streakMap: { [key: string]: number } = {};
        streakDocs.forEach(doc => {
            streakMap[doc.user.toString()] = doc.streakCount;
        });

        // 3. Inject streak into members
        if (group.members && Array.isArray(group.members)) {
            group.members.forEach((member: any) => {
                member.streak = streakMap[member._id.toString()] || 0;
            });
            
            // Sort by streak desc
            group.members.sort((a: any, b: any) => (b.streak || 0) - (a.streak || 0));
        }

        // Add isCreator flag
        const creatorId = typeof group.creator === 'object' ? group.creator._id : group.creator;
        const isCreator = req.user._id.toString() === creatorId.toString();
        const groupWithCreatorFlag = {
            ...group,
            isCreator
        };

        res.json(groupWithCreatorFlag);
    } catch (error) {
        next(error);
    }
};
