// Firebase proxy server for secure Firestore operations
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { serverLogger } from './logger.mjs';

dotenv.config();

const app = express();
const PORT = process.env.FIREBASE_SERVER_PORT || 4001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const hasFirebaseConfig = () =>
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (!hasFirebaseConfig()) {
    serverLogger.error('Missing Firebase Admin configuration for Firebase server.');
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const firestore = admin.firestore();

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
};

const authenticateRequest = async (req, res, next) => {
  // Skip auth for health check endpoint
  if (req.path === '/' || req.path === '') {
    return next();
  }

  try {
    const token = getBearerToken(req);
    if (!token || token.trim() === '') {
      return res.status(401).json({ error: 'Missing auth token' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.auth = { uid: decodedToken.uid, email: decodedToken.email };
    return next();
  } catch (error) {
    // Only log auth failures for non-health-check routes
    if (req.path !== '/' && req.path !== '') {
      serverLogger.warn('Auth token verification failed.', error);
    }
    return res.status(401).json({ error: 'Invalid auth token' });
  }
};

const isAdminUser = async (uid) => {
  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) return false;
    const data = userDoc.data() || {};
    const roles = data.roles || {};
    return roles.admin === true || data.admin === true;
  } catch (error) {
    serverLogger.error('Error checking admin status:', error);
    return false;
  }
};

const checkPermission = async (req, targetUid) => {
  const currentUid = req.auth.uid;
  
  // Users can access their own data
  if (currentUid === targetUid) {
    return true;
  }
  
  // Admins can access any data
  const isAdmin = await isAdminUser(currentUid);
  if (isAdmin) {
    return true;
  }
  
  return false;
};

// Health check endpoint (no auth required)
// This must be defined before any middleware that might interfere
app.get('/', (_req, res) => {
  // Explicitly skip auth for health checks
  res.json({ status: 'ok', service: 'firebase-server' });
});

// ============================================================================
// MATCHES ENDPOINTS
// ============================================================================

const MATCHES_COLLECTION = 'matches';

app.post('/api/matches', authenticateRequest, async (req, res) => {
  try {
    const { matchedUserId } = req.body;
    const currentUserId = req.auth.uid;

    if (!matchedUserId) {
      return res.status(400).json({ error: 'matchedUserId is required' });
    }

    // Get both users' profiles for names/emails
    const [matchedUserProfileDoc, currentUserProfileDoc] = await Promise.all([
      firestore.collection('users').doc(matchedUserId).collection('mentorProgram').doc('profile').get(),
      firestore.collection('users').doc(currentUserId).collection('mentorProgram').doc('profile').get()
    ]);

    const matchedUserData = matchedUserProfileDoc.data();
    const currentUserData = currentUserProfileDoc.data();

    const matchedUserName = matchedUserData
      ? `${matchedUserData.firstName || ''} ${matchedUserData.lastName || ''}`.trim() || 'User'
      : 'User';
    const matchedUserEmail = matchedUserData?.email;

    const currentUserName = currentUserData
      ? `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'User'
      : 'User';
    const currentUserEmail = currentUserData?.email;

    // Check if match already exists
    const existingMatchQuery = await firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION)
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (!existingMatchQuery.empty) {
      return res.json({ matchId: existingMatchQuery.docs[0].id });
    }

    // Create match in current user's matches collection
    const currentUserMatchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const matchData = {
      matchedUserId,
      matchedUserName,
      matchedUserEmail,
      matchedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      initiatorId: currentUserId,
      unreadCount: 0
    };

    // Create reverse match in matched user's matches collection
    const matchedUserMatchesRef = firestore
      .collection('users').doc(matchedUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const reverseMatchData = {
      matchedUserId: currentUserId,
      matchedUserName: currentUserName,
      matchedUserEmail: currentUserEmail,
      matchedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      initiatorId: currentUserId,
      unreadCount: 0
    };

    const [matchRef, reverseMatchRef] = await Promise.all([
      currentUserMatchesRef.add(matchData),
      matchedUserMatchesRef.add(reverseMatchData)
    ]);

    return res.json({ matchId: matchRef.id });
  } catch (error) {
    serverLogger.error('Error creating match:', error);
    return res.status(500).json({ error: error.message || 'Failed to create match' });
  }
});

app.get('/api/matches', authenticateRequest, async (req, res) => {
  try {
    const userId = req.auth.uid;
    const matchesRef = firestore
      .collection('users').doc(userId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef.where('status', '==', 'active').get();
    const matches = [];

    for (const matchDoc of snapshot.docs) {
      const data = matchDoc.data();
      
      // Fetch matched user's profile
      let matchedUserProfile = undefined;
      try {
        const profileRef = firestore
          .collection('users').doc(data.matchedUserId)
          .collection('mentorProgram').doc('profile');
        const profileDoc = await profileRef.get();
        if (profileDoc.exists) {
          matchedUserProfile = profileDoc.data();
        }
      } catch (error) {
        serverLogger.debug('Error fetching matched user profile:', error);
      }

      matches.push({
        id: matchDoc.id,
        matchedUserId: data.matchedUserId,
        matchedUserName: data.matchedUserName || 'User',
        matchedUserEmail: data.matchedUserEmail,
        matchedUserProfile,
        matchedAt: data.matchedAt?.toDate?.() || new Date(data.matchedAt),
        status: data.status || 'active',
        initiatorId: data.initiatorId || userId,
        lastMessageAt: data.lastMessageAt?.toDate?.() || data.lastMessageAt,
        unreadCount: data.unreadCount || 0
      });
    }

    // Sort by matchedAt descending
    matches.sort((a, b) => {
      const dateA = a.matchedAt instanceof Date ? a.matchedAt.getTime() : new Date(a.matchedAt).getTime();
      const dateB = b.matchedAt instanceof Date ? b.matchedAt.getTime() : new Date(b.matchedAt).getTime();
      return dateB - dateA;
    });

    return res.json({ matches });
  } catch (error) {
    serverLogger.error('Error fetching matches:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch matches' });
  }
});

app.get('/api/matches/:matchedUserId', authenticateRequest, async (req, res) => {
  try {
    const currentUserId = req.auth.uid;
    const { matchedUserId } = req.params;

    const matchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (snapshot.empty) {
      return res.json({ match: null });
    }

    const matchDoc = snapshot.docs[0];
    const data = matchDoc.data();

    return res.json({
      match: {
        id: matchDoc.id,
        ...data,
        matchedAt: data.matchedAt?.toDate?.() || new Date(data.matchedAt)
      }
    });
  } catch (error) {
    serverLogger.error('Error fetching match:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch match' });
  }
});

app.delete('/api/matches/:matchedUserId', authenticateRequest, async (req, res) => {
  try {
    const currentUserId = req.auth.uid;
    const { matchedUserId } = req.params;

    // Get and update match from current user's collection
    const matchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ status: 'archived' });
    }

    // Get and update reverse match
    const reverseMatchesRef = firestore
      .collection('users').doc(matchedUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const reverseSnapshot = await reverseMatchesRef
      .where('matchedUserId', '==', currentUserId)
      .where('status', '==', 'active')
      .get();

    if (!reverseSnapshot.empty) {
      await reverseSnapshot.docs[0].ref.update({ status: 'archived' });
    }

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error removing match:', error);
    return res.status(500).json({ error: error.message || 'Failed to remove match' });
  }
});

app.patch('/api/matches/:matchedUserId/last-message', authenticateRequest, async (req, res) => {
  try {
    const currentUserId = req.auth.uid;
    const { matchedUserId } = req.params;

    const matchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Update reverse match
    const reverseMatchesRef = firestore
      .collection('users').doc(matchedUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const reverseSnapshot = await reverseMatchesRef
      .where('matchedUserId', '==', currentUserId)
      .where('status', '==', 'active')
      .get();

    if (!reverseSnapshot.empty) {
      await reverseSnapshot.docs[0].ref.update({
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error updating match last message:', error);
    return res.status(500).json({ error: error.message || 'Failed to update match' });
  }
});

app.patch('/api/matches/:matchedUserId/unread/increment', authenticateRequest, async (req, res) => {
  try {
    const currentUserId = req.auth.uid;
    const { matchedUserId } = req.params;

    const matchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (!snapshot.empty) {
      const matchData = snapshot.docs[0].data();
      await snapshot.docs[0].ref.update({
        unreadCount: (matchData.unreadCount || 0) + 1
      });
    }

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error incrementing unread count:', error);
    return res.status(500).json({ error: error.message || 'Failed to increment unread count' });
  }
});

app.patch('/api/matches/:matchedUserId/unread/reset', authenticateRequest, async (req, res) => {
  try {
    const currentUserId = req.auth.uid;
    const { matchedUserId } = req.params;

    const matchesRef = firestore
      .collection('users').doc(currentUserId)
      .collection('mentorProgram').doc('profile')
      .collection(MATCHES_COLLECTION);

    const snapshot = await matchesRef
      .where('matchedUserId', '==', matchedUserId)
      .where('status', '==', 'active')
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        unreadCount: 0
      });
    }

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error resetting unread count:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset unread count' });
  }
});

// ============================================================================
// MESSAGING ENDPOINTS
// ============================================================================

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

app.post('/api/messaging/conversations', authenticateRequest, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.auth.uid;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required' });
    }

    const conversationId = getConversationId(currentUserId, otherUserId);
    const conversationRef = firestore.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      // Get user profiles for names
      const [currentUserProfile, otherUserProfile] = await Promise.all([
        firestore.collection('users').doc(currentUserId).collection('mentorProgram').doc('profile').get(),
        firestore.collection('users').doc(otherUserId).collection('mentorProgram').doc('profile').get()
      ]);

      const currentUserData = currentUserProfile.data();
      const otherUserData = otherUserProfile.data();

      const currentUserName = currentUserData 
        ? `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'User'
        : 'User';
      const otherUserName = otherUserData
        ? `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim() || 'User'
        : 'User';

      await conversationRef.set({
        participant1Id: currentUserId,
        participant1Name: currentUserName,
        participant2Id: otherUserId,
        participant2Name: otherUserName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        unreadCount_participant1: 0,
        unreadCount_participant2: 0,
        isPinned_participant1: false,
        isPinned_participant2: false,
        isArchived_participant1: false,
        isArchived_participant2: false
      });
    }

    return res.json({ conversationId });
  } catch (error) {
    serverLogger.error('Error creating/getting conversation:', error);
    return res.status(500).json({ error: error.message || 'Failed to get/create conversation' });
  }
});

app.post('/api/messaging/send', authenticateRequest, async (req, res) => {
  try {
    const { recipientId, content, type = 'text', attachments = [] } = req.body;
    const senderId = req.auth.uid;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'recipientId and content are required' });
    }

    // Get user profiles for names
    const [senderProfile, recipientProfile] = await Promise.all([
      firestore.collection('users').doc(senderId).collection('mentorProgram').doc('profile').get(),
      firestore.collection('users').doc(recipientId).collection('mentorProgram').doc('profile').get()
    ]);

    const senderData = senderProfile.data();
    const recipientData = recipientProfile.data();

    const senderName = senderData
      ? `${senderData.firstName || ''} ${senderData.lastName || ''}`.trim() || 'User'
      : 'User';
    const recipientName = recipientData
      ? `${recipientData.firstName || ''} ${recipientData.lastName || ''}`.trim() || 'User'
      : 'User';

    // Get or create conversation
    const conversationId = getConversationId(senderId, recipientId);
    const conversationRef = firestore.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    let conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      await conversationRef.set({
        participant1Id: senderId,
        participant1Name: senderName,
        participant2Id: recipientId,
        participant2Name: recipientName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        unreadCount_participant1: 0,
        unreadCount_participant2: 0,
        isPinned_participant1: false,
        isPinned_participant2: false,
        isArchived_participant1: false,
        isArchived_participant2: false
      });
      conversationDoc = await conversationRef.get();
    }

    // Create message
    const messageRef = await firestore.collection(MESSAGES_COLLECTION).add({
      conversationId,
      senderId,
      senderName,
      recipientId,
      recipientName,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      isDelivered: false,
      type,
      attachments: attachments || []
    });

    // Update conversation with last message
    const conversationData = conversationDoc.data();
    const isParticipant1 = conversationData.participant1Id === senderId;
    const unreadField = isParticipant1 ? 'unreadCount_participant2' : 'unreadCount_participant1';
    const currentUnread = conversationData[unreadField] || 0;
    
    await conversationRef.update({
      lastMessage: {
        id: messageRef.id,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderId,
        senderName
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [unreadField]: currentUnread + 1
    });

    return res.json({ messageId: messageRef.id });
  } catch (error) {
    serverLogger.error('Error sending message:', error);
    return res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

app.get('/api/messaging/conversations', authenticateRequest, async (req, res) => {
  try {
    const userId = req.auth.uid;

    // Get conversations where user is participant1
    const conversationsQuery1 = await firestore
      .collection(CONVERSATIONS_COLLECTION)
      .where('participant1Id', '==', userId)
      .get();

    // Get conversations where user is participant2
    const conversationsQuery2 = await firestore
      .collection(CONVERSATIONS_COLLECTION)
      .where('participant2Id', '==', userId)
      .get();

    const conversations = [];

    // Process conversations where user is participant1
    conversationsQuery1.forEach(doc => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        participantId: data.participant2Id,
        participantName: data.participant2Name,
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount_participant1 || 0,
        isPinned: data.isPinned_participant1 || false,
        isArchived: data.isArchived_participant1 || false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    // Process conversations where user is participant2
    conversationsQuery2.forEach(doc => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        participantId: data.participant1Id,
        participantName: data.participant1Name,
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount_participant2 || 0,
        isPinned: data.isPinned_participant2 || false,
        isArchived: data.isArchived_participant2 || false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    // Sort by updatedAt descending
    conversations.sort((a, b) => {
      const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

    return res.json({ conversations });
  } catch (error) {
    serverLogger.error('Error fetching conversations:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

app.get('/api/messaging/messages/:conversationId', authenticateRequest, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.auth.uid;
    const limitCount = parseInt(req.query.limit || '50');

    // Verify user is part of this conversation
    const conversationRef = firestore.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    const conversationDoc = await conversationRef.get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationData = conversationDoc.data();
    if (conversationData.participant1Id !== userId && conversationData.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    // Get messages
    const messagesQuery = await firestore
      .collection(MESSAGES_COLLECTION)
      .where('conversationId', '==', conversationId)
      .get();

    const messages = [];
    messagesQuery.forEach(doc => {
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
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        isRead: data.isRead || false,
        isDelivered: data.isDelivered || false,
        type: data.type || 'text',
        attachments: data.attachments || []
      });
    });

    // Sort by timestamp descending, then reverse to get chronological order
    messages.sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const dateB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    return res.json({ messages: messages.slice(0, limitCount).reverse() });
  } catch (error) {
    serverLogger.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

app.patch('/api/messaging/messages/:conversationId/read', authenticateRequest, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.auth.uid;

    // Mark messages as read
    const messagesQuery = await firestore
      .collection(MESSAGES_COLLECTION)
      .where('conversationId', '==', conversationId)
      .where('recipientId', '==', userId)
      .where('isRead', '==', false)
      .get();

    const batch = firestore.batch();
    messagesQuery.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    // Update conversation unread count
    const conversationRef = firestore.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    const conversationDoc = await conversationRef.get();
    
    if (conversationDoc.exists) {
      const data = conversationDoc.data();
      const isParticipant1 = data.participant1Id === userId;
      await conversationRef.update({
        [`unreadCount_${isParticipant1 ? 'participant1' : 'participant2'}`]: 0
      });
    }

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error marking messages as read:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
});

// ============================================================================
// SESSIONS ENDPOINTS
// ============================================================================

const SESSIONS_COLLECTION = 'sessions';
const FEEDBACK_COLLECTION = 'feedback';
const QUESTIONS_COLLECTION = 'questions';

app.post('/api/sessions', authenticateRequest, async (req, res) => {
  try {
    const sessionData = req.body;
    const sessionRef = await firestore.collection(SESSIONS_COLLECTION).add({
      ...sessionData,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      feedbackSubmitted_mentor: false,
      feedbackSubmitted_mentee: false
    });
    return res.json({ sessionId: sessionRef.id });
  } catch (error) {
    serverLogger.error('Error creating session:', error);
    return res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

app.get('/api/sessions/:sessionId', authenticateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionDoc = await firestore.collection(SESSIONS_COLLECTION).doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();
    return res.json({
      session: {
        id: sessionDoc.id,
        ...sessionData,
        sessionDate: sessionData.sessionDate?.toDate?.() || sessionData.sessionDate,
        createdAt: sessionData.createdAt?.toDate?.() || sessionData.createdAt,
        updatedAt: sessionData.updatedAt?.toDate?.() || sessionData.updatedAt
      }
    });
  } catch (error) {
    serverLogger.error('Error fetching session:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch session' });
  }
});

app.get('/api/sessions', authenticateRequest, async (req, res) => {
  try {
    const userId = req.auth.uid;

    // Get sessions where user is mentor
    const mentorQuery = await firestore
      .collection(SESSIONS_COLLECTION)
      .where('mentorId', '==', userId)
      .orderBy('sessionDate', 'desc')
      .get();

    // Get sessions where user is mentee
    const menteeQuery = await firestore
      .collection(SESSIONS_COLLECTION)
      .where('menteeId', '==', userId)
      .orderBy('sessionDate', 'desc')
      .get();

    const sessions = [];

    mentorQuery.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        sessionDate: data.sessionDate?.toDate?.() || data.sessionDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    menteeQuery.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        sessionDate: data.sessionDate?.toDate?.() || data.sessionDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    // Sort by date descending
    sessions.sort((a, b) => {
      const dateA = a.sessionDate instanceof Date ? a.sessionDate.getTime() : new Date(a.sessionDate).getTime();
      const dateB = b.sessionDate instanceof Date ? b.sessionDate.getTime() : new Date(b.sessionDate).getTime();
      return dateB - dateA;
    });

    return res.json({ sessions });
  } catch (error) {
    serverLogger.error('Error fetching sessions:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
});

app.patch('/api/sessions/:sessionId/status', authenticateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    await firestore.collection(SESSIONS_COLLECTION).doc(sessionId).update({
      status,
      updatedAt: admin.firestore.Timestamp.now()
    });

    return res.json({ success: true });
  } catch (error) {
    serverLogger.error('Error updating session status:', error);
    return res.status(500).json({ error: error.message || 'Failed to update session status' });
  }
});

app.post('/api/sessions/:sessionId/feedback', authenticateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const feedbackData = req.body;
    const userId = req.auth.uid;

    const batch = firestore.batch();
    
    // Create feedback document
    const feedbackRef = firestore
      .collection(SESSIONS_COLLECTION).doc(sessionId)
      .collection(FEEDBACK_COLLECTION).doc();
    
    const feedback = {
      feedbackId: feedbackRef.id,
      giverUserId: feedbackData.giverUserId || userId,
      receiverUserId: feedbackData.receiverUserId,
      submittedAt: admin.firestore.Timestamp.now(),
      feedbackType: feedbackData.feedbackType
    };
    
    batch.set(feedbackRef, feedback);
    
    // Create question documents
    if (feedbackData.questions && Array.isArray(feedbackData.questions)) {
      feedbackData.questions.forEach(questionData => {
        const questionRef = feedbackRef.collection(QUESTIONS_COLLECTION).doc();
        const question = {
          questionId: questionRef.id,
          question: questionData.question,
          response: questionData.response,
          notes: questionData.notes,
          questionType: questionData.questionType
        };
        batch.set(questionRef, question);
      });
    }
    
    // Update session feedback tracking
    const sessionRef = firestore.collection(SESSIONS_COLLECTION).doc(sessionId);
    const updateData = {
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    if (feedbackData.feedbackType === 'mentor') {
      updateData.feedbackSubmitted_mentor = true;
    } else if (feedbackData.feedbackType === 'mentee') {
      updateData.feedbackSubmitted_mentee = true;
    }
    
    batch.update(sessionRef, updateData);
    await batch.commit();

    return res.json({ success: true, feedbackId: feedbackRef.id });
  } catch (error) {
    serverLogger.error('Error submitting feedback:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit feedback' });
  }
});

app.get('/api/sessions/:sessionId/feedback', authenticateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const feedbackQuery = await firestore
      .collection(SESSIONS_COLLECTION).doc(sessionId)
      .collection(FEEDBACK_COLLECTION)
      .orderBy('submittedAt', 'desc')
      .get();

    const feedback = [];
    feedbackQuery.forEach(doc => {
      const data = doc.data();
      feedback.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt
      });
    });

    return res.json({ feedback });
  } catch (error) {
    serverLogger.error('Error fetching session feedback:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch session feedback' });
  }
});

app.listen(PORT, () => {
  serverLogger.info(`Firebase server running on http://localhost:${PORT}`);
});
