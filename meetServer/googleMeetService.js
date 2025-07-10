const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

class GoogleMeetService {
  constructor() {
    // Check if environment variables are available
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google service account credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
    }

    // Handle private key formatting - convert \n to actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Additional validation for private key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format. Private key must be in PEM format.');
    }

    try {
      this.auth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: SCOPES,
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      console.log(`📅 Using calendar: ${this.calendarId}`);
    } catch (error) {
      console.error('Error initializing Google Meet Service:', error);
      throw new Error(`Failed to initialize Google Meet Service: ${error.message}`);
    }
  }

  async createMeeting(booking) {
    // Defensive check for required emails
    if (!booking.mentorEmail || !booking.menteeEmail) {
      throw new Error('Mentor or mentee email is missing in booking data.');
    }
    // Parse start and end times
    const sessionDate = new Date(booking.sessionDate);
    const [startHours, startMinutes] = booking.startTime.split(':').map(Number);
    const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const event = {
      summary: `Mentoring Session: ${booking.mentorName} & ${booking.menteeName}`,
      description: `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).

Session Details:
- Date: ${sessionDate.toLocaleDateString('en-GB')}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: 1 hour

This meeting includes Google Meet integration for video conferencing.

Participants:
- Mentor: ${booking.mentorName} (${booking.mentorEmail})
- Mentee: ${booking.menteeName} (${booking.menteeEmail})`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${booking.id}-${Date.now()}`
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 15 } // 15 minutes before
        ]
      }
    };

    try {
      console.log(`📅 Creating event in calendar: ${this.calendarId}`);
      console.log(`📅 Event details: ${event.summary} on ${event.start.dateTime}`);
      
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId, // Uses configured calendar (shared or primary)
        resource: event,
        conferenceDataVersion: 1,
        // Remove sendUpdates to avoid invitation issues
      });

      console.log(`✅ Event created successfully: ${response.data.id}`);

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        console.warn('⚠️ No Meet link found in response. Conference data:', response.data.conferenceData);
        throw new Error('Failed to generate Google Meet link - no video entry point found');
      }

      console.log(`🔗 Meet link generated: ${meetLink}`);

      return {
        meetLink,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Error creating Google Meet meeting:', error);
      
      // Provide more specific error messages
      if (error.code === 404) {
        throw new Error(`Calendar not found: ${this.calendarId}. Please check the calendar ID and ensure the service account has access.`);
      } else if (error.code === 403) {
        throw new Error(`Access denied to calendar: ${this.calendarId}. Please ensure the service account has edit permissions.`);
      } else if (error.message.includes('conferenceData')) {
        throw new Error('Google Meet integration not available for this calendar. Try using a different calendar or check calendar settings.');
      }
      
      throw new Error(`Failed to create Google Meet meeting: ${error.message || 'Unknown error'}`);
    }
  }

  async deleteMeeting(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
        // Remove sendUpdates to avoid invitation issues
      });
    } catch (error) {
      console.error('Error deleting Google Meet meeting:', error);
      throw new Error(`Failed to delete Google Meet meeting: ${error.message || 'Unknown error'}`);
    }
  }

  async updateMeeting(eventId, booking) {
    // Defensive check for required emails
    if (!booking.mentorEmail || !booking.menteeEmail) {
      throw new Error('Mentor or mentee email is missing in booking data.');
    }
    // Parse start and end times
    const sessionDate = new Date(booking.sessionDate);
    const [startHours, startMinutes] = booking.startTime.split(':').map(Number);
    const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const event = {
      summary: `Mentoring Session: ${booking.mentorName} & ${booking.menteeName}`,
      description: `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).

Session Details:
- Date: ${sessionDate.toLocaleDateString('en-GB')}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: 1 hour

This meeting includes Google Meet integration for video conferencing.

Participants:
- Mentor: ${booking.mentorName} (${booking.mentorEmail})
- Mentee: ${booking.menteeName} (${booking.menteeEmail})`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 15 } // 15 minutes before
        ]
      }
    };

    try {
      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event,
        // Remove sendUpdates to avoid invitation issues
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        throw new Error('Failed to get Google Meet link from updated event');
      }

      return {
        meetLink,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error updating Google Meet meeting:', error);
      throw new Error(`Failed to update Google Meet meeting: ${error.message || 'Unknown error'}`);
    }
  }
}

module.exports = { GoogleMeetService }; 