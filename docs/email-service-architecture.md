# Email Service Architecture

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Your React App)                             │
│                                                                  │
│  .env.local:                                                    │
│  └── VITE_EMAIL_API_BASE_URL=http://localhost:3001            │
│                                                                  │
│  Admin Portal → Email Management → Send Email                   │
│                        ↓                                         │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ HTTP POST /api/email/send
                         │ Authorization: Bearer <Firebase_ID_Token>
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                                │
│                   (email-server/)                               │
│                                                                  │
│  .env:                                                          │
│  ├── FIREBASE_SERVICE_ACCOUNT=...   (Firebase Admin)             │
│  ├── ZOHO_CLIENT_ID=...             (Zoho credentials)           │
│  ├── ZOHO_CLIENT_SECRET=...                                   │
│  └── ZOHO_REFRESH_TOKEN=...                                   │
│                                                                  │
│  Verifies Firebase ID Token → Admin Role Check → Zoho Token     │
│                        ↓                                         │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ HTTPS POST to Zoho API
                         │ Authorization: Zoho-oauthtoken xyz...
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ZOHO MAIL API                              │
│                   (api.zoho.com)                                │
│                                                                  │
│  Sends email from: info@bgr8.uk                                │
│  To: recipients                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Flow

### Why Two Separate Configurations?

1. **Frontend (.env.local)**
   - Contains ONLY: API URL
   - Safe to use in browser
   - Zoho credentials are NEVER exposed to the browser

2. **Backend (email-server/.env)**
   - Contains: Firebase Admin + Zoho Credentials
   - Runs on server only
   - Zoho credentials stay secure

### Authentication Chain

```
User → Frontend → Firebase ID Token → Backend → Zoho Token → Zoho Mail → Email Sent!
```

## 📦 What You Need to Set Up

### Frontend Configuration (`.env.local`)
```env
VITE_EMAIL_API_BASE_URL=http://localhost:3001    ← Where your backend is
```

### Backend Configuration (`email-server/.env`)
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
ZOHO_CLIENT_ID=1000.ABC123XYZ                   ← From Zoho Console
ZOHO_CLIENT_SECRET=secret123...                  ← From Zoho Console
ZOHO_REFRESH_TOKEN=1000.abc123...               ← From Zoho Console
ZOHO_FROM_EMAIL=info@bgr8.uk                    ← Your email
ZOHO_FROM_NAME=Bgr8 Team                        ← Display name
```

## 🚀 Quick Start

1. Configure Firebase Admin env vars on email server
2. Create `.env.local` with base URL
3. Start backend: `cd email-server && npm start`
4. Start frontend: `npm run dev`
5. Test in Admin Portal!

## ❓ Common Questions

**Q: Why do I need Firebase Auth if I have Zoho credentials?**
A: Firebase Auth ensures only signed-in admin users can use the email server.

**Q: What if a user is not an admin?**
A: The server checks `roles.admin === true` in `users/{uid}` and rejects non-admins.

**Q: Why are there two separate .env files?**
A: One for frontend (safe), one for backend (contains secrets). This keeps Zoho credentials secure!
