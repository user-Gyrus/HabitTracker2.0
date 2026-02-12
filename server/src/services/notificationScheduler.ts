import cron from "node-cron";
import webpush from "web-push";
import User from "../models/User";
import Streak from "../models/Streak";
import Notification from "../models/Notification";
import { getISTDate, getYesterdayISTDate } from "../utils/dateUtils";

// Morning quotes (8:00 AM)
const morningQuotes = [
  "Be the person you want to become — start today.",
  "New day. One small win is enough.",
  "Show up once today. That's how it starts.",
  "Keep the momentum going.",
  "What you do today compounds.",
  "Start with one habit. The rest can wait.",
  "Today's goal is simple: show up.",
  "Consistency beats motivation. Begin.",
  "A good day starts with a small action.",
  "You don't need perfect — just progress.",
];

// Afternoon quotes (2:00 PM)
const afternoonQuotes = [
  "Still time to win the day ⏰ Complete your pending habits!",
  "Halfway through the day — don't let your streak slip away.",
  "Quick check-in: Have you completed your habits today?",
  "Your future self will thank you. Finish what you started.",
  "Small actions now = big results later. Keep going! 💪",
];

// Night quotes (8:00 PM)
const nightQuotes = [
  "Your friends checked in today 🔥 It's your turn.",
  "End the day on a win. Finish your habits.",
  "One last push today keeps the momentum alive.",
];

// Track which quotes were used recently to avoid repetition
let lastMorningQuoteIndex = -1;
let lastAfternoonQuoteIndex = -1;
let lastNightQuoteIndex = -1;

// Get a random quote, avoiding the last one if possible
function getRandomQuote(quotes: string[], lastIndex: number): { quote: string; index: number } {
  if (quotes.length === 1) {
    return { quote: quotes[0], index: 0 };
  }

  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * quotes.length);
  } while (newIndex === lastIndex && quotes.length > 1);

  return { quote: quotes[newIndex], index: newIndex };
}

