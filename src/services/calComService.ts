export interface CalComBooking {
  id?: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  mentorEmail: string;
  menteeEmail: string;
  calComUrl: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

export interface CalComEvent {
  eventTypeId: number;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

export interface CalComEventType {
  id: number;
  slug: string;
  title: string;
  description?: string;
}

export class CalComService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    // Use local proxy for development, production proxy for production
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    this.baseUrl = baseUrl || (isLocal ? 'http://localhost:4000' : 'https://bgr8-cal-server.onrender.com');
  }

  /**
   * Create a booking through Cal.com API
   */
  async createBooking(booking: CalComBooking): Promise<CalComBooking> {
    try {
      // Extract the username from the Cal.com URL
      const urlMatch = booking.calComUrl.match(/https?:\/\/([^.]+)\.cal\.com\/(.+)/);
      if (!urlMatch) {
        throw new Error('Invalid Cal.com URL format');
      }

      const username = urlMatch[1];
      const eventTypeSlug = urlMatch[2];

      // Get event type ID from the slug
      const eventTypeId = await this.getEventTypeId(username, eventTypeSlug);

      const eventData: CalComEvent = {
        eventTypeId,
        startTime: `${booking.sessionDate}T${booking.startTime}:00.000Z`,
        endTime: `${booking.sessionDate}T${booking.endTime}:00.000Z`,
        attendeeName: booking.menteeName,
        attendeeEmail: booking.menteeEmail,
        notes: `Mentoring session with ${booking.mentorName}. ${booking.notes || ''}`
      };

      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        ...booking,
        id: result.booking.id,
        meetingLink: result.booking.meetingLink,
        status: 'confirmed'
      };
    } catch (error) {
      console.error('Error creating Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Get event type ID from username and slug
   */
  private async getEventTypeId(username: string, eventTypeSlug: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/event-types?username=${username}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event types: ${response.statusText}`);
      }

      const eventTypes = await response.json();
      const eventType = eventTypes.event_types.find((et: CalComEventType) => et.slug === eventTypeSlug);
      
      if (!eventType) {
        throw new Error(`Event type not found: ${eventTypeSlug}`);
      }

      return eventType.id;
    } catch (error) {
      console.error('Error fetching event type ID:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel booking: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error canceling Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<CalComBooking | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch booking: ${response.statusText}`);
      }

      const result = await response.json();
      return result.booking;
    } catch (error) {
      console.error('Error fetching Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Validate Cal.com URL format
   */
  static validateCalComUrl(url: string): boolean {
    const calComPattern = /^https?:\/\/[^.]+\.cal\.com\/.+$/;
    return calComPattern.test(url);
  }

  /**
   * Extract username from Cal.com URL
   */
  static extractUsername(url: string): string | null {
    const match = url.match(/https?:\/\/([^.]+)\.cal\.com\//);
    return match ? match[1] : null;
  }

  /**
   * Extract event type slug from Cal.com URL
   */
  static extractEventTypeSlug(url: string): string | null {
    const match = url.match(/https?:\/\/[^.]+\.cal\.com\/(.+)/);
    return match ? match[1] : null;
  }
}

// Export a default instance (you'll need to configure this with your API key)
// In Vite, environment variables are accessed via import.meta.env
export const calComService = new CalComService(import.meta.env.VITE_CAL_COM_API_KEY || ''); 