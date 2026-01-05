# Cal.com Webhook Setup Guide

This guide explains how to set up Cal.com webhooks to automatically save bookings made through the embedded Cal.com integration to your system.

## Overview

When users book sessions through the embedded Cal.com iframe in `CalComModal`, those bookings are created in Cal.com but weren't being saved to your Firestore database. This webhook integration solves that by:

1. Receiving webhook events from Cal.com when bookings are created
2. Finding the mentor by matching their Cal.com URL
3. Finding the mentee by their email address
4. Saving the booking to Firestore
5. Creating a corresponding session record

## Prerequisites

1. Backend server running (`email-server`)
2. Firebase project configured
3. Cal.com account with webhook capability

## Setup Steps

### 1. Install Dependencies

In the `email-server` directory, install the new dependency:

```bash
cd email-server
npm install
```

This will install `firebase-admin` which is required for writing to Firestore.

### 2. Configure Firebase Admin

You need to set up Firebase Admin SDK to allow the backend server to write to Firestore.

#### Option A: Service Account (Recommended for Production)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely
6. Add the entire JSON content to your `.env` file as `FIREBASE_SERVICE_ACCOUNT`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

**Note:** The entire JSON should be on one line. You can use a tool to minify it or escape it properly.

#### Option B: Default Credentials (For Google Cloud Environments)

If your server is running on Google Cloud (Cloud Run, App Engine, etc.), you can use default credentials:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 3. Configure Cal.com Webhook

1. Log in to your Cal.com account
2. Go to Settings > Webhooks (or Developer > Webhooks)
3. Click "Add Webhook" or "Create Webhook"
4. Configure the webhook:
   - **Event**: Select "Booking Created" or "booking.created"
   - **URL**: `https://your-backend-domain.com/api/webhooks/calcom`
     - For local development: `http://localhost:3001/api/webhooks/calcom`
     - For production: `https://your-production-domain.com/api/webhooks/calcom`
   - **Secret**: Generate a secure random string (at least 32 characters)
5. Copy the webhook secret

### 4. Update Environment Variables

Add the webhook secret to your `.env` file:

```env
CALCOM_WEBHOOK_SECRET=your_secure_webhook_secret_here
```

### 5. Restart the Server

Restart your backend server to load the new configuration:

```bash
npm start
# or for development
npm run dev
```

## Testing the Webhook

### 1. Test Webhook Endpoint

You can test if the endpoint is accessible:

```bash
curl -X POST http://localhost:3001/api/webhooks/calcom \
  -H "Content-Type: application/json" \
  -d '{"triggerEvent":"BOOKING_CREATED","payload":{"booking":{"id":"123"}}}'
```

### 2. Create a Test Booking

1. Open the Cal.com modal in your application
2. Complete a booking through the embedded iframe
3. Check the server logs for webhook processing
4. Verify the booking appears in Firestore under the `bookings` collection

### 3. Verify in Firestore

Check that the booking was saved:

- Collection: `bookings`
- Fields to check:
  - `calComBookingId`: Should match the Cal.com booking ID
  - `mentorId`: Should be the mentor's user ID
  - `menteeId`: Should be the mentee's user ID
  - `status`: Should be "confirmed"
  - `bookingMethod`: Should be "calcom"

## How It Works

1. **Webhook Receives Event**: When a booking is created in Cal.com, Cal.com sends a POST request to `/api/webhooks/calcom`

2. **Signature Verification**: If `CALCOM_WEBHOOK_SECRET` is set, the webhook verifies the request signature for security

3. **Find Mentor**: The webhook searches all users' `mentorProgram/profile` documents to find a mentor whose `calCom` URL matches the organizer's Cal.com username

4. **Find Mentee**: The webhook searches for a user whose email matches the attendee's email and who has `isMentee: true`

5. **Save Booking**: Creates a document in the `bookings` collection with all booking details

6. **Create Session**: If both mentor and mentee are found, also creates a document in the `sessions` collection

## Troubleshooting

### Webhook Not Receiving Events

1. **Check Cal.com Webhook Configuration**: Ensure the webhook URL is correct and accessible
2. **Check Server Logs**: Look for incoming webhook requests in server logs
3. **Test Endpoint**: Use curl or Postman to test if the endpoint is accessible
4. **Check Firewall**: Ensure your server allows incoming POST requests

### Mentor Not Found

- **Check Cal.com URL Format**: Ensure mentors have their Cal.com URL stored correctly in their profile
- **Check Username Match**: The webhook matches by extracting the username from the Cal.com URL. Ensure the format matches (e.g., `https://cal.com/username` or `https://username.cal.com`)
- **Check Logs**: The server logs will show which username it's looking for and which URLs it's checking

### Mentee Not Found

- **Check Email Match**: The webhook matches mentees by email address. Ensure:
  - The email in Cal.com matches the email in the user's Firestore document
  - The user has `isMentee: true` in their `mentorProgram/profile` document
- **Case Sensitivity**: Email matching is case-insensitive, but ensure there are no extra spaces

### Booking Not Saved

- **Check Firebase Admin**: Ensure Firebase Admin is properly initialized (check server startup logs)
- **Check Permissions**: Ensure the service account has write permissions to Firestore
- **Check Logs**: Server logs will show detailed error messages

### Duplicate Bookings

The webhook checks for existing bookings by `calComBookingId` before creating a new one. If you see duplicates:

- Check if the booking ID format is consistent
- Check server logs to see if the duplicate check is working

## Security Considerations

1. **Webhook Secret**: Always use a strong, random secret for `CALCOM_WEBHOOK_SECRET`
2. **HTTPS**: In production, always use HTTPS for webhook endpoints
3. **Rate Limiting**: The endpoint is protected by rate limiting (100 requests per 15 minutes)
4. **Signature Verification**: The webhook verifies the signature if `CALCOM_WEBHOOK_SECRET` is set

## Webhook Event Types

Currently, the webhook only processes `BOOKING_CREATED` events. Other event types (like `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`) are ignored but can be added in the future.

## Production Deployment

When deploying to production:

1. Set `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID` in your production environment
2. Set `CALCOM_WEBHOOK_SECRET` in your production environment
3. Update the Cal.com webhook URL to point to your production server
4. Test the webhook with a real booking
5. Monitor server logs for any errors

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the webhook endpoint manually
4. Check Firestore permissions for the service account

