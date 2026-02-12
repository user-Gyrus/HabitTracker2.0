# Atomiq v2 🚀
**"Don't Break the Chain"**

Atomiq is the premium, gamified habit tracker designed to help you build and sustain positive habits through social accountability and powerful visualization. Built as a Progressive Web App (PWA), it offers a native-app-like experience across all your devices.

## 🔥 Key Features

### 1. Habit Management
*   **Flexible Tracking:** Create daily habits with custom schedules (specific days of the week).
*   **Duration Challenges:** Set habits for specific durations (e.g., "21 Days to Break", "66 Days to Build").
*   **Micro-Habits:** Breakdown large goals into small, actionable "micro-identities".
*   **Visual History:** View your completion history with calendar-like tick marks.

### 2. Gamification & Streaks
*   **Streak System:** Keep your fire burning! Visual streak counters and animations reward consistency.
*   **Achievements:** Unlock badges and milestones (e.g., "Streak Ignited") as you progress.
*   **Levels:** Gain XP for every completion and level up your profile.

### 3. Social Squads 🤝
*   **Build Together:** Create or join "Squads" to track habits with friends.
*   **Invite System:** Easily invite friends via unique friend codes or direct share links.
*   **Leaderboards:** See who's carrying the boats and who's slacking off.
*   **Accountability:** Social pressure done right.

### 4. Premium Experience
*   **PWA Support:** Install directly to your home screen. Works offline and feels like a native app.
*   **Beautiful UI:** Glassmorphism design, smooth `Framer Motion` animations, and a polished dark/light mode.
*   **Mental Models:** Daily rotating motivational quotes to keep your mindset sharp.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React (TypeScript) + Vite
*   **Styling:** TailwindCSS + CSS Variables (Theming)
*   **Animations:** Framer Motion
*   **Icons:** Lucide React
*   **PWA:** Vite Plugin PWA
*   **State Management:** React Context + Local Storage (Session)

### Backend
*   **Runtime:** Node.js + Express
*   **Database:** MongoDB Atlas (Mongoose)
*   **Authentication:** Passport.js (Google OAuth 2.0 + Local Strategy) & JWT
*   **Security:** CORS, Bcrypt (Password Hashing)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas)

### 1. Installation
Clone the repository and install dependencies for both frontend and backend.

```bash
# Install Root (Frontend) Dependencies
npm install

# Install Server Dependencies
cd server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory with the following variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/habit-tracker # Or your Atlas URL
JWT_SECRET=your_super_secret_key
SESSION_SECRET=another_secret_key
CLIENT_URL=http://localhost:5173

# Google OAuth (Optional for local testing if using email auth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3. Running the App
You can run both the frontend and backend with a single command from the **root directory**:

```bash
# Runs Frontend (Vite) and Backend (Nodemon) concurrently
npm run dev
```

*   **Frontend:** `http://localhost:5173`
*   **Backend:** `http://localhost:5000`

---

## 📱 PWA Installation
1.  Open the app in Chrome/Safari on your mobile device.
2.  Tap "Share" (iOS) or the Menu (Android).
3.  Select **"Add to Home Screen"**.
4.  Launch Atomiq as a standalone app!

---

## 🤝 Contributing
Built with ❤️ by the Atomiq Team
