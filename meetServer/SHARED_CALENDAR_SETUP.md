# Shared Calendar Setup Guide

This guide explains how to configure the Google Meet service to use a shared calendar instead of the service account's primary calendar.

## Why Use a Shared Calendar?

- **Better Organization**: Keep all mentoring sessions in a dedicated calendar
- **Team Access**: Multiple people can view and manage the calendar
- **Professional Appearance**: Events appear in a branded calendar
- **Easier Management**: Centralized control over all mentoring sessions

## Step 1: Create a Shared Calendar

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the "+" button next to "Other calendars" in the left sidebar
3. Select "Create new calendar"
4. Name it something like "B8 Mentoring Sessions"
5. Add a description: "Mentoring platform sessions and meetings"
6. Click "Create calendar"

## Step 2: Get the Calendar ID

1. In Google Calendar, find your new calendar in the left sidebar
2. Click the three dots (...) next to the calendar name
3. Select "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the "Calendar ID" (it will look like: `your-calendar-id@group.calendar.google.com`)

## Step 3: Add Service Account as Editor

1. In the same calendar settings page
2. Scroll to "Share with specific people"
3. Click "Add people"
4. Enter your service account email: `bgr8calendar@resounding-ace-465520-u4.iam.gserviceaccount.com`
5. Set permissions to "Make changes to events"
6. Click "Send"

## Step 4: Update Environment Configuration

1. Open your `.env` file in the `meetServer` directory
2. Add or update the `GOOGLE_CALENDAR_ID` line:

```env
# Google Calendar Configuration
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

3. Save the file

## Step 5: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm start
```

You should see: `📅 Using calendar: your-calendar-id@group.calendar.google.com`

## Step 6: Test the Integration

1. Go to your mentoring platform
2. Create a new booking
3. Click "Auto Create Meet"
4. Check your shared calendar - the event should appear there

## Troubleshooting

### Error: "Failed to generate Google Meet link"

**Possible causes:**
1. Service account doesn't have edit permissions on the calendar
2. Calendar ID is incorrect
3. Calendar doesn't exist or is private

**Solutions:**
1. Double-check the service account email is added as an editor
2. Verify the calendar ID in your `.env` file
3. Make sure the calendar is shared and accessible

### Error: "Calendar not found"

**Solution:**
- Verify the calendar ID is correct
- Ensure the service account has access to the calendar
- Try using `primary` temporarily to test if the service account works

### Events not appearing in shared calendar

**Solutions:**
1. Check the server logs for the calendar ID being used
2. Verify the service account has "Make changes to events" permission
3. Try creating an event manually in the shared calendar to test access

## Calendar ID Examples

- **Primary calendar**: `primary`
- **Shared calendar**: `mentoring-sessions@group.calendar.google.com`
- **Team calendar**: `team@yourdomain.com`
- **Resource calendar**: `conference-room@yourdomain.com`

## Best Practices

1. **Use a dedicated calendar** for mentoring sessions
2. **Set appropriate permissions** - editors can modify, viewers can only see
3. **Regular backups** - export calendar data periodically
4. **Monitor usage** - check calendar settings for any issues
5. **Test regularly** - create test events to ensure everything works

## Security Notes

- The service account only needs calendar edit permissions
- No need for domain-wide delegation for basic calendar operations
- Calendar events are created without sending invitations (as configured)
- Meet links are generated but not automatically shared via email 