// Send push notification to all subscribed users
export async function sendNotificationToAll(title: string, body: string) {
  try {
    const users = await User.find({ pushSubscription: { $exists: true, $ne: null } });

    console.log(`Sending "${title}" notification to ${users.length} subscribed users...`);

    const sendPromises = users.map(async (user) => {
      if (!user.pushSubscription) return;

      const pushSubscription = {
        endpoint: user.pushSubscription.endpoint,
        keys: {
          p256dh: user.pushSubscription.keys.p256dh,
          auth: user.pushSubscription.keys.auth,
        },
      };

      const payload = JSON.stringify({
        title,
        body,
        // Use absolute URL for the icon - this resolves the "white circle" issue
        // Android requires a monochrome icon for the small icon (badge)
        icon: "https://atomiq.club/pwa-192x192.png", 
        badge: "https://atomiq.club/badge-96x96.png",
        vibrate: [100, 50, 100],
        data: {
          url: "https://atomiq.club"
        }
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        console.error(`Failed to send notification to user ${user.username}:`, error.message);

        // If subscription is invalid (410 Gone), remove it
        if (error.statusCode === 410) {
          console.log(`Removing invalid subscription for user ${user.username}`);
          user.pushSubscription = undefined;
          await user.save();
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`Notification sending complete.`);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}

// Schedule morning notification (8:00 AM IST)
export function scheduleMorningNotification() {
  // 8:00 AM IST explicitly
  cron.schedule("0 8 * * *", () => {
    (async () => {
      const { quote, index } = getRandomQuote(morningQuotes, lastMorningQuoteIndex);
      lastMorningQuoteIndex = index;

      console.log(`[${new Date().toISOString()}] Sending morning notification: "${quote}"`);
      await sendNotificationToAll("Good Morning! 🌅", quote);
    })().catch(err => console.error("Error in morning notification:", err));
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  } as any);

  console.log("Morning notification scheduled for 8:00 AM IST");
}

// Schedule night notification (8:00 PM IST)
export function scheduleNightNotification() {
  // 8:00 PM IST explicitly
  cron.schedule("0 20 * * *", () => {
    (async () => {
      const { quote, index } = getRandomQuote(nightQuotes, lastNightQuoteIndex);
      lastNightQuoteIndex = index;

      console.log(`[${new Date().toISOString()}] Sending night notification: "${quote}"`);
      await sendNotificationToAll("Time to Check In! 🌙", quote);
    })().catch(err => console.error("Error in night notification:", err));
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  } as any);

  console.log("Night notification scheduled for 8:00 PM IST");
}

// Schedule afternoon reminder (2:00 PM IST)
export function scheduleAfternoonReminder() {
  // 2:00 PM IST explicitly
  cron.schedule("0 14 * * *", () => {
    (async () => {
      const { quote, index } = getRandomQuote(afternoonQuotes, lastAfternoonQuoteIndex);
      lastAfternoonQuoteIndex = index;

      console.log(`[${new Date().toISOString()}] Sending afternoon reminder: "${quote}"`);
      await sendNotificationToAll("Afternoon Check-In ⏰", quote);
    })().catch(err => console.error("Error in afternoon notification:", err));
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  } as any);

  console.log("Afternoon reminder scheduled for 2:00 PM IST");
}

// Generate Social Notifications (Incomplete Habits / Lost Streak)
export async function generateDailyNotifications() {
    try {
        const currentIST = getISTDate();
        const yesterdayIST = getYesterdayISTDate(currentIST); // "Yesterday" relative to now (00:05 AM) -> The day that just finished
        const dayBeforeYesterdayIST = getYesterdayISTDate(yesterdayIST);

        console.log(`Analyzing activity for Yesterday: ${yesterdayIST}`);

        // Fetch all users with friends
        const users = await User.find({ "friends.0": { $exists: true } }).populate("friends");

        for (const user of users) {
             // Skip if no friends
             if (!user.friends || user.friends.length === 0) continue;

            // For each friend of this user, check their status
            for (const friend of user.friends) {
                try {
                    const friendStreak = await Streak.findOne({ user: friend._id });
                    if (!friendStreak) continue;

                    // 1. Check for INCOMPLETE HABITS
                    // Condition: Friend has an ember day on "Yesterday"
                    // Ember day means they did > 0% but < 100%
                    if (friendStreak.emberDays && friendStreak.emberDays.includes(yesterdayIST)) {
                        
                        // Avoid duplicates
                        const existing = await Notification.findOne({
                            recipient: user._id as any,
                            type: 'incomplete_habits',
                            "data.friendId": friend._id.toString(),
                            "data.date": yesterdayIST // One per day
                        });

                        if (!existing) {
                            await Notification.create({
                                recipient: user._id,
                                type: 'incomplete_habits',
                                data: {
                                    friendId: friend._id,
                                    friendName: friend.displayName,
                                    friendCode: friend.friendCode,
                                    date: yesterdayIST
                                }
                            });
                        }
                    }

                    // 2. Check for LOST STREAK
                    // Condition:
                    // - No activity Yesterday (Not in history, Not in emberDays, Not in frozenDays)
                    // - Was active DayBeforeYesterday (In history OR In emberDays? No, usually streak means History)
                    // - Streak WAS > 0 (implied if DayBeforeYesterday was active 100%)
                    
                    const lastDate = friendStreak.lastCompletedDateIST;
                    // Check if they completed yesterday
                    const completedYesterday = friendStreak.history.includes(yesterdayIST);
                    const frozenYesterday = friendStreak.frozenDays && friendStreak.frozenDays.includes(yesterdayIST);
                    
                    if (!completedYesterday && !frozenYesterday) {
                        // They missed yesterday. Did they have a streak before that?
                        // If their last completion was DayBeforeYesterday, then yes, they just lost it.
                        if (lastDate === dayBeforeYesterdayIST && friendStreak.streakCount > 0) {
                             
                             // Avoid duplicates
                            const existing = await Notification.findOne({
                                recipient: user._id as any,
                                type: 'lost_streak',
                                "data.friendId": friend._id.toString(),
                                "data.date": yesterdayIST
                            });

                            if (!existing) {
                                await Notification.create({
                                    recipient: user._id,
                                    type: 'lost_streak',
                                    data: {
                                        friendId: friend._id,
                                        friendName: friend.displayName,
                                        friendCode: friend.friendCode,
                                        count: friendStreak.streakCount,
                                        date: yesterdayIST
                                    }
                                });
                            }
                        }
                    }

                } catch (err) {
                    console.error(`Error processing friend ${friend._id} for user ${user._id}:`, err);
                }
            } // end for friends
        } // end for users
        
        console.log(" Daily social notifications generated.");

    } catch (error) {
        console.error("Error generating daily notifications:", error);
    }
}

// Initialize notification scheduler
export function initializeNotificationScheduler() {
  // Configure web-push with VAPID keys
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:support@atomiq.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("⚠️  VAPID keys not configured. Push notifications will not work.");
    console.warn("Please add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env file");
    return;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  scheduleMorningNotification();
  scheduleAfternoonReminder();
  scheduleNightNotification();

  // Schedule Daily Social Notifications (00:05 AM IST)
  cron.schedule("5 0 * * *", () => {
    (async () => {
      console.log(`[${new Date().toISOString()}] Generating daily social notifications...`);
      await generateDailyNotifications();
    })().catch(err => console.error("Error in daily social notifications:", err));
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  } as any);

  console.log("✅ Push notification scheduler initialized");
}
