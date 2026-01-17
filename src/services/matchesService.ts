/**
 * Matches Service
 * 
 * Handles user-initiated matches between mentors and mentees.
 * Uses the firebase-server API instead of direct Firestore calls.
 */

import { Timestamp } from 'firebase/firestore';
import { FirebaseApiService } from './firebaseApiService';
import { MentorMenteeProfile } from '../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { loggers } from '../utils/logger';

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
  /**
   * Create a match between two users
   * Note: currentUserId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async createMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<string> {
    try {
      // The server handles creating both matches (current user and reverse)
      const matchId = await FirebaseApiService.createMatch(matchedUserId);
      return matchId;
    } catch (error) {
      loggers.error.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Get a specific match between two users
   * Note: currentUserId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async getMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<Match | null> {
    try {
      const matchData = await FirebaseApiService.getMatch(matchedUserId);
      if (!matchData) {
        return null;
      }

      // Convert Date to Timestamp if needed
      const matchedAt = matchData.matchedAt instanceof Date
        ? Timestamp.fromDate(matchData.matchedAt)
        : matchData.matchedAt || Timestamp.now();
      
      const lastMessageAt = matchData.lastMessageAt instanceof Date
        ? Timestamp.fromDate(matchData.lastMessageAt)
        : matchData.lastMessageAt;

      return {
        id: matchData.id || '',
        matchedUserId: matchData.matchedUserId,
        matchedUserName: matchData.matchedUserName || 'User',
        matchedUserEmail: matchData.matchedUserEmail,
        matchedUserProfile: matchData.matchedUserProfile,
        matchedAt,
        status: matchData.status || 'active',
        initiatorId: matchData.initiatorId || currentUserId,
        lastMessageAt,
        unreadCount: matchData.unreadCount || 0
      } as Match;
    } catch (error) {
      loggers.error.error('Error getting match:', error);
      return null;
    }
  }

  /**
   * Get all matches for a user
   * Note: userId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async getMatches(userId: string): Promise<Match[]> {
    try {
      const matchesData = await FirebaseApiService.getMatches();
      
      return matchesData.map((matchData: any) => {
        // Convert Date to Timestamp if needed
        const matchedAt = matchData.matchedAt instanceof Date
          ? Timestamp.fromDate(matchData.matchedAt)
          : matchData.matchedAt || Timestamp.now();
        
        const lastMessageAt = matchData.lastMessageAt instanceof Date
          ? Timestamp.fromDate(matchData.lastMessageAt)
          : matchData.lastMessageAt;

        return {
          id: matchData.id || '',
          matchedUserId: matchData.matchedUserId,
          matchedUserName: matchData.matchedUserName || 'User',
          matchedUserEmail: matchData.matchedUserEmail,
          matchedUserProfile: matchData.matchedUserProfile,
          matchedAt,
          status: matchData.status || 'active',
          initiatorId: matchData.initiatorId || userId,
          lastMessageAt,
          unreadCount: matchData.unreadCount || 0
        } as Match;
      });
    } catch (error) {
      loggers.error.error('Error getting matches:', error);
      return [];
    }
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
   * Note: currentUserId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async removeMatch(
    currentUserId: string,
    matchedUserId: string
  ): Promise<void> {
    try {
      // The server handles removing both matches (current user and reverse)
      await FirebaseApiService.removeMatch(matchedUserId);
    } catch (error) {
      loggers.error.error('Error removing match:', error);
      throw error;
    }
  }

  /**
   * Update match's last message timestamp
   * Note: userId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async updateLastMessageAt(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    try {
      // The server handles updating both matches (current user and reverse)
      await FirebaseApiService.updateLastMessageAt(matchedUserId);
    } catch (error) {
      loggers.error.error('Error updating match last message:', error);
      throw error;
    }
  }

  /**
   * Increment unread count for a match
   * Note: userId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async incrementUnreadCount(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    try {
      await FirebaseApiService.incrementUnreadCount(matchedUserId);
    } catch (error) {
      loggers.error.error('Error incrementing unread count:', error);
      throw error;
    }
  }

  /**
   * Reset unread count for a match
   * Note: userId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async resetUnreadCount(
    userId: string,
    matchedUserId: string
  ): Promise<void> {
    try {
      await FirebaseApiService.resetUnreadCount(matchedUserId);
    } catch (error) {
      loggers.error.error('Error resetting unread count:', error);
      throw error;
    }
  }
}

