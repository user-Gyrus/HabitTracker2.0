import { Request, Response } from "express";
import User from "../models/User";

// Subscribe to push notifications
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      res.status(400).json({ message: "User ID and subscription are required" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Save push subscription to user
    user.pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await user.save();

    res.status(200).json({ message: "Subscribed to push notifications successfully" });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Remove push subscription
    user.pushSubscription = undefined;
    await user.save();

    res.status(200).json({ message: "Unsubscribed from push notifications successfully" });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

import { sendNotificationToAll } from "../services/notificationScheduler";

// Send test notification
export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Triggering test notification...");
    await sendNotificationToAll("Test Notification 🔔", "This is a test notification from your localhost server!");
    res.status(200).json({ message: "Test notifications sent" });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};
