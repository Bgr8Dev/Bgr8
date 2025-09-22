import { Timestamp } from 'firebase/firestore';

export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  mentorEmail: string;
  menteeEmail: string;
  day: string;
  startTime: string; // Time slot string (e.g., "09:00")
  endTime: string;   // Time slot string (e.g., "10:00")
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp;
  sessionDate?: Timestamp; // Date of the session
  
  // Session timing as timestamps
  sessionStartTime?: Timestamp; // Full timestamp for session start
  sessionEndTime?: Timestamp;   // Full timestamp for session end
  
  // Session details
  sessionLink?: string; // Google Meet or other video call link
  sessionLocation?: string; // For future branch expansions (in-person, virtual, etc.)
  
  // Cal.com specific fields
  isCalComBooking?: boolean;
  calComBookingId?: string;
  calComEventType?: {
    id: number;
    title: string;
  };
  calComAttendees?: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  
  // Additional fields for analytics
  duration?: number; // in minutes
  revenue?: number;
  
  // Legacy fields for backward compatibility
  meetLink?: string; // Deprecated, use sessionLink instead
  eventId?: string;
  
  // Feedback tracking
  feedbackSubmitted_mentor?: boolean;
  feedbackSubmitted_mentee?: boolean;
  feedbackSubmittedAt_mentor?: Timestamp;
  feedbackSubmittedAt_mentee?: Timestamp;
  
  // Developer mode
  isDeveloperMode?: boolean;
}

// Extend the Booking interface to include generated properties
export interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
  bookingMethod?: string;
}