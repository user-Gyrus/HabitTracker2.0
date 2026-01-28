import { Schema, model, Types } from "mongoose";

export interface IGroup {
  name: string;
  groupCode: string; // Added groupCode
  members: Types.ObjectId[];
  creator: Types.ObjectId;
  trackingType: "shared" | "individual";
  duration: number;
  avatar: string; // Emoji
  description: string;
  createdAt: Date;
  isActive: boolean;
  groupStreak: number;
  lastGroupCompletedDate: Date | null;
  memberHabits: { user: Types.ObjectId, habit: Types.ObjectId }[];
  lastCompletedDateIST?: string | null;
  // New Fields
  groupType: "social" | "staked";
  isPrivate: boolean;
  capacity: number;
  stakeAmount?: number;
  startDate?: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    groupCode: { type: String, required: true, unique: true, uppercase: true }, // Added groupCode definition
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trackingType: {
        type: String,
        enum: ["shared", "individual"],
        default: "shared"
    },
    duration: { type: Number, required: true },
    avatar: { type: String, default: "🚀" },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    groupStreak: { type: Number, default: 0 },
    lastGroupCompletedDate: { type: Date, default: null },
    memberHabits: [
        {
            user: { type: Schema.Types.ObjectId, ref: "User" },
            habit: { type: Schema.Types.ObjectId, ref: "Habit" }
        }
    ],
    lastCompletedDateIST: { type: String, default: null },
    // New Fields Definitions
    groupType: { type: String, enum: ["social", "staked"], default: "social" },
    isPrivate: { type: Boolean, default: true },
    capacity: { type: Number, default: 10 },
    stakeAmount: { type: Number },
    startDate: { type: Date }
  },
  { timestamps: true }
);

const Group = model<IGroup>("Group", GroupSchema);
export default Group;
