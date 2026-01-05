import { firestore } from '../../../../firebase/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { loggers } from '../../../../utils/logger';

// Always use production Cal.com proxy server
const CALCOM_API_BASE = 'https://bgr8-cal-server.onrender.com';

// Interface for Cal.com API key storage
export interface CalComApiKeyData {
  mentorUid: string;
  apiKey: string;
  calComUsername: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface for Cal.com booking creation
export interface CalComBookingRequest {
  eventTypeId: number;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  attendeeName: string;
  attendeeEmail: string;
  timeZone: string;
  language: string;
  metadata?: Record<string, string | number | boolean>;
}

// Interface for Cal.com booking response
export interface CalComBookingResponse {
  id: string | number;
  uid: string;
  startTime: string;
  endTime: string;
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED';
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  eventType: {
    id: number;
    title: string;
  };
  paymentInfo?: {
    id: string;
    link?: string;
    reason?: string;
  };
  createdAt: string;
  metadata?: {
    videoCallUrl?: string;
    [key: string]: unknown;
  };
  references?: Array<{
    type: string;
    meetingUrl?: string;
    meetingId?: string;
    meetingPassword?: string;
    [key: string]: unknown;
  }>;
  location?: string;
}

// Interface for Cal.com event types
export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number; // in minutes
  description?: string;
  hidden: boolean;
  price: number;
  currency: string;
  slotInterval?: number;
  minimumBookingNotice?: number;
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
  seatsPerTimeSlot?: number;
  seatsShowAttendees?: boolean;
}

// Interface for Cal.com availability
export interface CalComAvailability {
  date: string; // YYYY-MM-DD format
  slots: Array<{
    time: string; // HH:MM format
    available: boolean;
    eventTypeId?: number;
    eventTypeTitle?: string;
  }>;
}

// Interface for Cal.com availability request
export interface CalComAvailabilityRequest {
  username: string;
  dateFrom: string; // YYYY-MM-DD format
  dateTo: string; // YYYY-MM-DD format
  eventTypeId?: number;
}

// Interface for Cal.com availability response
export interface CalComAvailabilityResponse {
  busy: Array<{
    start: string; // ISO 8601 format
    end: string; // ISO 8601 format
  }>;
  timezone: string;
}

// Interface for Cal.com working hours
export interface CalComWorkingHours {
  [dayOfWeek: number]: Array<{
    start: string; // HH:MM format
    end: string; // HH:MM format
  }>;
}

// Interface for Cal.com schedule
export interface CalComSchedule {
  id: number;
  name: string;
  timezone: string;
  workingHours: CalComWorkingHours;
  dateOverrides: Array<{
    date: string; // YYYY-MM-DD format
    workingHours: CalComWorkingHours;
  }>;
}

// Interface for Cal.com event type with availability
export interface CalComEventTypeWithAvailability extends CalComEventType {
  scheduleId: number;
  schedule?: CalComSchedule;
}

// Secure API key storage functions
export class CalComTokenManager {
  private static readonly COLLECTION_NAME = 'calcomTokens';

