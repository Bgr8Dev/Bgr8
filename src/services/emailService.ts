/**
 * Email Service
 * 
 * This service manages email templates, drafts, and sent emails in Firebase.
 * It provides CRUD operations for email management.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { EmailApiService, EmailApiMessage } from './emailApiService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
}

export interface EmailDraft {
  id: string;
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  templateId?: string;
  isScheduled: boolean;
  scheduledDate?: Date;
  priority: 'low' | 'normal' | 'high';
  trackOpens: boolean;
  trackClicks: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
}

export interface SentEmail {
  id: string;
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  templateId?: string;
  sentAt: Date;
  sentBy: string;
  status: 'sent' | 'failed' | 'partial';
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
}

export interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  count: number;
  type: 'all' | 'admins' | 'mentors' | 'mentees' | 'students' | 'custom';
  filters?: {
    roles?: string[];
    status?: string[];
    lastActive?: Date;
  };
}

export interface Recipient {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  groups: string[]; // Array of group IDs this recipient belongs to
  isActive: boolean;
  isVerified: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;
  metadata?: {
    source?: string; // 'manual', 'import', 'signup', etc.
    unsubscribeToken?: string;
    bounceCount?: number;
    complaintCount?: number;
  };
}

export class EmailService {
  private static readonly TEMPLATES_COLLECTION = 'email-templates';
  private static readonly DRAFTS_COLLECTION = 'email-drafts';
  private static readonly SENT_EMAILS_COLLECTION = 'sent-emails';
  private static readonly RECIPIENT_GROUPS_COLLECTION = 'recipient-groups';
  private static readonly RECIPIENTS_COLLECTION = 'recipients';

  /**
   * Initialize email service with API configuration
   */
  static initializeEmailApi(config: { apiBaseUrl: string; apiKey: string }): void {
    EmailApiService.initialize(config);
  }

  /**
   * Test email server connection
   */
  static async testEmailServerConnection(): Promise<{ success: boolean; error?: string }> {
    return await EmailApiService.testConnection();
  }

  /**
   * Get all email templates
   */
  static async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const templatesRef = collection(firestore, this.TEMPLATES_COLLECTION);
      const q = query(templatesRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as EmailTemplate;
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error('Failed to load email templates');
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const templateRef = doc(firestore, this.TEMPLATES_COLLECTION, templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        const data = templateDoc.data();
        return {
          id: templateDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as EmailTemplate;
      }
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      throw new Error('Failed to load email template');
    }
  }

  /**
   * Save email template
   */
  static async saveTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> {
    try {
      const templatesRef = collection(firestore, this.TEMPLATES_COLLECTION);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanTemplate = Object.fromEntries(
        Object.entries(template).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(templatesRef, {
        ...cleanTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usageCount: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error('Failed to save email template');
    }
  }

  /**
   * Update email template
   */
  static async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<void> {
    try {
      const templateRef = doc(firestore, this.TEMPLATES_COLLECTION, templateId);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update email template');
    }
  }

  /**
   * Delete email template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(firestore, this.TEMPLATES_COLLECTION, templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete email template');
    }
  }

  /**
   * Increment template usage count
   */
  static async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (template) {
        await this.updateTemplate(templateId, {
          usageCount: template.usageCount + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }

  /**
   * Get all email drafts
   */
  static async getDrafts(): Promise<EmailDraft[]> {
    try {
      const draftsRef = collection(firestore, this.DRAFTS_COLLECTION);
      const q = query(draftsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          scheduledDate: data.scheduledDate?.toDate()
        } as EmailDraft;
      });
    } catch (error) {
      console.error('Error getting drafts:', error);
      throw new Error('Failed to load email drafts');
    }
  }

  /**
   * Save email draft
   */
  static async saveDraft(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const draftsRef = collection(firestore, this.DRAFTS_COLLECTION);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanDraft = Object.fromEntries(
        Object.entries(draft).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(draftsRef, {
        ...cleanDraft,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error('Failed to save email draft');
    }
  }

  /**
   * Update email draft
   */
  static async updateDraft(draftId: string, updates: Partial<EmailDraft>): Promise<void> {
    try {
      const draftRef = doc(firestore, this.DRAFTS_COLLECTION, draftId);
      await updateDoc(draftRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating draft:', error);
      throw new Error('Failed to update email draft');
    }
  }

  /**
   * Delete email draft
   */
  static async deleteDraft(draftId: string): Promise<void> {
    try {
      const draftRef = doc(firestore, this.DRAFTS_COLLECTION, draftId);
      await deleteDoc(draftRef);
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw new Error('Failed to delete email draft');
    }
  }

  /**
   * Get sent emails
   */
  static async getSentEmails(): Promise<SentEmail[]> {
    try {
      const sentRef = collection(firestore, this.SENT_EMAILS_COLLECTION);
      const q = query(sentRef, orderBy('sentAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate() || new Date()
        } as SentEmail;
      });
    } catch (error) {
      console.error('Error getting sent emails:', error);
      throw new Error('Failed to load sent emails');
    }
  }

  /**
   * Save sent email record
   */
  static async saveSentEmail(sentEmail: Omit<SentEmail, 'id'>): Promise<string> {
    try {
      const sentRef = collection(firestore, this.SENT_EMAILS_COLLECTION);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanSentEmail = Object.fromEntries(
        Object.entries(sentEmail).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(sentRef, cleanSentEmail);
      return docRef.id;
    } catch (error) {
      console.error('Error saving sent email:', error);
      throw new Error('Failed to save sent email record');
    }
  }

  /**
   * Get recipient groups
   */
  static async getRecipientGroups(): Promise<RecipientGroup[]> {
    try {
      const groupsRef = collection(firestore, this.RECIPIENT_GROUPS_COLLECTION);
      const querySnapshot = await getDocs(groupsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive?.toDate()
      })) as unknown as RecipientGroup[];
    } catch (error) {
      console.error('Error getting recipient groups:', error);
      // Return default groups if Firebase fails
      return this.getDefaultRecipientGroups();
    }
  }

  /**
   * Get default recipient groups
   */
  static getDefaultRecipientGroups(): RecipientGroup[] {
    return [
      { id: 'all', name: 'All Users', description: 'All registered users', count: 1247, type: 'all' },
      { id: 'admins', name: 'Administrators', description: 'Admin users only', count: 12, type: 'admins' },
      { id: 'mentors', name: 'Mentors', description: 'Active mentors', count: 156, type: 'mentors' },
      { id: 'mentees', name: 'Mentees', description: 'Students with mentors', count: 892, type: 'mentees' },
      { id: 'students', name: 'Students', description: 'All students', count: 1103, type: 'students' }
    ];
  }

  /**
   * Send email through Zoho Mail API
   */
  static async sendEmail(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get all recipients (individual + groups)
      const allRecipients = await this.getAllRecipients(draft.recipients, draft.recipientGroups);
      
      if (allRecipients.length === 0) {
        return { success: false, error: 'No recipients specified' };
      }

      // Prepare email message for API
      const emailMessage: EmailApiMessage = {
        to: allRecipients,
        subject: draft.subject,
        content: draft.content,
        contentType: 'text/html',
        fromEmail: 'info@bgr8.uk',
        fromName: 'Bgr8 Team'
      };

      console.log('📧 Final email message being sent:', {
        to: emailMessage.to,
        subject: emailMessage.subject,
        contentLength: emailMessage.content?.length || 0,
        contentType: emailMessage.contentType,
        fromEmail: emailMessage.fromEmail,
        fromName: emailMessage.fromName
      });

      // Send email through API
      const result = await EmailApiService.sendEmail(emailMessage);
      
      if (result.success) {
        // Save sent email record
        await this.saveSentEmail({
          subject: draft.subject,
          content: draft.content,
          recipients: draft.recipients,
          recipientGroups: draft.recipientGroups,
          templateId: draft.templateId,
          sentAt: new Date(),
          sentBy: draft.createdBy,
          status: 'sent',
          openCount: 0,
          clickCount: 0,
          bounceCount: 0,
          unsubscribeCount: 0
        });

        // Increment template usage if applicable
        if (draft.templateId) {
          await this.incrementTemplateUsage(draft.templateId);
        }

        return { success: true, messageId: result.messageId };
      } else {
        // Save failed email record
        await this.saveSentEmail({
          subject: draft.subject,
          content: draft.content,
          recipients: draft.recipients,
          recipientGroups: draft.recipientGroups,
          templateId: draft.templateId,
          sentAt: new Date(),
          sentBy: draft.createdBy,
          status: 'failed',
          openCount: 0,
          clickCount: 0,
          bounceCount: 0,
          unsubscribeCount: 0
        });

        return { success: false, error: result.error || 'Failed to send email' };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Save failed email record
      try {
        await this.saveSentEmail({
          subject: draft.subject,
          content: draft.content,
          recipients: draft.recipients,
          recipientGroups: draft.recipientGroups,
          templateId: draft.templateId,
          sentAt: new Date(),
          sentBy: draft.createdBy,
          status: 'failed',
          openCount: 0,
          clickCount: 0,
          bounceCount: 0,
          unsubscribeCount: 0
        });
      } catch (saveError) {
        console.error('Error saving failed email record:', saveError);
      }

      return { success: false, error: 'Failed to send email' };
    }
  }

  /**
   * Get all recipients from individual emails and groups
   */
  private static async getAllRecipients(individualRecipients: string[], recipientGroups: string[]): Promise<string[]> {
    console.log('🔍 Getting all recipients:', {
      individualRecipients,
      recipientGroups
    });
    
    const allRecipients = [...individualRecipients];
    
    // Get recipients from groups
    for (const groupId of recipientGroups) {
      const group = await this.getRecipientGroupById(groupId);
      console.log(`📋 Group ${groupId}:`, group);
      if (group && group.recipients) {
        allRecipients.push(...group.recipients);
      }
    }
    
    // Remove duplicates
    const uniqueRecipients = Array.from(new Set(allRecipients));
    console.log('✅ Final recipients list:', uniqueRecipients);
    
    return uniqueRecipients;
  }

  /**
   * Get recipient group by ID (placeholder - implement based on your data structure)
   */
  private static async getRecipientGroupById(groupId: string): Promise<{ recipients: string[] } | null> {
    // This is a placeholder - you'll need to implement this based on your data structure
    // For now, return mock data for the default groups
    const defaultGroups: { [key: string]: { recipients: string[] } } = {
      'all': { recipients: [] }, // You'll need to populate this with actual user emails
      'admins': { recipients: [] }, // You'll need to populate this with admin emails
      'mentors': { recipients: [] }, // You'll need to populate this with mentor emails
      'mentees': { recipients: [] }, // You'll need to populate this with mentee emails
      'students': { recipients: [] } // You'll need to populate this with student emails
    };
    
    return defaultGroups[groupId] || null;
  }

  /**
   * Get email analytics
   */
  static async getEmailAnalytics(): Promise<{
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }> {
    try {
      const sentEmails = await this.getSentEmails();
      
      const totalSent = sentEmails.length;
      const totalOpens = sentEmails.reduce((sum, email) => sum + email.openCount, 0);
      const totalClicks = sentEmails.reduce((sum, email) => sum + email.clickCount, 0);
      const totalBounces = sentEmails.reduce((sum, email) => sum + email.bounceCount, 0);
      
      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;

      return {
        totalSent,
        totalOpens,
        totalClicks,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return {
        totalSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
      };
    }
  }

  // ========================================
  // RECIPIENT MANAGEMENT FUNCTIONS
  // ========================================

  /**
   * Get all recipients
   */
  static async getRecipients(): Promise<Recipient[]> {
    try {
      const recipientsRef = collection(firestore, this.RECIPIENTS_COLLECTION);
      const q = query(recipientsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate()
        } as Recipient;
      });
    } catch (error) {
      console.error('Error getting recipients:', error);
      throw new Error('Failed to load recipients');
    }
  }

  /**
   * Get recipient by ID
   */
  static async getRecipient(recipientId: string): Promise<Recipient | null> {
    try {
      const recipientRef = doc(firestore, this.RECIPIENTS_COLLECTION, recipientId);
      const recipientSnap = await getDoc(recipientRef);
      
      if (recipientSnap.exists()) {
        const data = recipientSnap.data();
        return {
          id: recipientSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate()
        } as Recipient;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting recipient:', error);
      throw new Error('Failed to load recipient');
    }
  }

  /**
   * Save recipient
   */
  static async saveRecipient(recipient: Omit<Recipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const recipientsRef = collection(firestore, this.RECIPIENTS_COLLECTION);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanRecipient = Object.fromEntries(
        Object.entries(recipient).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(recipientsRef, {
        ...cleanRecipient,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving recipient:', error);
      throw new Error('Failed to save recipient');
    }
  }

  /**
   * Update recipient
   */
  static async updateRecipient(recipientId: string, updates: Partial<Recipient>): Promise<void> {
    try {
      const recipientRef = doc(firestore, this.RECIPIENTS_COLLECTION, recipientId);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );
      
      await updateDoc(recipientRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating recipient:', error);
      throw new Error('Failed to update recipient');
    }
  }

  /**
   * Delete recipient
   */
  static async deleteRecipient(recipientId: string): Promise<void> {
    try {
      const recipientRef = doc(firestore, this.RECIPIENTS_COLLECTION, recipientId);
      await deleteDoc(recipientRef);
    } catch (error) {
      console.error('Error deleting recipient:', error);
      throw new Error('Failed to delete recipient');
    }
  }

  /**
   * Search recipients by email, name, or tags
   */
  static async searchRecipients(searchTerm: string): Promise<Recipient[]> {
    try {
      const recipients = await this.getRecipients();
      const term = searchTerm.toLowerCase();
      
      return recipients.filter(recipient => 
        recipient.email.toLowerCase().includes(term) ||
        recipient.name?.toLowerCase().includes(term) ||
        recipient.firstName?.toLowerCase().includes(term) ||
        recipient.lastName?.toLowerCase().includes(term) ||
        recipient.tags.some(tag => tag.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching recipients:', error);
      throw new Error('Failed to search recipients');
    }
  }

  /**
   * Get recipients by tags
   */
  static async getRecipientsByTags(tags: string[]): Promise<Recipient[]> {
    try {
      const recipients = await this.getRecipients();
      return recipients.filter(recipient => 
        tags.some(tag => recipient.tags.includes(tag))
      );
    } catch (error) {
      console.error('Error getting recipients by tags:', error);
      throw new Error('Failed to get recipients by tags');
    }
  }

  /**
   * Get recipients by group
   */
  static async getRecipientsByGroup(groupId: string): Promise<Recipient[]> {
    try {
      const recipients = await this.getRecipients();
      return recipients.filter(recipient => 
        recipient.groups.includes(groupId)
      );
    } catch (error) {
      console.error('Error getting recipients by group:', error);
      throw new Error('Failed to get recipients by group');
    }
  }

  /**
   * Add recipient to group
   */
  static async addRecipientToGroup(recipientId: string, groupId: string): Promise<void> {
    try {
      const recipient = await this.getRecipient(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      if (!recipient.groups.includes(groupId)) {
        await this.updateRecipient(recipientId, {
          groups: [...recipient.groups, groupId]
        });
      }
    } catch (error) {
      console.error('Error adding recipient to group:', error);
      throw new Error('Failed to add recipient to group');
    }
  }

  /**
   * Remove recipient from group
   */
  static async removeRecipientFromGroup(recipientId: string, groupId: string): Promise<void> {
    try {
      const recipient = await this.getRecipient(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      await this.updateRecipient(recipientId, {
        groups: recipient.groups.filter(id => id !== groupId)
      });
    } catch (error) {
      console.error('Error removing recipient from group:', error);
      throw new Error('Failed to remove recipient from group');
    }
  }

  /**
   * Update recipient last used timestamp
   */
  static async updateRecipientLastUsed(recipientId: string): Promise<void> {
    try {
      await this.updateRecipient(recipientId, {
        lastUsed: new Date()
      });
    } catch (error) {
      console.error('Error updating recipient last used:', error);
      // Don't throw error for this as it's not critical
    }
  }
}
