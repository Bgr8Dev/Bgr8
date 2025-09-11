import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc,
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { Session } from '../types/sessions';
import { Booking } from '../types/bookings';

export interface MentorFeedbackEligibility {
  mentorId: string;
  mentorName: string;
  sessionId: string;
  bookingId: string;
  sessionDate: Date;
  canProvideFeedback: boolean;
  feedbackAlreadySubmitted: boolean;
}

export interface MenteeFeedbackSummary {
  totalCompletedSessions: number;
  eligibleForFeedback: MentorFeedbackEligibility[];
  feedbackSubmitted: number;
  pendingFeedback: number;
}

export class MentorFeedbackService {
  private static readonly SESSIONS_COLLECTION = 'sessions';
  private static readonly BOOKINGS_COLLECTION = 'bookings';
  private static readonly FEEDBACK_COLLECTION = 'feedback';

  /**
   * Get all mentors that a mentee has completed sessions with and can provide feedback for
   */
  static async getMenteeFeedbackEligibility(menteeId: string): Promise<MentorFeedbackEligibility[]> {
    try {
      // Get all completed sessions where the mentee participated
      const sessionsQuery = query(
        collection(firestore, this.SESSIONS_COLLECTION),
        where('menteeId', '==', menteeId),
        where('status', '==', 'completed'),
        orderBy('sessionDate', 'desc')
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const eligibleMentors: MentorFeedbackEligibility[] = [];

      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionData = sessionDoc.data() as Session;
        
        // Check if mentee has already submitted feedback for this session
        const feedbackQuery = query(
          collection(firestore, this.FEEDBACK_COLLECTION),
          where('bookingId', '==', sessionData.bookingId),
          where('submittedBy', '==', menteeId),
          where('feedbackType', '==', 'mentor')
        );

        const feedbackSnapshot = await getDocs(feedbackQuery);
        const feedbackAlreadySubmitted = !feedbackSnapshot.empty;

        // Get mentor name from booking
        let mentorName = 'Unknown Mentor';
        try {
          const bookingDoc = await getDoc(doc(firestore, this.BOOKINGS_COLLECTION, sessionData.bookingId));
          
          if (bookingDoc.exists()) {
            const bookingData = bookingDoc.data() as Booking;
            mentorName = bookingData.mentorName;
          }
        } catch (error) {
          console.warn('Could not fetch mentor name for session:', sessionData.bookingId);
        }

        eligibleMentors.push({
          mentorId: sessionData.mentorId,
          mentorName,
          sessionId: sessionDoc.id,
          bookingId: sessionData.bookingId,
          sessionDate: sessionData.sessionDate.toDate(),
          canProvideFeedback: true, // If session is completed, mentee can provide feedback
          feedbackAlreadySubmitted
        });
      }

      return eligibleMentors;
    } catch (error) {
      console.error('Error fetching mentee feedback eligibility:', error);
      throw new Error('Failed to fetch feedback eligibility');
    }
  }

  /**
   * Get a summary of mentee's feedback status
   */
  static async getMenteeFeedbackSummary(menteeId: string): Promise<MenteeFeedbackSummary> {
    try {
      const eligibleMentors = await this.getMenteeFeedbackEligibility(menteeId);
      
      const totalCompletedSessions = eligibleMentors.length;
      const feedbackSubmitted = eligibleMentors.filter(m => m.feedbackAlreadySubmitted).length;
      const pendingFeedback = eligibleMentors.filter(m => !m.feedbackAlreadySubmitted).length;

      return {
        totalCompletedSessions,
        eligibleForFeedback: eligibleMentors,
        feedbackSubmitted,
        pendingFeedback
      };
    } catch (error) {
      console.error('Error fetching mentee feedback summary:', error);
      throw new Error('Failed to fetch feedback summary');
    }
  }

  /**
   * Check if a mentee can provide feedback for a specific mentor
   */
  static async canMenteeProvideFeedback(menteeId: string, mentorId: string): Promise<boolean> {
    try {
      const eligibility = await this.getMenteeFeedbackEligibility(menteeId);
      return eligibility.some(mentor => 
        mentor.mentorId === mentorId && 
        mentor.canProvideFeedback && 
        !mentor.feedbackAlreadySubmitted
      );
    } catch (error) {
      console.error('Error checking mentee feedback eligibility:', error);
      return false;
    }
  }

  /**
   * Get the most recent session between a mentee and mentor for feedback
   */
  static async getRecentSessionForFeedback(menteeId: string, mentorId: string): Promise<MentorFeedbackEligibility | null> {
    try {
      const eligibility = await this.getMenteeFeedbackEligibility(menteeId);
      const mentorSessions = eligibility.filter(mentor => 
        mentor.mentorId === mentorId && 
        !mentor.feedbackAlreadySubmitted
      );
      
      // Return the most recent session
      return mentorSessions.length > 0 ? mentorSessions[0] : null;
    } catch (error) {
      console.error('Error fetching recent session for feedback:', error);
      return null;
    }
  }
}