  // Store a mentor's Cal.com API key securely
  static async storeApiKey(
    mentorUid: string,
    apiKey: string,
    calComUsername: string
  ): Promise<void> {
    try {
      const apiKeyData: CalComApiKeyData = {
        mentorUid,
        apiKey,
        calComUsername,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(doc(firestore, this.COLLECTION_NAME, mentorUid), apiKeyData);
      loggers.booking.log(`Cal.com API key stored for mentor: ${mentorUid}`);
    } catch (error) {
      loggers.booking.error('Error storing Cal.com API key:', error);
      throw new Error('Failed to store Cal.com API key securely');
    }
  }

  // Retrieve a mentor's Cal.com API key
  static async getApiKeyData(mentorUid: string): Promise<CalComApiKeyData | null> {
    try {
      const apiKeyDoc = await getDoc(doc(firestore, this.COLLECTION_NAME, mentorUid));
      if (!apiKeyDoc.exists()) {
        return null;
      }
      return apiKeyDoc.data() as CalComApiKeyData;
    } catch (error) {
      loggers.booking.error('Error retrieving Cal.com API key:', error);
      return null;
    }
  }

  // Update API key (if needed)
  static async updateApiKey(
    mentorUid: string,
    apiKey: string
  ): Promise<void> {
    try {
      await updateDoc(doc(firestore, this.COLLECTION_NAME, mentorUid), {
        apiKey,
        updatedAt: Timestamp.now()
      });
      loggers.booking.log(`Cal.com API key updated for mentor: ${mentorUid}`);
    } catch (error) {
      loggers.booking.error('Error updating Cal.com API key:', error);
      throw new Error('Failed to update Cal.com API key');
    }
  }

  // Remove a mentor's Cal.com API key
  static async removeApiKey(mentorUid: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, this.COLLECTION_NAME, mentorUid));
      loggers.booking.log(`Cal.com API key removed for mentor: ${mentorUid}`);
    } catch (error) {
      loggers.booking.error('Error removing Cal.com API key:', error);
      throw new Error('Failed to remove Cal.com API key');
    }
  }

  // Check if a mentor has a stored Cal.com API key
  static async hasApiKey(mentorUid: string): Promise<boolean> {
    const apiKeyData = await this.getApiKeyData(mentorUid);
    return apiKeyData !== null;
  }
}

// Cal.com API service
export class CalComService {
  private static async getApiKey(mentorUid: string): Promise<{ apiKey: string; calComUsername: string }> {
    const apiKeyData = await CalComTokenManager.getApiKeyData(mentorUid);
    if (!apiKeyData) {
      throw new Error('No Cal.com API key found for this mentor');
    }
    return { apiKey: apiKeyData.apiKey, calComUsername: apiKeyData.calComUsername };
  }

  // Get mentor's event types
  static async getEventTypes(mentorUid: string): Promise<CalComEventType[]> {
    try {
      const { apiKey, calComUsername } = await this.getApiKey(mentorUid);
      const url = `${CALCOM_API_BASE}/event-types?username=${calComUsername}&apiKey=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.event_types || [];
    } catch (error) {
      loggers.booking.error('Error fetching Cal.com event types:', error);
      throw error;
    }
  }

  // Create a booking
  static async createBooking(
    mentorUid: string,
    bookingRequest: CalComBookingRequest
  ): Promise<CalComBookingResponse> {
    try {
      const { apiKey, calComUsername } = await this.getApiKey(mentorUid);
      const response = await fetch(`${CALCOM_API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...bookingRequest,
          username: calComUsername
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cal.com booking failed: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }
      const data = await response.json();
      return data.booking;
    } catch (error) {
      loggers.booking.error('Error creating Cal.com booking:', error);
      throw error;
    }
  }

