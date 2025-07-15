import { Timestamp } from 'firebase/firestore';

export interface TeamMember {
  uid: string;
  role: 'captain' | 'player';
  joinedAt: Timestamp;
  name: string;
  position?: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string; // UID of captain
  members: TeamMember[];
  createdAt: Timestamp;
  isPreset: boolean;
}

export interface Match {
  id: string;
  homeTeam: string; // Team ID
  awayTeam: string; // Team ID
  date: Timestamp;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  score?: {
    home: number;
    away: number;
  };
}

export interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  location: string;
}

// Feedback system interfaces
export interface SessionFeedback {
  id: string;
  bookingId: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  sessionDate: Date;
  feedbackType: 'mentor' | 'mentee';
  submittedBy: string; // UID of person giving feedback
  submittedAt: Date;
  
  // Feedback questions (1-5 scale where 1=Poor, 5=Excellent)
  helpfulness: number; // How helpful and engaged has your mentor been during your sessions?
  comfort: number; // Do you feel comfortable talking to your mentor and asking questions?
  support: number; // Have you felt supported and understood in your mentorship?
  
  // Open text responses
  strengths: string; // What's one thing your mentor does well?
  improvements: string; // What's one thing your mentor could do to better support you?
  learnings: string; // What's one thing you've gained or learned from this mentorship so far?
  
  // Additional metadata
  overallRating: number; // Calculated average of numerical ratings
  isAnonymous: boolean;
  status: 'submitted' | 'reviewed' | 'archived';
  
  // Cal.com support
  isCalComBooking?: boolean;
  calComBookingId?: string;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  feedbackByMentor: Record<string, {
    totalSessions: number;
    totalFeedback: number;
    averageRating: number;
    strengths: string[];
    improvements: string[];
  }>;
  feedbackByMentee: Record<string, {
    totalSessions: number;
    totalFeedback: number;
    averageRating: number;
    learnings: string[];
  }>;
  recentFeedback: SessionFeedback[];
} 