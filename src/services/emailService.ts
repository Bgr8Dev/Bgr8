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

export class EmailService {
  private static readonly TEMPLATES_COLLECTION = 'email-templates';
  private static readonly DRAFTS_COLLECTION = 'email-drafts';
  private static readonly SENT_EMAILS_COLLECTION = 'sent-emails';
  private static readonly RECIPIENT_GROUPS_COLLECTION = 'recipient-groups';

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
      const docRef = await addDoc(templatesRef, {
        ...template,
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
      const docRef = await addDoc(draftsRef, {
        ...draft,
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
      const docRef = await addDoc(sentRef, sentEmail);
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
   * Send email (mock implementation)
   */
  static async sendEmail(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Mock email sending - replace with actual email service integration
      console.log('Sending email:', draft);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success response
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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

      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: 'Failed to send email' };
    }
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
}