  // Cancel a booking
  static async cancelBooking(
    mentorUid: string,
    bookingId: string,
    reason?: string
  ): Promise<void> {
    try {
      const { apiKey } = await this.getApiKey(mentorUid);
      const response = await fetch(`${CALCOM_API_BASE}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        throw new Error(`Cal.com cancellation failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      loggers.booking.error('Error canceling Cal.com booking:', error);
      throw error;
    }
  }

  // Get mentor's bookings
  static async getBookings(
    mentorUid: string,
    startTime?: string,
    endTime?: string
  ): Promise<CalComBookingResponse[]> {
    try {
      const { apiKey, calComUsername } = await this.getApiKey(mentorUid);
      
      // Cal.com API v2 uses different parameter names - try both formats
      // Format 1: With date range parameters
      let url = `${CALCOM_API_BASE}/bookings?username=${calComUsername}&apiKey=${encodeURIComponent(apiKey)}`;
      if (startTime) {
        // Try different parameter names that Cal.com might accept
        url += `&startTime=${encodeURIComponent(startTime)}`;
        url += `&start=${encodeURIComponent(startTime)}`;
      }
      if (endTime) {
        url += `&endTime=${encodeURIComponent(endTime)}`;
        url += `&end=${encodeURIComponent(endTime)}`;
      }
      
      loggers.booking.log('📡 Fetching Cal.com bookings:', {
        url: url.replace(apiKey, '***'),
        startTime,
        endTime,
        username: calComUsername
      });
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      loggers.booking.log('📡 Cal.com API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        loggers.booking.error('❌ Cal.com API error response:', errorText);
        
        // If date parameters cause issues, try without them
        if (response.status === 400 && (startTime || endTime)) {
          loggers.booking.warn('⚠️ Date parameters may not be supported, trying without date filter...');
          const fallbackUrl = `${CALCOM_API_BASE}/bookings?username=${calComUsername}&apiKey=${encodeURIComponent(apiKey)}`;
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            loggers.booking.log('✅ Fallback request succeeded, filtering bookings by date range in code');
            
            // Filter bookings by date range manually
            let bookings = this.parseBookingsResponse(fallbackData);
            if (startTime || endTime) {
              const start = startTime ? new Date(startTime) : null;
              const end = endTime ? new Date(endTime) : null;
              bookings = bookings.filter(booking => {
                const bookingStart = new Date(booking.startTime);
                if (start && bookingStart < start) return false;
                if (end && bookingStart > end) return false;
                return true;
              });
            }
            loggers.booking.log(`📋 Filtered to ${bookings.length} bookings within date range`);
            return bookings;
          }
        }
        
        throw new Error(`Cal.com API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const bookings = this.parseBookingsResponse(data);
      
      loggers.booking.log(`📋 Parsed ${bookings.length} bookings from Cal.com API`);
      
      return bookings;
    } catch (error) {
      loggers.booking.error('Error fetching Cal.com bookings:', error);
      throw error;
    }
  }

  // Helper method to parse bookings response in different formats
  private static parseBookingsResponse(data: unknown): CalComBookingResponse[] {
    loggers.booking.log('📡 Cal.com API response data structure:', {
      hasBookings: !!(data as { bookings?: unknown }).bookings,
      bookingsType: Array.isArray((data as { bookings?: unknown }).bookings) ? 'array' : typeof (data as { bookings?: unknown }).bookings,
      bookingsLength: Array.isArray((data as { bookings?: unknown }).bookings) ? (data as { bookings: unknown[] }).bookings.length : 'N/A',
      dataKeys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
      isArray: Array.isArray(data)
    });
    
    // Log the full structure for debugging
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      loggers.booking.log('📡 Full response structure:', {
        topLevelKeys: Object.keys(dataObj),
        hasData: !!dataObj.data,
        dataType: typeof dataObj.data,
        dataIsArray: Array.isArray(dataObj.data),
        dataKeys: dataObj.data && typeof dataObj.data === 'object' && dataObj.data !== null 
          ? Object.keys(dataObj.data as Record<string, unknown>) 
          : 'N/A',
        dataValue: dataObj.data
      });
    }
    
    // Handle different response formats
    let bookings: CalComBookingResponse[] = [];
    if (Array.isArray(data)) {
      // Response is directly an array
      bookings = data as CalComBookingResponse[];
    } else if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      
      // Check for direct bookings array
      if (Array.isArray(dataObj.bookings)) {
        bookings = dataObj.bookings as CalComBookingResponse[];
      }
      // Check for data.bookings (nested structure)
      else if (dataObj.data && typeof dataObj.data === 'object' && dataObj.data !== null) {
        const innerData = dataObj.data as Record<string, unknown>;
        if (Array.isArray(innerData.bookings)) {
          bookings = innerData.bookings as CalComBookingResponse[];
        } else if (Array.isArray(innerData)) {
          // data.data is directly an array
          bookings = innerData as CalComBookingResponse[];
        }
      }
      // Check if data property is directly an array
      else if (Array.isArray(dataObj.data)) {
        bookings = dataObj.data as CalComBookingResponse[];
      }
      
      if (bookings.length === 0) {
        loggers.booking.warn('⚠️ Unexpected Cal.com API response format - no bookings found:', {
          response: data,
          structure: JSON.stringify(data, null, 2)
        });
      }
    }
    
    return bookings;
  }

  // Get mentor's availability for a specific date range
  static async getAvailability(
    mentorUid: string,
    dateFrom: string,
    dateTo: string
  ): Promise<CalComAvailability[]> {
    try {
      const { apiKey, calComUsername } = await this.getApiKey(mentorUid);
      
      // First, get the mentor's event types to understand their schedules
      const eventTypes = await this.getEventTypes(mentorUid);
      
      // Get availability for each event type
      const availabilityPromises = eventTypes.map(async (eventType) => {
        try {
          const url = `${CALCOM_API_BASE}/availability?username=${calComUsername}&dateFrom=${dateFrom}&dateTo=${dateTo}&eventTypeId=${eventType.id}&apiKey=${encodeURIComponent(apiKey)}`;
          
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            loggers.booking.warn(`Failed to get availability for event type ${eventType.id}: ${response.status}`);
            return null;
          }
          
          const data: CalComAvailabilityResponse = await response.json();
          
          // Convert busy times to availability slots
          const availability = this.convertBusyTimesToAvailability(
            data.busy,
            dateFrom,
            dateTo,
            eventType
          );
          
          return availability;
        } catch (error) {
          loggers.booking.error(`Error fetching availability for event type ${eventType.id}:`, error);
          return null;
        }
      });
      
      const availabilities = await Promise.all(availabilityPromises);
      return availabilities.filter(Boolean).flat() as CalComAvailability[];
    } catch (error) {
      loggers.booking.error('Error fetching Cal.com availability:', error);
      throw error;
    }
  }

  // Get mentor's schedules
  static async getSchedules(mentorUid: string): Promise<CalComSchedule[]> {
    try {
      const { apiKey, calComUsername } = await this.getApiKey(mentorUid);
      const url = `${CALCOM_API_BASE}/schedules?username=${calComUsername}&apiKey=${encodeURIComponent(apiKey)}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.schedules || [];
    } catch (error) {
      loggers.booking.error('Error fetching Cal.com schedules:', error);
      throw error;
    }
  }

  // Convert Cal.com busy times to availability slots
  private static convertBusyTimesToAvailability(
    busyTimes: Array<{ start: string; end: string }>,
    dateFrom: string,
    dateTo: string,
    eventType: CalComEventType
  ): CalComAvailability[] {
    const availabilities: CalComAvailability[] = [];
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    
    // Generate slots for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate time slots for this day (assuming 30-minute intervals)
      const slots: Array<{
        time: string;
        available: boolean;
        eventTypeId?: number;
        eventTypeTitle?: string;
      }> = [];
      
      // Generate slots from 9 AM to 6 PM (adjust as needed)
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`${dateStr}T${timeStr}:00`);
          const slotEnd = new Date(slotStart.getTime() + eventType.length * 60 * 1000);
          
          // Check if this slot conflicts with any busy times
          const isBusy = busyTimes.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return slotStart < busyEnd && slotEnd > busyStart;
          });
          
          slots.push({
            time: timeStr,
            available: !isBusy,
            eventTypeId: eventType.id,
            eventTypeTitle: eventType.title
          });
        }
      }
      
      availabilities.push({
        date: dateStr,
        slots
      });
    }
    
    return availabilities;
  }
}

// Utility functions for Cal.com integration
export const CalComUtils = {
  // Extract username from Cal.com URL
  extractUsernameFromUrl: (calComUrl: string): string | null => {
    try {
      const url = new URL(calComUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      return pathParts[0] || null;
    } catch (error) {
      loggers.booking.error('Error extracting Cal.com username:', error);
      return null;
    }
  },

  // Validate Cal.com URL format
  isValidCalComUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('cal.com') || parsedUrl.hostname.includes('cal.dev');
    } catch {
      return false;
    }
  },

  // Format booking time for Cal.com API
  formatBookingTime: (date: Date): string => {
    return date.toISOString();
  },

  // Parse Cal.com booking time
  parseBookingTime: (isoString: string): Date => {
    return new Date(isoString);
  }
};

export default CalComService; 