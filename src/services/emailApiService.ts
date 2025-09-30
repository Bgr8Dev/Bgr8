/**
 * Email API Service
 * 
 * This service handles email sending through a secure backend API.
 * It communicates with the backend to send emails using Zoho Mail.
 */

export interface EmailApiConfig {
  apiBaseUrl: string;
  apiKey: string;
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

  /**
   * Initialize Email API configuration
   */
  static initialize(config: EmailApiConfig): void {
    this.config = config;
  }

  /**
   * Send email through backend API
   */
  static async sendEmail(message: EmailApiMessage): Promise<EmailApiResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'Email API not initialized'
      };
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(message),
        // Add timeout and credentials for production
        signal: AbortSignal.timeout(30000), // 30 second timeout
        mode: 'cors', // Ensure CORS is handled properly
        credentials: 'omit', // Don't send cookies
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId,
        details: result
      };

    } catch (error) {
      console.error('Error sending email via API:', error);
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
    if (!this.config) {
      return messages.map(() => ({
        success: false,
        error: 'Email API not initialized'
      }));
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/email/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
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
      console.error('Error sending bulk emails via API:', error);
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
    if (!this.config) {
      return { success: false, error: 'Email API not initialized' };
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
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
      console.error('Error testing email configuration:', error);
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
    if (!this.config) {
      return { success: false, error: 'Email API not initialized' };
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/email/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
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
      console.error('Error getting email stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email stats'
      };
    }
  }
}
