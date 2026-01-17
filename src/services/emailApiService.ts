/**
 * Email API Service
 * 
 * This service handles email sending through a secure backend API.
 * It communicates with the backend to send emails using Zoho Mail.
 */

import { auth } from '../firebase/firebase';
import { loggers } from '../utils/logger';

export interface EmailApiConfig {
  apiBaseUrl: string;
}

export interface EmailApiMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  contentType: 'text/plain' | 'text/html';
  fromEmail?: string;
  fromName?: string;
  attachments?: {
    fileName: string;
    content: string; // base64 encoded
    contentType: string;
  }[];
}

export interface EmailStats {
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  lastSent?: string;
  quota: {
    used: number;
    total: number;
  };
}

export interface EmailApiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: EmailStats | Record<string, unknown>;
}

export class EmailApiService {
  private static config: EmailApiConfig | null = null;

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  private static ensureConfig(): EmailApiConfig {
    if (!this.config) {
      throw new Error('Email API not initialized');
    }
    return this.config;
  }

  /**
   * Initialize Email API configuration
   */
  static initialize(config: EmailApiConfig): void {
    this.config = config;
    loggers.email.log('🚀 Email API Service initialized with config:', {
      apiBaseUrl: config.apiBaseUrl,
    });
  }

  /**
   * Fetch helper with Firebase auth
   */
  static async fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
    const config = this.ensureConfig();
    const authHeaders = await this.getAuthHeaders();
    const headers = {
      ...(init.headers || {}),
      ...authHeaders
    } as Record<string, string>;
    return fetch(`${config.apiBaseUrl}${path}`, { ...init, headers });
  }

  /**
   * Test connection to email API server
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.ensureConfig();
      const healthUrl = `${config.apiBaseUrl}/api/health`;
      loggers.email.log('🏥 Testing email server connection:', healthUrl);
      
      const response = await this.fetchWithAuth('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        loggers.email.log('✅ Email server is running and accessible');
        return { success: true };
      } else {
        loggers.email.warn('❌ Email server responded with error:', response.status, response.statusText);
        return { 
          success: false, 
          error: `Server responded with ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      loggers.email.error('❌ Email server connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Send email through backend API
   */
  static async sendEmail(message: EmailApiMessage): Promise<EmailApiResponse> {
    try {
      // Validate email message
      if (!message.to || message.to.length === 0) {
        throw new Error('No recipients specified');
      }
      
      if (!message.subject || message.subject.trim() === '') {
        throw new Error('Email subject is required');
      }
      
      if (!message.content || message.content.trim() === '') {
        throw new Error('Email content is required');
      }
      
      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = message.to.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      const config = this.ensureConfig();
      const apiUrl = `${config.apiBaseUrl}/api/email/send`;
      loggers.email.log('🔗 Attempting to send email to:', apiUrl);
      loggers.email.log('📧 Email message:', message);
      
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(message),
        // Add timeout and credentials for production
        // Increased timeout for SMTP which can take longer
        signal: AbortSignal.timeout(60000), // 60 second timeout (SMTP can be slow)
        mode: 'cors', // Ensure CORS is handled properly
        credentials: 'omit', // Don't send cookies
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Failed to parse error response' };
        }
        
        loggers.email.error('❌ Email API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestUrl: apiUrl,
          requestBody: message
        });
        
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.message || errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId,
        details: result
      };

    } catch (error) {
      loggers.email.error('Error sending email via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send bulk emails through backend API
   */
  static async sendBulkEmail(messages: EmailApiMessage[]): Promise<EmailApiResponse[]> {
    try {
      const config = this.ensureConfig();
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${config.apiBaseUrl}/api/email/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(60000), // 60 second timeout for bulk
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.results || [];

    } catch (error) {
      loggers.email.error('Error sending bulk emails via API:', error);
      return messages.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bulk emails'
      }));
    }
  }

  /**
   * Test email configuration
   */
  static async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.ensureConfig();
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${config.apiBaseUrl}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for test
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return { success: result.success, error: result.error };

    } catch (error) {
      loggers.email.error('Error testing email configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test configuration'
      };
    }
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(): Promise<{ success: boolean; data?: EmailStats; error?: string }> {
    try {
      const config = this.ensureConfig();
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${config.apiBaseUrl}/api/email/stats`, {
        method: 'GET',
        headers: {
          ...authHeaders,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout for stats
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      loggers.email.error('Error getting email stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email stats'
      };
    }
  }
}
