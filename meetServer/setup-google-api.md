# Google API Setup Guide

Follow these steps to get your Google API credentials for the Meet Server:

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "Mentoring Platform")
5. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - **Service account name**: `meet-server`
   - **Service account ID**: Will auto-generate
   - **Description**: `Service account for Google Meet integration`
4. Click "Create and Continue"
5. Skip the optional steps (click "Continue" and "Done")

## Step 4: Generate Service Account Key

1. Click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Click "Create"
6. The JSON file will download automatically

## Step 5: Extract Credentials

Open the downloaded JSON file. You'll see something like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "meet-server@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Step 6: Create Environment File

1. In the `meetServer` directory, create a `.env` file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=meet-server@your-project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   PORT=3001
   ```

   **Important**: 
   - Copy the `client_email` value from the JSON file
   - Copy the `private_key` value from the JSON file (including the quotes and \n characters)

## Step 7: Test the Setup

1. Start the server:
   ```bash
   npm start
   ```

2. Check the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

   You should see:
   ```json
   {
     "status": "OK",
     "googleMeetConfigured": true,
     "timestamp": "2024-01-15T10:00:00.000Z"
   }
   ```

## Troubleshooting

### "Google Meet Service not configured"
- Check that your `.env` file exists
- Verify the email and private key are correct
- Make sure there are no extra spaces or characters

### "Failed to generate Google Meet link"
- Ensure the Google Calendar API is enabled
- Check that your service account has the necessary permissions
- Verify the calendar ID (defaults to 'primary')

### Permission Errors
- The service account needs access to create calendar events
- Make sure the Google Calendar API is enabled in your project

## Security Notes

- Never commit your `.env` file to version control
- Keep your service account key secure
- Consider using environment variables in production
- The service account has limited permissions (only calendar access) 