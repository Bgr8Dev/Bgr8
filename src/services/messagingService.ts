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
  orderBy,
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
export const GDPR_INTRO_MESSAGE = "Do not share sensitive personal information (ID documents, health data, criminal history, safeguarding disclosures). This chat is logged for support and safety purposes.";

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
      console.error('Error checking if users are matched:', error);
      return false;
    }
  }

  /**
   * Get or create a conversation between two users
   */
  private static async getOrCreateConversation(
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
      console.error('Error updating match timestamp:', error);
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
   */
  static async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
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

    // Reverse to get chronological order
    return messages.reverse();
  }

  /**
   * Subscribe to messages in a conversation (real-time updates)
   */
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const messagesQuery = query(
      collection(firestore, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
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
      callback(messages);
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
}

