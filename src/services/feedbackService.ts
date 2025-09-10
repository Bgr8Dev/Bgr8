import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { firestore, storage } from '../firebase/firebase';
import {
  FeedbackTicket,
  FeedbackComment,
  FeedbackStats,
  FeedbackFilters,
  CreateFeedbackTicketData,
  UpdateFeedbackTicketData,
  CreateFeedbackCommentData,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackCategory
} from '../types/feedback';

const FEEDBACK_COLLECTION = 'feedbackTickets';
const COMMENTS_COLLECTION = 'feedbackComments';
const STORAGE_BASE_PATH = 'feedback-attachments';

export class FeedbackService {
  /**
   * Upload files to Firebase Storage
   */
  static async uploadFiles(files: File[], ticketId: string): Promise<FeedbackAttachment[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileName = `${fileId}-${file.name}`;
        const storageRef = ref(storage, `${STORAGE_BASE_PATH}/${ticketId}/${fileName}`);
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Determine file type
        let fileType: 'image' | 'video' | 'document' | 'other' = 'other';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
          fileType = 'document';
        }
        
        return {
          id: fileId,
          name: file.name,
          url: downloadURL,
          type: fileType,
          size: file.size,
          uploadedAt: new Date()
        };
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new Error('Failed to upload files');
    }
  }

  /**
   * Delete files from Firebase Storage
   */
  static async deleteFiles(attachments: FeedbackAttachment[]): Promise<void> {
    try {
      const deletePromises = attachments.map(async (attachment) => {
        const fileRef = ref(storage, attachment.url);
        await deleteObject(fileRef);
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting files:', error);
      // Don't throw error here as files might already be deleted
    }
  }

  /**
   * Create a new feedback ticket
   */
  static async createTicket(
    ticketData: CreateFeedbackTicketData,
    reporterId: string,
    reporterName: string,
    reporterEmail: string
  ): Promise<string> {
    try {
      // First create the ticket to get the ID
      const ticketRef = await addDoc(collection(firestore, FEEDBACK_COLLECTION), {
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'open' as FeedbackStatus,
        reporterId,
        reporterName,
        reporterEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ticketData.tags || [],
        attachments: [],
        comments: [],
        votes: 0,
        upvoters: [],
        downvoters: []
      });

      const ticketId = ticketRef.id;

      // Upload files if any
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        try {
          const uploadedAttachments = await this.uploadFiles(ticketData.attachments, ticketId);
          
          // Update the ticket with attachment URLs
          await updateDoc(ticketRef, {
            attachments: uploadedAttachments,
            updatedAt: serverTimestamp()
          });
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          // Don't fail the entire operation if file upload fails
          // The ticket is already created, just without attachments
        }
      }

      return ticketId;
    } catch (error) {
      console.error('Error creating feedback ticket:', error);
      throw new Error('Failed to create feedback ticket');
    }
  }

  /**
   * Get all feedback tickets with optional filtering
   */
  static async getTickets(filters?: FeedbackFilters): Promise<FeedbackTicket[]> {
    try {
      let q = query(collection(firestore, FEEDBACK_COLLECTION));

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }
      if (filters?.priority && filters.priority.length > 0) {
        q = query(q, where('priority', 'in', filters.priority));
      }
      if (filters?.category && filters.category.length > 0) {
        q = query(q, where('category', 'in', filters.category));
      }
      if (filters?.assignedTo && filters.assignedTo.length > 0) {
        q = query(q, where('assignedTo', 'in', filters.assignedTo));
      }
      if (filters?.reporterId) {
        q = query(q, where('reporterId', '==', filters.reporterId));
      }

      // Order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const tickets: FeedbackTicket[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const ticket: FeedbackTicket = {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          reporterId: data.reporterId,
          reporterName: data.reporterName,
          reporterEmail: data.reporterEmail,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
          tags: data.tags || [],
          attachments: data.attachments || [],
          comments: data.comments || [],
          votes: data.votes || 0,
          upvoters: data.upvoters || [],
          downvoters: data.downvoters || [],
          duplicateOf: data.duplicateOf,
          relatedTickets: data.relatedTickets || []
        };
        tickets.push(ticket);
      }

      // Apply client-side filters
      let filteredTickets = tickets;

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        filteredTickets = filteredTickets.filter(ticket =>
          filters.tags!.some(tag => ticket.tags.includes(tag))
        );
      }

      if (filters?.dateRange) {
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.createdAt >= filters.dateRange!.start &&
          ticket.createdAt <= filters.dateRange!.end
        );
      }

      return filteredTickets;
    } catch (error) {
      console.error('Error fetching feedback tickets:', error);
      throw new Error('Failed to fetch feedback tickets');
    }
  }

  /**
   * Get a single feedback ticket by ID
   */
  static async getTicket(ticketId: string): Promise<FeedbackTicket | null> {
    try {
      const ticketDoc = await getDoc(doc(firestore, FEEDBACK_COLLECTION, ticketId));
      
      if (!ticketDoc.exists()) {
        return null;
      }

      const data = ticketDoc.data();
      return {
        id: ticketDoc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        reporterEmail: data.reporterEmail,
        assignedTo: data.assignedTo,
        assignedToName: data.assignedToName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        resolvedAt: data.resolvedAt?.toDate(),
        tags: data.tags || [],
        attachments: data.attachments || [],
        comments: data.comments || [],
        votes: data.votes || 0,
        upvoters: data.upvoters || [],
        downvoters: data.downvoters || [],
        duplicateOf: data.duplicateOf,
        relatedTickets: data.relatedTickets || []
      };
    } catch (error) {
      console.error('Error fetching feedback ticket:', error);
      throw new Error('Failed to fetch feedback ticket');
    }
  }

  /**
   * Update a feedback ticket
   */
  static async updateTicket(
    ticketId: string,
    updateData: UpdateFeedbackTicketData
  ): Promise<void> {
    try {
      const ticketRef = doc(firestore, FEEDBACK_COLLECTION, ticketId);
      const updateFields: any = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      // If status is being changed to resolved or closed, set resolvedAt
      if (updateData.status === 'resolved' || updateData.status === 'closed') {
        updateFields.resolvedAt = serverTimestamp();
      }

      await updateDoc(ticketRef, updateFields);
    } catch (error) {
      console.error('Error updating feedback ticket:', error);
      throw new Error('Failed to update feedback ticket');
    }
  }

  /**
   * Delete a feedback ticket
   */
  static async deleteTicket(ticketId: string): Promise<void> {
    try {
      // Get the ticket first to access attachments
      const ticketDoc = await getDoc(doc(firestore, FEEDBACK_COLLECTION, ticketId));
      
      if (ticketDoc.exists()) {
        const ticketData = ticketDoc.data();
        
        // Delete associated files
        if (ticketData.attachments && ticketData.attachments.length > 0) {
          await this.deleteFiles(ticketData.attachments);
        }
      }
      
      // Delete the ticket
      await deleteDoc(doc(firestore, FEEDBACK_COLLECTION, ticketId));
      
      // Delete associated comments
      const commentsQuery = query(
        collection(firestore, COMMENTS_COLLECTION),
        where('ticketId', '==', ticketId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const batch = writeBatch(firestore);
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting feedback ticket:', error);
      throw new Error('Failed to delete feedback ticket');
    }
  }

  /**
   * Add a comment to a feedback ticket
   */
  static async addComment(
    ticketId: string,
    commentData: CreateFeedbackCommentData,
    authorId: string,
    authorName: string
  ): Promise<string> {
    try {
      const commentRef = await addDoc(collection(firestore, COMMENTS_COLLECTION), {
        ticketId,
        authorId,
        authorName,
        content: commentData.content,
        isInternal: commentData.isInternal || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attachments: []
      });

      // Update the ticket's updatedAt timestamp
      await updateDoc(doc(firestore, FEEDBACK_COLLECTION, ticketId), {
        updatedAt: serverTimestamp()
      });

      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Vote on a feedback ticket
   */
  static async voteTicket(
    ticketId: string,
    userId: string,
    voteType: 'up' | 'down'
  ): Promise<void> {
    try {
      const ticketRef = doc(firestore, FEEDBACK_COLLECTION, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }

      const data = ticketDoc.data();
      const upvoters = data.upvoters || [];
      const downvoters = data.downvoters || [];
      let votes = data.votes || 0;

      // Remove user from both arrays first
      const newUpvoters = upvoters.filter((id: string) => id !== userId);
      const newDownvoters = downvoters.filter((id: string) => id !== userId);

      // Add user to appropriate array and update vote count
      if (voteType === 'up') {
        newUpvoters.push(userId);
        votes = newUpvoters.length - newDownvoters.length;
      } else {
        newDownvoters.push(userId);
        votes = newUpvoters.length - newDownvoters.length;
      }

      await updateDoc(ticketRef, {
        upvoters: newUpvoters,
        downvoters: newDownvoters,
        votes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error voting on ticket:', error);
      throw new Error('Failed to vote on ticket');
    }
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const tickets = await this.getTickets();
      
      const stats: FeedbackStats = {
        total: tickets.length,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        duplicate: 0,
        byCategory: {
          bug: 0,
          feature_request: 0,
          ui_issue: 0,
          performance: 0,
          security: 0,
          accessibility: 0,
          other: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        byStatus: {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          duplicate: 0
        },
        averageResolutionTime: 0,
        topReporters: []
      };

      // Count tickets by status
      tickets.forEach(ticket => {
        stats.byStatus[ticket.status]++;
        stats.byCategory[ticket.category]++;
        stats.byPriority[ticket.priority]++;
      });

      // Calculate average resolution time
      const resolvedTickets = tickets.filter(t => t.resolvedAt);
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
          const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
          return sum + resolutionTime;
        }, 0);
        stats.averageResolutionTime = totalResolutionTime / (resolvedTickets.length * 1000 * 60 * 60); // Convert to hours
      }

      // Get top reporters
      const reporterCounts: Record<string, { name: string; count: number }> = {};
      tickets.forEach(ticket => {
        if (reporterCounts[ticket.reporterId]) {
          reporterCounts[ticket.reporterId].count++;
        } else {
          reporterCounts[ticket.reporterId] = {
            name: ticket.reporterName,
            count: 1
          };
        }
      });

      stats.topReporters = Object.entries(reporterCounts)
        .map(([reporterId, data]) => ({
          reporterId,
          reporterName: data.name,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw new Error('Failed to fetch feedback statistics');
    }
  }

  /**
   * Get all available tags
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const tickets = await this.getTickets();
      const allTags = new Set<string>();
      
      tickets.forEach(ticket => {
        ticket.tags.forEach(tag => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Failed to fetch tags');
    }
  }
}
