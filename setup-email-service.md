# Quick Email Service Setup Guide

## Step 1: Generate API Key

Run this command to generate a secure API key:

```bash
# Windows PowerShell
$apiKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
echo "Your API Key: $apiKey"

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated key - you'll use it in both frontend and backend.

## Step 2: Configure Frontend

1. Create `.env.local` in the main project root:
```env
VITE_EMAIL_API_BASE_URL=http://localhost:3001
VITE_EMAIL_API_KEY=paste_your_generated_api_key_here
```

## Step 3: Configure Backend

1. Navigate to email-server folder and create `.env`:
```bash
cd email-server
copy env.example .env
```

2. Edit `email-server/.env` with your actual credentials:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Zoho Mail Configuration (from Zoho Developer Console)
ZOHO_CLIENT_ID=paste_your_zoho_client_id_here
ZOHO_CLIENT_SECRET=paste_your_zoho_client_secret_here
ZOHO_REFRESH_TOKEN=paste_your_zoho_refresh_token_here
ZOHO_FROM_EMAIL=info@bgr8.uk
ZOHO_FROM_NAME=Bgr8 Team

# API Security (use the same key from Step 1)
API_KEY=paste_your_generated_api_key_here
```

## Step 4: Install and Start Backend

```bash
# In email-server folder
npm install
npm start
```

You should see:
```
Email server running on port 3001
Health check: http://localhost:3001/api/health
```

## Step 5: Test Configuration

1. Open your browser to http://localhost:3001/api/health
2. You should see: `{"status":"ok",...}`

## Step 6: Start Frontend

```bash
# In main project folder
npm run dev
```

## Step 7: Test Email Sending

1. Go to Admin Portal → Email Management
2. The configuration warning should be gone
3. Try composing and sending a test email

## Troubleshooting

### "Email API not configured" error
- Make sure `.env.local` exists in your main project folder
- Check that `VITE_EMAIL_API_BASE_URL` and `VITE_EMAIL_API_KEY` are set

### Backend server won't start
- Make sure you're in the `email-server` folder
- Check that `.env` file exists with all required variables
- Verify Node.js is installed: `node --version`

### Emails not sending
- Check that the backend server is running
- Verify Zoho credentials are correct in `email-server/.env`
- Check backend server logs for errors

## File Locations

```
Bgr8Website/
├── .env.local                    ← Frontend config (create this)
├── env.local.example             ← Frontend template
└── email-server/
    ├── .env                      ← Backend config (create this)
    └── env.example               ← Backend template
```

## Security Notes

- **Never commit `.env` or `.env.local` files to Git**
- Use different API keys for development and production
- Zoho credentials should ONLY be in backend `.env`
- Frontend only needs API URL and API key
