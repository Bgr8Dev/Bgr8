import { Timestamp } from 'firebase/firestore';

export interface Session {
  id: string;
  bookingId: string;           // Reference to original booking
  mentorId: string;
  menteeId: string;
  sessionDate: Timestamp;      // Date-only format
  startTime: Timestamp;        // Full timestamp
  endTime: Timestamp;          // Full timestamp
  sessionLink: string;         // Google Meet link
  sessionLocation: string;     // Virtual, in-person, etc.
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Feedback tracking
  feedbackSubmitted_mentor: boolean;
  feedbackSubmitted_mentee: boolean;
}

export interface SessionFeedback {
  feedbackId: string;
  giverUserId: string;
  receiverUserId: string | null;  // null for self-feedback
  submittedAt: Timestamp;
  feedbackType: 'mentor' | 'mentee' | 'self';
}

export interface FeedbackQuestion {
  questionId: string;
  question: string;
  response: string;
  notes: string;
  questionType: 'rating' | 'text' | 'multiple-choice';
}

export interface FeedbackFormData {
  giverUserId: string;
  receiverUserId: string | null;
  feedbackType: 'mentor' | 'mentee' | 'self';
  questions: FeedbackQuestion[];
}
