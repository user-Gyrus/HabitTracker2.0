# Test Friends Seeding Instructions

## Overview
Created an admin endpoint to seed test friend accounts with dummy habits for testing the friend habits modal feature.

## Endpoint Details
- **URL**: `POST /api/admin/seed-friends`
- **Authentication**: Required (uses your JWT token)
- **Description**: Creates 3 test friend accounts with habits and adds them to your friends list

## Test Friends Created

### 1. Alex Runner 🏃
- **Username**: `testfriend1`
- **Email**: `testfriend1@test.com`
- **Habits**:
  - Morning Run (build) - 3 completions, 30 days duration
  - Read Books (build) - 1 completion, 21 days duration

### 2. Sam Fitness 💪
- **Username**: `testfriend2`
- **Email**: `testfriend2@test.com`
- **Habits**:
  - Gym Workout (build) - 4 completions, 60 days duration
  - Quit Smoking (break) - 2 completions, 90 days duration

### 3. Jordan Coder 💻
- **Username**: `testfriend3`
- **Email**: `testfriend3@test.com`
- **Habits**:
  - Code Daily (build) - 15 completions, 100 days duration
  - No Social Media (break) - 1 completion, 30 days duration

## How to Use

### Option 1: Using Browser Console (Easiest)
1. Open your browser and go to your habit tracker app
2. Make sure you're logged in as the admin user
3. Open Developer Tools (F12)
4. Go to the Console tab
5. Paste and run this code:

```javascript
fetch('/api/admin/seed-friends', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### Option 2: Using Postman/Thunder Client
1. Create a new POST request
2. URL: `http://localhost:5000/api/admin/seed-friends`
3. Headers:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
4. Send the request

### Option 3: Using curl
```bash
curl -X POST http://localhost:5000/api/admin/seed-friends \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## What Happens
1. Creates 3 test user accounts (or updates if they already exist)
2. Creates public habits for each test user with various completion statuses
3. Adds all test users to your friends list
4. Adds you to their friends list (mutual friendship)
5. Creates streak data for each test user

## Testing the Friend Habits Modal
After running the seed endpoint:
1. Go to the Social tab
2. You should see 3 new friends in your friends list
3. Click on any friend card to open the habits modal
4. You'll see their public habits with:
   - Progress indicators (e.g., "3/30", "15/100")
   - Build/break type badges (💪 or 🚫)
   - Completion checkmarks for today's completed habits
   - Different completion states to test various scenarios

## Notes
- All test accounts use password: `testpass123`
- All habits are set to public visibility
- The endpoint is idempotent - running it multiple times will update existing test accounts
- Test friends will have realistic completion data spread across multiple days
