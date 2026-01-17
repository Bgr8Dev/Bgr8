/**
 * Firebase API Service
 * 
 * Client-side service for communicating with the firebase-server.
 * This replaces direct Firebase/Firestore calls to keep credentials secure.
 */

import { auth } from '../firebase/firebase';
import { loggers } from '../utils/logger';

// Auto-detect Firebase server URL based on environment
// Uses production URL in production builds, localhost in development
const isProduction = import.meta.env.PROD;
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

const FIREBASE_SERVER_URL = import.meta.env.VITE_FIREBASE_SERVER_URL || 
  (isProduction && !isLocalhost 
    ? 'https://bgr8-firebase-server.onrender.com'
    : 'http://localhost:4001');

class FirebaseApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'FirebaseApiError';
  }
}

/**
 * Get the Firebase ID token for authentication
 */
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

/**
 * Make an authenticated request to the Firebase server
 */
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const token = await getAuthToken();
    const url = `${FIREBASE_SERVER_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }
      throw new FirebaseApiError(errorMessage, response.status);
    }

    return response;
  } catch (error) {
    if (error instanceof FirebaseApiError) {
      throw error;
    }
    loggers.error.error('Error making authenticated request:', error);
    throw new FirebaseApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      'NETWORK_ERROR'
    );
  }
};

/**
 * Firebase API Client
 */
export class FirebaseApiService {
  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${FIREBASE_SERVER_URL}/`);
    return await response.json();
  }

  // ============================================================================
  // MATCHES API
  // ============================================================================

  /**
   * Create a match between two users
   */
  static async createMatch(matchedUserId: string): Promise<string> {
    const response = await fetchWithAuth('/api/matches', {
      method: 'POST',
      body: JSON.stringify({ matchedUserId }),
    });
    const data = await response.json();
    return data.matchId;
  }

  /**
   * Get all matches for the current user
   */
  static async getMatches() {
    const response = await fetchWithAuth('/api/matches');
    const data = await response.json();
    return data.matches || [];
  }

  /**
   * Get a specific match
   */
  static async getMatch(matchedUserId: string) {
    const response = await fetchWithAuth(`/api/matches/${matchedUserId}`);
    const data = await response.json();
    return data.match || null;
  }

  /**
   * Remove a match (unmatch)
   */
  static async removeMatch(matchedUserId: string): Promise<void> {
    await fetchWithAuth(`/api/matches/${matchedUserId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update match's last message timestamp
   */
  static async updateLastMessageAt(matchedUserId: string): Promise<void> {
    await fetchWithAuth(`/api/matches/${matchedUserId}/last-message`, {
      method: 'PATCH',
    });
  }

  /**
   * Increment unread count for a match
   */
  static async incrementUnreadCount(matchedUserId: string): Promise<void> {
    await fetchWithAuth(`/api/matches/${matchedUserId}/unread/increment`, {
      method: 'PATCH',
    });
  }

  /**
   * Reset unread count for a match
   */
  static async resetUnreadCount(matchedUserId: string): Promise<void> {
    await fetchWithAuth(`/api/matches/${matchedUserId}/unread/reset`, {
      method: 'PATCH',
    });
  }

  // ============================================================================
  // MESSAGING API
  // ============================================================================

  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(otherUserId: string): Promise<string> {
    const response = await fetchWithAuth('/api/messaging/conversations', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
    const data = await response.json();
    return data.conversationId;
  }

  /**
   * Send a message
   */
  static async sendMessage(
    recipientId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    attachments: any[] = []
  ): Promise<string> {
    const response = await fetchWithAuth('/api/messaging/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId,
        content,
        type,
        attachments,
      }),
    });
    const data = await response.json();
    return data.messageId;
  }

  /**
   * Get all conversations for the current user
   */
  static async getConversations() {
    const response = await fetchWithAuth('/api/messaging/conversations');
    const data = await response.json();
    return data.conversations || [];
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string, limit: number = 50) {
    const response = await fetchWithAuth(
      `/api/messaging/messages/${conversationId}?limit=${limit}`
    );
    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string): Promise<void> {
    await fetchWithAuth(`/api/messaging/messages/${conversationId}/read`, {
      method: 'PATCH',
    });
  }

  // ============================================================================
  // SESSIONS API
  // ============================================================================

  /**
   * Create a new session
   */
  static async createSession(sessionData: any): Promise<string> {
    const response = await fetchWithAuth('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    const data = await response.json();
    return data.sessionId;
  }

  /**
   * Get a specific session
   */
  static async getSession(sessionId: string) {
    const response = await fetchWithAuth(`/api/sessions/${sessionId}`);
    const data = await response.json();
    return data.session || null;
  }

  /**
   * Get all sessions for the current user
   */
  static async getSessions() {
    const response = await fetchWithAuth('/api/sessions');
    const data = await response.json();
    return data.sessions || [];
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: string
  ): Promise<void> {
    await fetchWithAuth(`/api/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Submit feedback for a session
   */
  static async submitFeedback(sessionId: string, feedbackData: any): Promise<string> {
    const response = await fetchWithAuth(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
    const data = await response.json();
    return data.feedbackId;
  }

  /**
   * Get feedback for a session
   */
  static async getSessionFeedback(sessionId: string) {
    const response = await fetchWithAuth(`/api/sessions/${sessionId}/feedback`);
    const data = await response.json();
    return data.feedback || [];
  }
}

export { FirebaseApiError };
