import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc,
  orderBy
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { UserProfile, hasRole } from '../utils/userProfile';

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
      
      console.log(`DeveloperFeedbackService: Found ${usersSnapshot.docs.length} users to check`);

      for (const userDoc of usersSnapshot.docs) {
        try {
          // Check if user has a mentor program profile (single document, not subcollection)
          const mentorProgramDoc = await getDoc(doc(firestore, this.USERS_COLLECTION, userDoc.id, this.MENTOR_PROGRAM_COLLECTION, 'profile'));
          
          if (mentorProgramDoc.exists()) {
            const mentorData = mentorProgramDoc.data();
            console.log(`DeveloperFeedbackService: Checking user ${userDoc.id}, profile type: ${mentorData.type}, isMentor: ${mentorData.isMentor}`);
            
            // Check if this is a mentor profile
            if (mentorData.type === 'mentor' || mentorData.isMentor === true) {
              // Only include active mentors (default to true if not specified)
              const isActive = mentorData.isActive !== false;
              
              if (isActive) {
                const mentorName = `${mentorData.firstName || ''} ${mentorData.lastName || ''}`.trim() || 'Unknown Mentor';
                console.log(`DeveloperFeedbackService: Adding mentor: ${mentorName} (${userDoc.id})`);
                mentors.push({
                  mentorId: userDoc.id,
                  mentorName: mentorName,
                  mentorEmail: mentorData.email || '',
                  industry: mentorData.industries?.[0] || mentorData.industry, // Check both possible field names
                  skills: mentorData.skills || [],
                  yearsOfExperience: mentorData.experience || mentorData.yearsOfExperience, // Check both possible field names
                  isActive: true
                });
              }
            }
          }
        } catch (error) {
          // Skip this user if there's an error accessing their mentor profile
          console.warn(`Could not fetch mentor profile for user ${userDoc.id}:`, error);
        }
      }

      // Also fetch generated mentors for testing
      try {
        const generatedMentorsQuery = query(collection(firestore, 'Generated Mentors'));
        const generatedSnapshot = await getDocs(generatedMentorsQuery);
        
        console.log(`DeveloperFeedbackService: Found ${generatedSnapshot.docs.length} generated mentors`);
        
        generatedSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          if (mentorData.type === 'mentor' || mentorData.isMentor === true) {
            mentors.push({
              mentorId: doc.id,
              mentorName: `${mentorData.firstName || ''} ${mentorData.lastName || ''}`.trim() || 'Generated Mentor',
              mentorEmail: mentorData.email || '',
              industry: mentorData.industries?.[0] || mentorData.industry,
              skills: mentorData.skills || [],
              yearsOfExperience: mentorData.experience || mentorData.yearsOfExperience,
              isActive: true
            });
          }
        });
      } catch (error) {
        console.warn('Could not fetch generated mentors:', error);
      }

      // Sort mentors by name
      console.log(`DeveloperFeedbackService: Total mentors found: ${mentors.length}`);
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
   * Check if developer mode is enabled for a specific user based on their role
   */
  static isDeveloperModeEnabledForUser(userProfile: UserProfile | null): boolean {
    // Check if user has developer role
    if (userProfile && hasRole(userProfile, 'developer')) {
      return true;
    }
    
    // Fallback to environment-based check for backward compatibility
    return this.isDeveloperModeEnabled();
  }

  /**
   * Check if developer mode is enabled (environment-based check for backward compatibility)
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
