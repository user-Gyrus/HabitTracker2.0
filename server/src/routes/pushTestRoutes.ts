import { Router, Request, Response } from "express";
import webpush from "web-push";
import User from "../models/User";

const router = Router();

/**
 * Test endpoint to send push notification immediately
 * DELETE THIS BEFORE PRODUCTION!
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    // Get all subscribed users
    const users = await User.find({ pushSubscription: { $exists: true, $ne: null } });
    
    if (users.length === 0) {
      return res.json({ success: false, message: "No subscribed users found" });
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      if (!user.pushSubscription) {
        console.log(`⚠️ Skipping ${user.username || user.email} - no subscription`);
        continue;
      }

      const payload = JSON.stringify({
        title: 'Test Notification 🔔',
        body: 'This is a manual test notification from the server!',
        icon: '/pwa-192x192.png',
        badge: '/badge-96x96.png',
        url: '/'
      });

      try {
        await webpush.sendNotification(user.pushSubscription, payload);
        console.log(`✅ Sent test notification to ${user.username || user.email}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to send to ${user.username || user.email}:`, error.message);
        failCount++;
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          user.pushSubscription = undefined;
          await user.save();
          console.log(`🗑️ Removed expired subscription for ${user.username || user.email}`);
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Sent to ${successCount} users, ${failCount} failed`,
      details: { successCount, failCount, totalUsers: users.length }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notifications' });
  }
});

export default router;
