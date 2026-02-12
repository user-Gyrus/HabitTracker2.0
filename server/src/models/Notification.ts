import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId; // User who sees this
  type: 'incomplete_habits' | 'lost_streak';
  data: {
    friendId: string;
    friendName: string;
    friendCode?: string;
    count?: number; // e.g. streak length lost
    date: string; // YYYY-MM-DD of the event
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ['incomplete_habits', 'lost_streak'],
      required: true,
    },
    data: {
        friendId: { type: String, required: true },
        friendName: { type: String, required: true },
        friendCode: { type: String },
        count: { type: Number },
        date: { type: String, required: true }
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-expire notifications after 3 days to keep DB clean
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 259200 }); 

const Notification = model<INotification>("Notification", NotificationSchema);
export default Notification;
