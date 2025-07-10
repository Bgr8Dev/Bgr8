import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface MeetingData {
  meetLink: string;
  eventId: string;
  htmlLink: string;
}

export interface BookingData {
  id: string;
  mentorName: string;
  menteeName: string;
  sessionDate: Date;
  startTime: string;
  endTime: string;
}

export class GoogleMeetService {
  private auth: JWT;
  private calendar: ReturnType<typeof google.calendar>;

  constructor() {
    // Check if environment variables are available
    const serviceAccountEmail = process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.REACT_APP_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google service account credentials not configured. Please set REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL and REACT_APP_GOOGLE_PRIVATE_KEY environment variables.');
    }

    this.auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createMeeting(booking: BookingData): Promise<MeetingData> {
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

This meeting includes Google Meet integration for video conferencing.`,
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
          requestId: `meeting-${booking.id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      attendees: [
        { email: `${booking.mentorName.toLowerCase().replace(/\s+/g, '.')}@example.com`, displayName: booking.mentorName },
        { email: `${booking.menteeName.toLowerCase().replace(/\s+/g, '.')}@example.com`, displayName: booking.menteeName }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 15 } // 15 minutes before
        ]
      }
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send email notifications to attendees
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entry: { entryPointType: string; uri?: string }) => entry.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      return {
        meetLink,
        eventId: response.data.id!,
        htmlLink: response.data.htmlLink!
      };
    } catch (error) {
      console.error('Error creating Google Meet meeting:', error);
      throw new Error(`Failed to create Google Meet meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteMeeting(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });
    } catch (error) {
      console.error('Error deleting Google Meet meeting:', error);
      throw new Error(`Failed to delete Google Meet meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMeeting(eventId: string, booking: BookingData): Promise<MeetingData> {
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

This meeting includes Google Meet integration for video conferencing.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/London',
      },
      attendees: [
        { email: `${booking.mentorName.toLowerCase().replace(/\s+/g, '.')}@example.com`, displayName: booking.mentorName },
        { email: `${booking.menteeName.toLowerCase().replace(/\s+/g, '.')}@example.com`, displayName: booking.menteeName }
      ],
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
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all',
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entry: { entryPointType: string; uri?: string }) => entry.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        throw new Error('Failed to get Google Meet link from updated event');
      }

      return {
        meetLink,
        eventId: response.data.id!,
        htmlLink: response.data.htmlLink!
      };
    } catch (error) {
      console.error('Error updating Google Meet meeting:', error);
      throw new Error(`Failed to update Google Meet meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Fallback function for when API is not configured
export const createCalendarEventLink = (booking: BookingData): string => {
  const sessionDate = new Date(booking.sessionDate);
  const [startHours, startMinutes] = booking.startTime.split(':').map(Number);
  const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
  
  const startTime = new Date(sessionDate);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(sessionDate);
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const eventTitle = `Mentoring Session: ${booking.mentorName} & ${booking.menteeName}`;
  const eventDescription = `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).

Session Details:
- Date: ${sessionDate.toLocaleDateString('en-GB')}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: 1 hour

This meeting will include Google Meet integration.`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(eventDescription)}&add=true`;
}; 