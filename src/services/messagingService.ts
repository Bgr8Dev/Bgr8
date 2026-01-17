/**
 * Messaging Service
 * 
 * This service handles all messaging operations including:
 * - Sending messages between matched users only
 * - Retrieving conversations
 * - Validating matches before allowing messaging
 * - GDPR-compliant message handling
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { FirebaseApiService } from './firebaseApiService';
import { getBestMatchesForUser } from '../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { MentorMenteeProfile } from '../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { loggers } from '../utils/logger';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: Timestamp | Date;
  isRead: boolean;
  isDelivered: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  isDeleted?: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: Message | null;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// GDPR-compliant introductory message
export const GDPR_INTRO_MESSAGE = "Privacy Notice: Your messages are stored securely and may be reviewed for support and safety purposes. You can delete your own messages at any time and export your conversation data. Do not share sensitive personal information such as ID documents, health data, criminal history, or safeguarding disclosures. By continuing, you acknowledge this privacy notice.";

export class MessagingService {
  private static readonly MESSAGES_COLLECTION = 'messages';
  private static readonly CONVERSATIONS_COLLECTION = 'conversations';
  private static readonly MATCHES_COLLECTION = 'matches';

  /**
   * Generate a consistent conversation ID from two user IDs
   */
  private static getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Check if two users are matched
   * Now checks both algorithm matches and user-initiated matches
   */
  private static async areUsersMatched(userId1: string, userId2: string): Promise<boolean> {
    try {
      // First check user-initiated matches (new system)
      const { MatchesService } = await import('./matchesService');
      const isUserMatched = await MatchesService.areMatched(userId1, userId2);
      if (isUserMatched) return true;

      // Fallback to algorithm matches (legacy)
      const matches1 = await getBestMatchesForUser(userId1);
      const isMatched = matches1.some(match => match.user.uid === userId2);
      
      if (isMatched) return true;

      // Also check matches for user2 (bidirectional check)
      const matches2 = await getBestMatchesForUser(userId2);
      return matches2.some(match => match.user.uid === userId1);
    } catch (error) {
      loggers.error.error('Error checking if users are matched:', error);
      return false;
    }
  }

  /**
   * Get or create a conversation between two users
   * Public method to allow external components to get/create conversations
   * Note: currentUserId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async getOrCreateConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<string> {
    try {
      return await FirebaseApiService.getOrCreateConversation(otherUserId);
    } catch (error) {
      loggers.error.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message to another user (only if matched)
   * Note: senderId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    attachments?: MessageAttachment[]
  ): Promise<string> {
    // Validate that users are matched
    const areMatched = await this.areUsersMatched(senderId, recipientId);
    if (!areMatched) {
      throw new Error('You can only message users you are matched with');
    }

    try {
      const messageId = await FirebaseApiService.sendMessage(
        recipientId,
        content,
        type,
        attachments
      );

      // Update match's last message timestamp (if matched)
      try {
        const { MatchesService } = await import('./matchesService');
        await MatchesService.updateLastMessageAt(senderId, recipientId);
        // Increment unread count for recipient
        await MatchesService.incrementUnreadCount(recipientId, senderId);
      } catch (error) {
        loggers.error.error('Error updating match timestamp:', error);
        // Don't fail the message send if this fails
      }

      return messageId;
    } catch (error) {
      loggers.error.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   * Note: userId is kept for interface compatibility but not used (server gets it from auth token)
   */
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsData = await FirebaseApiService.getConversations();
      
      return conversationsData.map((convData: any) => {
        const createdAt = convData.createdAt instanceof Date
          ? Timestamp.fromDate(convData.createdAt)
          : convData.createdAt || Timestamp.now();
        
        const updatedAt = convData.updatedAt instanceof Date
          ? Timestamp.fromDate(convData.updatedAt)
          : convData.updatedAt || Timestamp.now();

        // Convert lastMessage timestamp if present
        let lastMessage: Message | null = null;
        if (convData.lastMessage) {
          const msgTimestamp = convData.lastMessage.timestamp instanceof Date
            ? Timestamp.fromDate(convData.lastMessage.timestamp)
            : convData.lastMessage.timestamp;
          
          lastMessage = {
            id: convData.lastMessage.id,
            conversationId: convData.id,
            senderId: convData.lastMessage.senderId,
            senderName: convData.lastMessage.senderName,
            recipientId: convData.lastMessage.recipientId || convData.participantId,
            recipientName: convData.lastMessage.recipientName || convData.participantName,
            content: convData.lastMessage.content,
            timestamp: msgTimestamp,
            isRead: convData.lastMessage.isRead || false,
            isDelivered: true,
            type: convData.lastMessage.type || 'text'
          };
        }

        return {
          id: convData.id,
          participantId: convData.participantId,
          participantName: convData.participantName,
          participantAvatar: convData.participantAvatar,
          lastMessage,
          unreadCount: convData.unreadCount || 0,
          isOnline: convData.isOnline || false,
          isPinned: convData.isPinned || false,
          isArchived: convData.isArchived || false,
          createdAt,
          updatedAt
        } as Conversation;
      });
    } catch (error) {
      loggers.error.error('Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesData = await FirebaseApiService.getMessages(conversationId, limitCount);
      
      return messagesData.map((msgData: any) => {
        const timestamp = msgData.timestamp instanceof Date
          ? Timestamp.fromDate(msgData.timestamp)
          : msgData.timestamp || Timestamp.now();

        return {
          id: msgData.id,
          conversationId: msgData.conversationId,
          senderId: msgData.senderId,
          senderName: msgData.senderName,
          senderAvatar: msgData.senderAvatar,
          recipientId: msgData.recipientId,
          recipientName: msgData.recipientName,
          content: msgData.content,
          timestamp,
          isRead: msgData.isRead || false,
          isDelivered: msgData.isDelivered || false,
          type: msgData.type || 'text',
          attachments: msgData.attachments || []
        } as Message;
      });
    } catch (error) {
      loggers.error.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to messages in a conversation (real-time updates)
   * Note: We query without orderBy to avoid index requirements, then sort in memory
   */
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          content: data.content,
          timestamp: data.timestamp,
          isRead: data.isRead || false,
          isDelivered: data.isDelivered || false,
          type: data.type || 'text',
          attachments: data.attachments || []
        });
      });
      
      // Sort by timestamp in ascending order (oldest first) for display
      messages.sort((a, b) => {
        const dateA = a.timestamp instanceof Timestamp 
          ? a.timestamp.toMillis() 
          : a.timestamp instanceof Date 
          ? a.timestamp.getTime() 
          : new Date(a.timestamp).getTime();
        const dateB = b.timestamp instanceof Timestamp 
          ? b.timestamp.toMillis() 
          : b.timestamp instanceof Date 
          ? b.timestamp.getTime() 
          : new Date(b.timestamp).getTime();
        return dateA - dateB; // Ascending order (oldest first)
      });
      
      callback(messages);
    }, (error) => {
      // Handle errors gracefully (e.g., missing index)
      loggers.error.error('Error in message subscription:', error);
      // Still call callback with empty array to prevent UI errors
      callback([]);
    });
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // The server handles marking messages as read and updating conversation unread count
      await FirebaseApiService.markMessagesAsRead(conversationId);
    } catch (error) {
      loggers.error.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Send the GDPR introductory message when a conversation starts
   */
  static async sendIntroductoryMessage(conversationId: string, senderId: string, recipientId: string): Promise<void> {
    // Check if intro message already sent
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      where('type', '==', 'system'),
      limit(1)
    );

    const snapshot = await getDocs(messagesQuery);
    if (!snapshot.empty) {
      // Intro message already sent
      return;
    }

    // Get recipient profile for name
    const recipientProfile = await getDoc(doc(firestore, 'users', recipientId, 'mentorProgram', 'profile'));
    const recipientData = recipientProfile.data() as MentorMenteeProfile | undefined;
    const recipientName = recipientData
      ? `${recipientData.firstName} ${recipientData.lastName}`
      : 'User';

    // Send system message
    await addDoc(collection(firestore, this.MESSAGES_COLLECTION), {
      conversationId,
      senderId: 'system',
      senderName: 'System',
      recipientId,
      recipientName,
      content: GDPR_INTRO_MESSAGE,
      timestamp: serverTimestamp(),
      isRead: false,
      isDelivered: true,
      type: 'system',
      attachments: []
    });
  }

  /**
   * Delete a message (only if user is the sender) - GDPR Article 17 (Right to Erasure)
   * Uses soft delete to maintain conversation integrity
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const messageRef = doc(firestore, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }
    
    const messageData = messageDoc.data();
    if (messageData.senderId !== userId) {
      throw new Error('You can only delete your own messages');
    }
    
    // Soft delete - mark as deleted rather than removing (maintains conversation flow)
    await updateDoc(messageRef, {
      content: '[Message deleted]',
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId
    });
  }

  /**
   * Export conversation data for GDPR compliance - Article 15 (Right of Access) & Article 20 (Data Portability)
   */
  static async exportConversationData(userId: string, conversationId: string): Promise<string> {
    // Get all messages in the conversation
    const messages = await this.getMessages(conversationId, 1000); // Get up to 1000 messages
    
    // Filter to only messages where user is sender or recipient
    const userMessages = messages.filter(msg => 
      msg.senderId === userId || msg.recipientId === userId
    );
    
    // Get conversation details
    const conversationRef = doc(firestore, this.CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    const conversationData = conversationDoc.exists() ? conversationDoc.data() : null;
    
    // Format as JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      conversationId,
      conversation: conversationData,
      messages: userMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        recipientId: msg.recipientId,
        recipientName: msg.recipientName,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date 
          ? msg.timestamp.toISOString() 
          : msg.timestamp instanceof Timestamp 
          ? msg.timestamp.toDate().toISOString()
          : new Date(msg.timestamp).toISOString(),
        type: msg.type,
        isRead: msg.isRead,
        isDelivered: msg.isDelivered
      })),
      totalMessages: userMessages.length,
      privacyNotice: "This export contains your personal messaging data as required by GDPR Article 15 (Right of Access) and Article 20 (Data Portability)."
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}

