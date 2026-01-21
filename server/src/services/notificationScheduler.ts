import cron from "node-cron";
import webpush from "web-push";
import User from "../models/User";

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

  console.log("✅ Push notification scheduler initialized");
}
