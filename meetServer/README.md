# Meet Server

Backend server for Google Meet integration with the mentoring platform. This server handles creating, updating, and deleting Google Meet meetings through the Google Calendar API.

## Features

- ✅ Create real Google Meet meetings with calendar events
- ✅ Automatic email notifications to participants
- ✅ Meeting reminders (24 hours and 15 minutes before)
- ✅ Fallback to calendar event links when API is not configured
- ✅ RESTful API endpoints
- ✅ CORS enabled for frontend integration
- ✅ Health check endpoint

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create Service Account credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"
5. Generate a key for the service account:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose "JSON" format
   - Download the JSON file

### 3. Environment Variables

Create a `.env` file in the root of the meetServer directory:

```bash
cp env.example .env
```

Edit the `.env` file with your Google service account credentials:

```env
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Server Configuration
PORT=3001
```

**Important**: Copy the `client_email` and `private_key` from your downloaded JSON file.

### 4. Start the Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and Google Meet API configuration status.

### Create Meeting
```
POST /api/create-meeting
```
Creates a new Google Meet meeting.

**Request Body:**
```json
{
  "booking": {
    "id": "booking-123",
    "mentorName": "John Doe",
    "menteeName": "Jane Smith",
    "sessionDate": "2024-01-15T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "eventId": "event_id_123",
  "htmlLink": "https://calendar.google.com/event?eid=...",
  "method": "google-meet-api"
}
```

### Delete Meeting
```
DELETE /api/delete-meeting/:eventId
```
Deletes a Google Meet meeting.

### Update Meeting
```
PUT /api/update-meeting/:eventId
```
Updates an existing Google Meet meeting.

## Integration with Frontend

The frontend can call these endpoints to create real Google Meet meetings. When the Google Meet API is not configured, the server falls back to creating calendar event links.

## Error Handling

The server includes comprehensive error handling:
- Missing environment variables
- Invalid booking data
- Google API errors
- Network errors

All errors are logged and returned with appropriate HTTP status codes.

## Security

- Service account credentials are stored as environment variables
- CORS is configured for frontend integration
- Input validation on all endpoints
- Error messages don't expose sensitive information

## Troubleshooting

### "Google Meet Service not configured"
- Check that your `.env` file exists and has the correct credentials
- Verify the service account email and private key are correct
- Ensure the Google Calendar API is enabled in your Google Cloud project

### "Failed to generate Google Meet link"
- Check that your service account has the necessary permissions
- Verify the calendar ID is correct (defaults to 'primary')
- Check the Google Cloud Console for any API quotas or restrictions

### CORS errors
- The server is configured to allow all origins in development
- For production, configure CORS with specific origins 