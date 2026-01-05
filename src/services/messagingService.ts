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
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
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
   */
  static async getOrCreateConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<string> {
    const conversationId = this.getConversationId(currentUserId, otherUserId);
    const conversationRef = doc(firestore, this.CONVERSATIONS_COLLECTION, conversationId);

    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      // Get user profiles for names
      const [currentUserProfile, otherUserProfile] = await Promise.all([
        getDoc(doc(firestore, 'users', currentUserId, 'mentorProgram', 'profile')),
        getDoc(doc(firestore, 'users', otherUserId, 'mentorProgram', 'profile'))
      ]);

      const currentUserData = currentUserProfile.data() as MentorMenteeProfile | undefined;
      const otherUserData = otherUserProfile.data() as MentorMenteeProfile | undefined;

      const currentUserName = currentUserData 
        ? `${currentUserData.firstName} ${currentUserData.lastName}`
        : 'User';
      const otherUserName = otherUserData
        ? `${otherUserData.firstName} ${otherUserData.lastName}`
        : 'User';

      // Create conversation document with both participants using conversationId as document ID
      const conversationRef = doc(firestore, this.CONVERSATIONS_COLLECTION, conversationId);
      await setDoc(conversationRef, {
        participant1Id: currentUserId,
        participant1Name: currentUserName,
        participant2Id: otherUserId,
        participant2Name: otherUserName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        unreadCount_participant1: 0,
        unreadCount_participant2: 0,
        isPinned_participant1: false,
        isPinned_participant2: false,
        isArchived_participant1: false,
        isArchived_participant2: false
      });
    }

    return conversationId;
  }

  /**
   * Send a message to another user (only if matched)
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

    // Get user profiles for names
    const [senderProfile, recipientProfile] = await Promise.all([
      getDoc(doc(firestore, 'users', senderId, 'mentorProgram', 'profile')),
      getDoc(doc(firestore, 'users', recipientId, 'mentorProgram', 'profile'))
    ]);

    const senderData = senderProfile.data() as MentorMenteeProfile | undefined;
    const recipientData = recipientProfile.data() as MentorMenteeProfile | undefined;

    const senderName = senderData
      ? `${senderData.firstName} ${senderData.lastName}`
      : 'User';
    const recipientName = recipientData
      ? `${recipientData.firstName} ${recipientData.lastName}`
      : 'User';

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    // Create message
    const messageRef = await addDoc(collection(firestore, this.MESSAGES_COLLECTION), {
      conversationId,
      senderId,
      senderName,
      recipientId,
      recipientName,
      content,
      timestamp: serverTimestamp(),
      isRead: false,
      isDelivered: false,
      type,
      attachments: attachments || []
    });

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

    // Update conversation with last message
    const conversationRef = doc(firestore, this.CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      const isParticipant1 = conversationData.participant1Id === senderId;
      const unreadField = isParticipant1 ? 'unreadCount_participant2' : 'unreadCount_participant1';
      const currentUnread = conversationData[unreadField] || 0;
      
      await updateDoc(conversationRef, {
        lastMessage: {
          id: messageRef.id,
          content,
          timestamp: serverTimestamp(),
          senderId,
          senderName
        },
        updatedAt: serverTimestamp(),
        [unreadField]: currentUnread + 1
      });
    }

    return messageRef.id;
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: string): Promise<Conversation[]> {
    // Get all conversations where user is a participant
    const conversationsQuery = query(
      collection(firestore, this.CONVERSATIONS_COLLECTION),
      where('participant1Id', '==', userId)
    );
    
    const conversationsQuery2 = query(
      collection(firestore, this.CONVERSATIONS_COLLECTION),
      where('participant2Id', '==', userId)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(conversationsQuery),
      getDocs(conversationsQuery2)
    ]);

    const conversations: Conversation[] = [];

    // Process conversations where user is participant1
    snapshot1.forEach(doc => {
      const data = doc.data();
      const otherUserId = data.participant2Id;
      const otherUserName = data.participant2Name;
      const unreadCount = data.unreadCount_participant1 || 0;
      const isPinned = data.isPinned_participant1 || false;
      const isArchived = data.isArchived_participant1 || false;

      conversations.push({
        id: doc.id,
        participantId: otherUserId,
        participantName: otherUserName,
        lastMessage: data.lastMessage ? {
          id: data.lastMessage.id,
          conversationId: doc.id,
          senderId: data.lastMessage.senderId,
          senderName: data.lastMessage.senderName,
          recipientId: data.lastMessage.senderId === userId ? otherUserId : userId,
          recipientName: data.lastMessage.senderId === userId ? otherUserName : data.lastMessage.senderName,
          content: data.lastMessage.content,
          timestamp: data.lastMessage.timestamp,
          isRead: data.lastMessage.senderId === userId,
          isDelivered: true,
          type: 'text'
        } : null,
        unreadCount,
        isOnline: false, // TODO: Implement online status
        isPinned,
        isArchived,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    // Process conversations where user is participant2
    snapshot2.forEach(doc => {
      const data = doc.data();
      const otherUserId = data.participant1Id;
      const otherUserName = data.participant1Name;
      const unreadCount = data.unreadCount_participant2 || 0;
      const isPinned = data.isPinned_participant2 || false;
      const isArchived = data.isArchived_participant2 || false;

      conversations.push({
        id: doc.id,
        participantId: otherUserId,
        participantName: otherUserName,
        lastMessage: data.lastMessage ? {
          id: data.lastMessage.id,
          conversationId: doc.id,
          senderId: data.lastMessage.senderId,
          senderName: data.lastMessage.senderName,
          recipientId: data.lastMessage.senderId === userId ? otherUserId : userId,
          recipientName: data.lastMessage.senderId === userId ? otherUserName : data.lastMessage.senderName,
          content: data.lastMessage.content,
          timestamp: data.lastMessage.timestamp,
          isRead: data.lastMessage.senderId === userId,
          isDelivered: true,
          type: 'text'
        } : null,
        unreadCount,
        isOnline: false, // TODO: Implement online status
        isPinned,
        isArchived,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    // Sort by updatedAt descending
    conversations.sort((a, b) => {
      const aTime = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

    return conversations;
  }

  /**
   * Get messages for a conversation
   * Note: We query without orderBy to avoid index requirements, then sort in memory
   */
  static async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId)
    );

    const snapshot = await getDocs(messagesQuery);
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

    // Sort by timestamp in descending order (most recent first), then reverse for chronological
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
      return dateB - dateA; // Descending order (most recent first)
    });

    // Limit and reverse to get chronological order (oldest first)
    return messages.slice(0, limitCount).reverse();
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
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(messagesQuery);
    const batch = writeBatch(firestore);

    snapshot.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();

    // Update conversation unread count
    const conversationRef = doc(firestore, this.CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const data = conversationDoc.data();
      const isParticipant1 = data.participant1Id === userId;
      await updateDoc(conversationRef, {
        [`unreadCount_${isParticipant1 ? 'participant1' : 'participant2'}`]: 0
      });
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

