# Email Service Setup - Quick Fix

## 🚨 The Problem
Your frontend was looking for Zoho credentials that should **only** be in the backend server. This has been fixed!

## ✅ The Solution
The frontend now only needs:
1. Email API URL (where your backend server is)
2. API Key (for authentication with the backend)

**Zoho credentials stay safely in the backend server only!**

## 📝 Setup Instructions

### Step 1: Generate API Key
Run this command:
```bash
node generate-api-key.js
```

Or manually generate one:
```bash
# PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the generated key!** You'll need it for both frontend and backend.

### Step 2: Configure Frontend (.env.local)

Create a file called `.env.local` in your main project folder (where package.json is):

```env
VITE_EMAIL_API_BASE_URL=http://localhost:3001
VITE_EMAIL_API_KEY=your_generated_api_key_from_step_1
```

### Step 3: Verify Backend Configuration

Make sure your `email-server/.env` file has:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Your Zoho credentials from Zoho Developer Console
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_FROM_EMAIL=info@bgr8.uk
ZOHO_FROM_NAME=Bgr8 Team

# Same API key from Step 1
API_KEY=your_generated_api_key_from_step_1
```

### Step 4: Start Both Services

**Terminal 1 - Backend Server:**
```bash
cd email-server
npm install    # First time only
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 5: Test It

1. Go to your admin portal: http://localhost:5173/admin
2. Navigate to Email Management
3. You should see **NO** configuration errors now!
4. Try sending a test email

## 🔍 What Files Were Changed

1. **`src/config/emailConfig.ts`** - Now only checks frontend requirements (API URL and API key)
2. **`env.local.example`** - Template for frontend environment variables
3. **`generate-api-key.js`** - Helper script to generate secure API keys

## 📁 File Structure

```
Bgr8Website/
├── .env.local                    ← CREATE THIS (frontend config)
├── env.local.example             ← Template
├── generate-api-key.js           ← Helper script
└── email-server/
    ├── .env                      ← ALREADY EXISTS (backend config)
    └── env.example               ← Template
```

## ⚠️ Important Notes

1. **`.env.local`** is for frontend - create it in the main project folder
2. **`email-server/.env`** is for backend - you already have this set up
3. Use the **same API key** in both files
4. **Never commit** `.env` or `.env.local` files to Git

## ✔️ Checklist

- [ ] Generate API key using `generate-api-key.js`
- [ ] Create `.env.local` in main project folder
- [ ] Add `VITE_EMAIL_API_BASE_URL=http://localhost:3001` to `.env.local`
- [ ] Add `VITE_EMAIL_API_KEY=your_key` to `.env.local`
- [ ] Verify `email-server/.env` has all Zoho credentials
- [ ] Add same `API_KEY=your_key` to `email-server/.env`
- [ ] Start backend server: `cd email-server && npm start`
- [ ] Start frontend: `npm run dev`
- [ ] Test in Admin Portal → Email Management

## 🆘 Still Having Issues?

### Error: "Email API not configured"
- Check that `.env.local` exists in the **main project folder** (not in email-server)
- Restart your frontend dev server after creating `.env.local`

### Error: "Cannot connect to email server"
- Make sure the backend server is running in `email-server` folder
- Check that the URL matches: `http://localhost:3001`

### Backend server errors
- Verify all Zoho credentials are correct in `email-server/.env`
- Check that PORT is set to 3001
