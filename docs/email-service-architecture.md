# Email Service Architecture

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Your React App)                             │
│                                                                  │
│  .env.local:                                                    │
│  ├── VITE_EMAIL_API_BASE_URL=http://localhost:3001            │
│  └── VITE_EMAIL_API_KEY=abc123...                             │
│                                                                  │
│  Admin Portal → Email Management → Send Email                   │
│                        ↓                                         │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ HTTP POST /api/email/send
                         │ Authorization: Bearer abc123...
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                                │
│                   (email-server/)                               │
│                                                                  │
│  .env:                                                          │
│  ├── API_KEY=abc123...              (Same as frontend!)       │
│  ├── ZOHO_CLIENT_ID=...             (Zoho credentials)        │
│  ├── ZOHO_CLIENT_SECRET=...                                   │
│  └── ZOHO_REFRESH_TOKEN=...                                   │
│                                                                  │
│  Validates API Key → Gets Zoho Access Token                    │
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
   - Contains ONLY: API URL and API Key
   - Safe to use in browser
   - Zoho credentials are NEVER exposed to the browser

2. **Backend (email-server/.env)**
   - Contains: API Key + Zoho Credentials
   - Runs on server only
   - Zoho credentials stay secure

### Authentication Chain

```
User → Frontend → API Key → Backend → Zoho Token → Zoho Mail → Email Sent!
```

## 📦 What You Need to Set Up

### Frontend Configuration (`.env.local`)
```env
VITE_EMAIL_API_BASE_URL=http://localhost:3001    ← Where your backend is
VITE_EMAIL_API_KEY=abc123xyz789...               ← Shared secret key
```

### Backend Configuration (`email-server/.env`)
```env
API_KEY=abc123xyz789...                          ← Same as frontend!
ZOHO_CLIENT_ID=1000.ABC123XYZ                   ← From Zoho Console
ZOHO_CLIENT_SECRET=secret123...                  ← From Zoho Console
ZOHO_REFRESH_TOKEN=1000.abc123...               ← From Zoho Console
ZOHO_FROM_EMAIL=info@bgr8.uk                    ← Your email
ZOHO_FROM_NAME=Bgr8 Team                        ← Display name
```

## 🚀 Quick Start

1. Generate API key: `node generate-api-key.js`
2. Create `.env.local` with API key
3. Add same API key to `email-server/.env`
4. Start backend: `cd email-server && npm start`
5. Start frontend: `npm run dev`
6. Test in Admin Portal!

## ❓ Common Questions

**Q: Why do I need an API key if I have Zoho credentials?**
A: The API key protects your backend. Without it, anyone could use your email server!

**Q: Where do I get the API key from?**
A: You generate it yourself using `generate-api-key.js` or any secure random string generator.

**Q: Can I use the same key for both development and production?**
A: No! Generate different keys for different environments.

**Q: What if someone steals my API key?**
A: Generate a new one and update both `.env.local` and `email-server/.env`.

**Q: Why are there two separate .env files?**
A: One for frontend (safe), one for backend (contains secrets). This keeps Zoho credentials secure!
