import { Request, Response } from "express";
import Notification from "../models/Notification";

// @desc    Get current user's unread/recent notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to recent ones

    res.json(notifications);

    // Optionally mark as read after fetching? 
    // Usually better to have explicit "mark read" action or just auto-read on view.
    // For this MVP, we just fetch.
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsRead = async (req: any, res: Response): Promise<void> => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
