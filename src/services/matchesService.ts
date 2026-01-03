/**
 * Matches Service
 * 
 * Handles user-initiated matches between mentors and mentees.
 * Matches are stored in /users/{userId}/mentorProgram/profile/matches
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { MentorMenteeProfile } from '../components/widgets/MentorAlgorithm/algorithm/matchUsers';

export interface Match {
  id: string;
  matchedUserId: string; // The other user's ID
  matchedUserName: string;
  matchedUserEmail?: string;
  matchedUserProfile?: MentorMenteeProfile;
  matchedAt: Timestamp | Date;
  status: 'active' | 'archived';
  initiatorId: string; // Who initiated the match
  lastMessageAt?: Timestamp | Date;
  unreadCount?: number;
}

export class MatchesService {
  private static readonly MATCHES_COLLECTION = 'matches';

  /**
   * Create a match between two users
   */
  static async createMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<string> {
    // Check if match already exists for current user
    const existingMatch = await this.getMatch(currentUserId, matchedUserId);
    if (existingMatch) {
      // Also check if reverse match exists, create it if missing
      const reverseMatch = await this.getMatch(matchedUserId, currentUserId);
      if (!reverseMatch) {
        // Create reverse match if it doesn't exist
        await this.createReverseMatch(matchedUserId, currentUserId);
      }
      return existingMatch.id;
    }

    // Get both users' profiles for names/emails
    const [matchedUserProfileDoc, currentUserProfileDoc] = await Promise.all([
      getDoc(doc(firestore, 'users', matchedUserId, 'mentorProgram', 'profile')),
      getDoc(doc(firestore, 'users', currentUserId, 'mentorProgram', 'profile'))
    ]);

    const matchedUserData = matchedUserProfileDoc.data() as MentorMenteeProfile | undefined;
    const currentUserData = currentUserProfileDoc.data() as MentorMenteeProfile | undefined;

    const matchedUserName = matchedUserData
      ? `${matchedUserData.firstName || ''} ${matchedUserData.lastName || ''}`.trim() || 'User'
      : 'User';
    const matchedUserEmail = matchedUserData?.email;

    const currentUserName = currentUserData
      ? `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'User'
      : 'User';
    const currentUserEmail = currentUserData?.email;

    // Create match in current user's matches collection
    const currentUserMatchesRef = collection(
      firestore,
      'users',
      currentUserId,
      'mentorProgram',
      'profile',
      this.MATCHES_COLLECTION
    );

    const matchData = {
      matchedUserId,
      matchedUserName,
      matchedUserEmail,
      matchedAt: serverTimestamp(),
      status: 'active' as const,
      initiatorId: currentUserId,
      unreadCount: 0
    };

    // Create match in matched user's matches collection (reverse match)
    const matchedUserMatchesRef = collection(
      firestore,
      'users',
      matchedUserId,
      'mentorProgram',
      'profile',
      this.MATCHES_COLLECTION
    );

    const reverseMatchData = {
      matchedUserId: currentUserId,
      matchedUserName: currentUserName,
      matchedUserEmail: currentUserEmail,
      matchedAt: serverTimestamp(),
      status: 'active' as const,
      initiatorId: currentUserId,
      unreadCount: 0
    };

    // Create both matches in parallel to ensure both are created
    const [matchRef, reverseMatchRef] = await Promise.all([
      addDoc(currentUserMatchesRef, matchData),
      addDoc(matchedUserMatchesRef, reverseMatchData)
    ]);

    // Verify both matches were created successfully
    if (!matchRef || !reverseMatchRef) {
      throw new Error('Failed to create bidirectional matches');
    }

    return matchRef.id;
  }

  /**
   * Helper method to create a reverse match (used when fixing missing reverse matches)
   */
  private static async createReverseMatch(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    // Get current user's profile for the reverse match
    const currentUserProfileRef = doc(
      firestore,
      'users',
      matchedUserId,
      'mentorProgram',
      'profile'
    );
    const currentUserProfileDoc = await getDoc(currentUserProfileRef);
    const currentUserData = currentUserProfileDoc.data() as MentorMenteeProfile | undefined;

    const currentUserName = currentUserData
      ? `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'User'
      : 'User';
    const currentUserEmail = currentUserData?.email;

    const matchedUserMatchesRef = collection(
      firestore,
      'users',
      userId,
      'mentorProgram',
      'profile',
      this.MATCHES_COLLECTION
    );

    await addDoc(matchedUserMatchesRef, {
      matchedUserId,
      matchedUserName: currentUserName,
      matchedUserEmail: currentUserEmail,
      matchedAt: serverTimestamp(),
      status: 'active' as const,
      initiatorId: matchedUserId,
      unreadCount: 0
    });
  }

  /**
   * Get a specific match between two users
   */
  static async getMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<Match | null> {
    const matchesRef = collection(
      firestore,
      'users',
      currentUserId,
      'mentorProgram',
      'profile',
      this.MATCHES_COLLECTION
    );

    const q = query(
      matchesRef,
      where('matchedUserId', '==', matchedUserId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const matchDoc = snapshot.docs[0];
    const data = matchDoc.data();
    
    return {
      id: matchDoc.id,
      ...data,
      matchedAt: data.matchedAt || Timestamp.now()
    } as Match;
  }

  /**
   * Get all matches for a user
   */
  static async getMatches(userId: string): Promise<Match[]> {
    const matchesRef = collection(
      firestore,
      'users',
      userId,
      'mentorProgram',
      'profile',
      this.MATCHES_COLLECTION
    );

    // Query only by status to avoid index requirement
    // We'll sort in memory instead
    const q = query(
      matchesRef,
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const matches: Match[] = [];

    for (const matchDoc of snapshot.docs) {
      const data = matchDoc.data();
      
      // Fetch matched user's profile
      let matchedUserProfile: MentorMenteeProfile | undefined;
      try {
        const profileRef = doc(
          firestore,
          'users',
          data.matchedUserId,
          'mentorProgram',
          'profile'
        );
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          matchedUserProfile = profileDoc.data() as MentorMenteeProfile;
        }
      } catch (error) {
        console.error('Error fetching matched user profile:', error);
      }

      matches.push({
        id: matchDoc.id,
        matchedUserId: data.matchedUserId,
        matchedUserName: data.matchedUserName || 'User',
        matchedUserEmail: data.matchedUserEmail,
        matchedUserProfile,
        matchedAt: data.matchedAt || Timestamp.now(),
        status: data.status || 'active',
        initiatorId: data.initiatorId || userId,
        lastMessageAt: data.lastMessageAt,
        unreadCount: data.unreadCount || 0
      } as Match);
    }

    // Sort by matchedAt in descending order (most recent first)
    matches.sort((a, b) => {
      const dateA = a.matchedAt instanceof Timestamp 
        ? a.matchedAt.toMillis() 
        : a.matchedAt instanceof Date 
        ? a.matchedAt.getTime() 
        : new Date(a.matchedAt).getTime();
      const dateB = b.matchedAt instanceof Timestamp 
        ? b.matchedAt.toMillis() 
        : b.matchedAt instanceof Date 
        ? b.matchedAt.getTime() 
        : new Date(b.matchedAt).getTime();
      return dateB - dateA; // Descending order
    });

    return matches;
  }

  /**
   * Check if two users are matched
   */
  static async areMatched(
    userId1: string,
    userId2: string
  ): Promise<boolean> {
    const match = await this.getMatch(userId1, userId2);
    return match !== null;
  }

  /**
   * Remove a match (unmatch)
   */
  static async removeMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<void> {
    // Remove match from current user's collection
    const match = await this.getMatch(currentUserId, matchedUserId);
    if (match) {
      const matchRef = doc(
        firestore,
        'users',
        currentUserId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        match.id
      );
      await updateDoc(matchRef, { status: 'archived' });
    }

    // Remove reverse match
    const reverseMatch = await this.getMatch(matchedUserId, currentUserId);
    if (reverseMatch) {
      const reverseMatchRef = doc(
        firestore,
        'users',
        matchedUserId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        reverseMatch.id
      );
      await updateDoc(reverseMatchRef, { status: 'archived' });
    }
  }

  /**
   * Update match's last message timestamp
   */
  static async updateLastMessageAt(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    const match = await this.getMatch(userId, matchedUserId);
    if (match) {
      const matchRef = doc(
        firestore,
        'users',
        userId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        match.id
      );
      await updateDoc(matchRef, {
        lastMessageAt: serverTimestamp()
      });
    }

    // Update reverse match
    const reverseMatch = await this.getMatch(matchedUserId, userId);
    if (reverseMatch) {
      const reverseMatchRef = doc(
        firestore,
        'users',
        matchedUserId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        reverseMatch.id
      );
      await updateDoc(reverseMatchRef, {
        lastMessageAt: serverTimestamp()
      });
    }
  }

  /**
   * Increment unread count for a match
   */
  static async incrementUnreadCount(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    const match = await this.getMatch(userId, matchedUserId);
    if (match) {
      const matchRef = doc(
        firestore,
        'users',
        userId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        match.id
      );
      await updateDoc(matchRef, {
        unreadCount: (match.unreadCount || 0) + 1
      });
    }
  }

  /**
   * Reset unread count for a match
   */
  static async resetUnreadCount(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    const match = await this.getMatch(userId, matchedUserId);
    if (match) {
      const matchRef = doc(
        firestore,
        'users',
        userId,
        'mentorProgram',
        'profile',
        this.MATCHES_COLLECTION,
        match.id
      );
      await updateDoc(matchRef, {
        unreadCount: 0
      });
    }
  }
}

