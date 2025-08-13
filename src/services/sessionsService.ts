import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { Session, SessionFeedback, FeedbackQuestion, FeedbackFormData } from '../types/sessions';

export class SessionsService {
  private static readonly SESSIONS_COLLECTION = 'sessions';
  private static readonly FEEDBACK_COLLECTION = 'feedback';
  private static readonly QUESTIONS_COLLECTION = 'questions';

  // Create a new session from a booking
  static async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const sessionRef = await addDoc(collection(firestore, this.SESSIONS_COLLECTION), {
      ...sessionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      feedbackSubmitted_mentor: false,
      feedbackSubmitted_mentee: false
    });
    return sessionRef.id;
  }

  // Get a session by ID
  static async getSession(sessionId: string): Promise<Session | null> {
    const sessionDoc = await getDoc(doc(firestore, this.SESSIONS_COLLECTION, sessionId));
    if (sessionDoc.exists()) {
      return { id: sessionDoc.id, ...sessionDoc.data() } as Session;
    }
    return null;
  }

  // Get all sessions for a user (as mentor or mentee)
  static async getUserSessions(userId: string): Promise<Session[]> {
    const q = query(
      collection(firestore, this.SESSIONS_COLLECTION),
      where('mentorId', '==', userId),
      orderBy('sessionDate', 'desc')
    );
    
    const menteeQuery = query(
      collection(firestore, this.SESSIONS_COLLECTION),
      where('menteeId', '==', userId),
      orderBy('sessionDate', 'desc')
    );

    const [mentorDocs, menteeDocs] = await Promise.all([
      getDocs(q),
      getDocs(menteeQuery)
    ]);

    const sessions: Session[] = [];
    
    mentorDocs.forEach(doc => {
      sessions.push({ id: doc.id, ...doc.data() } as Session);
    });
    
    menteeDocs.forEach(doc => {
      sessions.push({ id: doc.id, ...doc.data() } as Session);
    });

    // Sort by date descending
    return sessions.sort((a, b) => b.sessionDate.toMillis() - a.sessionDate.toMillis());
  }

  // Update session status
  static async updateSessionStatus(sessionId: string, status: Session['status']): Promise<void> {
    const sessionRef = doc(firestore, this.SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      status,
      updatedAt: Timestamp.now()
    });
  }

  // Submit feedback for a session
  static async submitFeedback(sessionId: string, feedbackData: FeedbackFormData): Promise<void> {
    const batch = writeBatch(firestore);
    
    // Create feedback document
    const feedbackRef = doc(collection(firestore, this.SESSIONS_COLLECTION, sessionId, this.FEEDBACK_COLLECTION));
    const feedback: SessionFeedback = {
      feedbackId: feedbackRef.id,
      giverUserId: feedbackData.giverUserId,
      receiverUserId: feedbackData.receiverUserId,
      submittedAt: Timestamp.now(),
      feedbackType: feedbackData.feedbackType
    };
    
    batch.set(feedbackRef, feedback);
    
    // Create question documents
    feedbackData.questions.forEach(questionData => {
      const questionRef = doc(collection(firestore, this.SESSIONS_COLLECTION, sessionId, this.FEEDBACK_COLLECTION, feedbackRef.id, this.QUESTIONS_COLLECTION));
      const question: FeedbackQuestion = {
        questionId: questionRef.id,
        question: questionData.question,
        response: questionData.response,
        notes: questionData.notes,
        questionType: questionData.questionType
      };
      batch.set(questionRef, question);
    });
    
    // Update session feedback tracking
    const sessionRef = doc(firestore, this.SESSIONS_COLLECTION, sessionId);
    const updateData: Partial<Session> = {
      updatedAt: Timestamp.now()
    };
    
    if (feedbackData.feedbackType === 'mentor') {
      updateData.feedbackSubmitted_mentor = true;
    } else if (feedbackData.feedbackType === 'mentee') {
      updateData.feedbackSubmitted_mentee = true;
    }
    
    batch.update(sessionRef, updateData);
    
    await batch.commit();
  }

  // Get feedback for a session
  static async getSessionFeedback(sessionId: string): Promise<SessionFeedback[]> {
    const feedbackQuery = query(
      collection(firestore, this.SESSIONS_COLLECTION, sessionId, this.FEEDBACK_COLLECTION),
      orderBy('submittedAt', 'desc')
    );
    
    const feedbackDocs = await getDocs(feedbackQuery);
    return feedbackDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionFeedback));
  }

  // Get questions for specific feedback
  static async getFeedbackQuestions(sessionId: string, feedbackId: string): Promise<FeedbackQuestion[]> {
    const questionsQuery = query(
      collection(firestore, this.SESSIONS_COLLECTION, sessionId, this.FEEDBACK_COLLECTION, feedbackId, this.QUESTIONS_COLLECTION)
    );
    
    const questionDocs = await getDocs(questionsQuery);
    return questionDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackQuestion));
  }

  // Check if user has already submitted feedback for a session
  static async hasUserSubmittedFeedback(sessionId: string, userId: string, feedbackType: 'mentor' | 'mentee'): Promise<boolean> {
    const feedbackQuery = query(
      collection(firestore, this.SESSIONS_COLLECTION, sessionId, this.FEEDBACK_COLLECTION),
      where('giverUserId', '==', userId),
      where('feedbackType', '==', feedbackType)
    );
    
    const feedbackDocs = await getDocs(feedbackQuery);
    return !feedbackDocs.empty;
  }
}
