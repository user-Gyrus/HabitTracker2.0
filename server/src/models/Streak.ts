import { Schema, model, Document } from "mongoose";

export interface IStreak extends Document {
  user: any; // Relaxed from Schema.Types.ObjectId to avoid type conflicts with populated/unpopulated fields
  username: string;
  streakCount: number;
  lastCompletedDate?: Date; // Timestamp of update
  lastCompletedDateIST?: string; // YYYY-MM-DD
  history: string[]; // Array of YYYY-MM-DD (100% completion days)
  streakFreezes: number;
  frozenDays: string[]; // Days recovered using streak freeze feature
  streakState: 'active' | 'frozen' | 'extinguished'; // Current streak status
  emberDays: string[]; // Array of YYYY-MM-DD (partial completion days)
  completionPercentage?: number; // Today's completion percentage (0-100)
}

const StreakSchema = new Schema<IStreak>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Output 1 streak doc per user
    },
    username: {
      type: String,
      required: true,
    },
    streakCount: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: Date,
      default: null,
    },
    lastCompletedDateIST: {
      type: String, // format YYYY-MM-DD
      default: null,
    },
    history: {
      type: [String], // Array of date strings (100% completion)
      default: [],
    },
    streakFreezes: {
      type: Number,
      default: 0,
    },
    frozenDays: {
      type: [String], // Dates where freeze was used
      default: [],
    },
    streakState: {
      type: String,
      enum: ['active', 'frozen', 'extinguished'],
      default: 'extinguished',
    },
    emberDays: {
      type: [String], // Dates with partial completion (1-99%)
      default: [],
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const Streak = model<IStreak>("Streak", StreakSchema);
export default Streak;
