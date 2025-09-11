import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export interface DeveloperMentor {
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  industry?: string;
  skills?: string[];
  yearsOfExperience?: number;
  isActive: boolean;
}

export interface DeveloperFeedbackData {
  mentorId: string;
  mentorName: string;
  sessionDate: Date;
  isDeveloperMode: true;
}

export class DeveloperFeedbackService {
  private static readonly USERS_COLLECTION = 'users';
  private static readonly MENTOR_PROGRAM_COLLECTION = 'mentorProgram';

  /**
   * Get all active mentors for developer feedback testing
   */
  static async getAllActiveMentors(): Promise<DeveloperMentor[]> {
    try {
      // Get all users who have mentor profiles
      const usersQuery = query(
        collection(firestore, this.USERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const usersSnapshot = await getDocs(usersQuery);
      const mentors: DeveloperMentor[] = [];

      for (const userDoc of usersSnapshot.docs) {
        try {
          // Check if user has a mentor program profile
          const mentorProgramQuery = query(
            collection(firestore, this.USERS_COLLECTION, userDoc.id, this.MENTOR_PROGRAM_COLLECTION),
            where('isMentor', '==', true)
          );

          const mentorProgramSnapshot = await getDocs(mentorProgramQuery);
          
          if (!mentorProgramSnapshot.empty) {
            const mentorData = mentorProgramSnapshot.docs[0].data();
            
            // Only include active mentors
            if (mentorData.isActive !== false) {
              mentors.push({
                mentorId: userDoc.id,
                mentorName: `${mentorData.firstName || ''} ${mentorData.lastName || ''}`.trim() || 'Unknown Mentor',
                mentorEmail: mentorData.email || '',
                industry: mentorData.industry,
                skills: mentorData.skills || [],
                yearsOfExperience: mentorData.yearsOfExperience,
                isActive: mentorData.isActive !== false
              });
            }
          }
        } catch (error) {
          // Skip this user if there's an error accessing their mentor profile
          console.warn(`Could not fetch mentor profile for user ${userDoc.id}:`, error);
        }
      }

      // Sort mentors by name
      return mentors.sort((a, b) => a.mentorName.localeCompare(b.mentorName));
    } catch (error) {
      console.error('Error fetching active mentors for developer mode:', error);
      throw new Error('Failed to fetch mentors for developer mode');
    }
  }

  /**
   * Get a limited number of mentors for developer testing (to avoid overwhelming the UI)
   */
  static async getMentorsForDeveloperMode(limitCount: number = 20): Promise<DeveloperMentor[]> {
    try {
      const allMentors = await this.getAllActiveMentors();
      return allMentors.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching mentors for developer mode:', error);
      throw new Error('Failed to fetch mentors for developer testing');
    }
  }

  /**
   * Create developer feedback data for a mentor
   */
  static createDeveloperFeedbackData(mentor: DeveloperMentor): DeveloperFeedbackData {
    return {
      mentorId: mentor.mentorId,
      mentorName: mentor.mentorName,
      sessionDate: new Date(), // Use current date for developer mode
      isDeveloperMode: true
    };
  }

  /**
   * Check if developer mode is enabled (you can customize this logic)
   */
  static isDeveloperModeEnabled(): boolean {
    // Check for environment variable, localStorage, or other indicators
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('developerMode') === 'true' ||
           window.location.hostname === 'localhost';
  }

  /**
   * Enable/disable developer mode
   */
  static setDeveloperMode(enabled: boolean): void {
    localStorage.setItem('developerMode', enabled.toString());
  }

  /**
   * Get developer mode status
   */
  static getDeveloperMode(): boolean {
    return this.isDeveloperModeEnabled();
  }
}
