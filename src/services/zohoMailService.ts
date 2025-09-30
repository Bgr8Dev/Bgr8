/**
 * Zoho Mail Service
 * 
 * This service handles email sending through Zoho Mail API.
 * It provides secure email sending functionality for the admin portal.
 */

export interface ZohoEmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
}

export interface ZohoEmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  contentType: 'text/plain' | 'text/html';
  attachments?: ZohoAttachment[];
}

export interface ZohoAttachment {
  fileName: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface ZohoEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export class ZohoMailService {
  private static readonly ZOHO_API_BASE = 'https://mail.zoho.com/api';
  private static readonly ZOHO_OAUTH_BASE = 'https://accounts.zoho.com/oauth/v2';
  
  private static config: ZohoEmailConfig | null = null;

  /**
   * Initialize Zoho Mail configuration
   */
  static initialize(config: ZohoEmailConfig): void {
    this.config = config;
  }

  /**
   * Get access token using refresh token
   */
  private static async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error('Zoho Mail not initialized');
    }

    try {
      const response = await fetch(`${this.ZOHO_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting Zoho access token:', error);
      throw new Error('Failed to authenticate with Zoho Mail');
    }
  }

  /**
   * Send email through Zoho Mail API
   */
  static async sendEmail(message: ZohoEmailMessage): Promise<ZohoEmailResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'Zoho Mail not initialized'
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      // Prepare email data
      const emailData = {
        fromAddress: this.config.fromEmail,
        fromName: this.config.fromName,
        toAddress: message.to.join(','),
        ccAddress: message.cc?.join(',') || '',
        bccAddress: message.bcc?.join(',') || '',
        subject: message.subject,
        content: message.content,
        contentType: message.contentType,
        attachments: message.attachments || []
      };

      const response = await fetch(`${this.ZOHO_API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Zoho API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId || `zoho_${Date.now()}`,
        details: result
      };

    } catch (error) {
      console.error('Error sending email via Zoho:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send bulk emails (for recipient groups)
   */
  static async sendBulkEmail(
    messages: ZohoEmailMessage[],
    batchSize: number = 10
  ): Promise<ZohoEmailResponse[]> {
    const results: ZohoEmailResponse[] = [];
    
    // Process emails in batches to avoid rate limits
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(message => this.sendEmail(message));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Validate email configuration
   */
  static async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config) {
      return { valid: false, error: 'Configuration not initialized' };
    }

    try {
      const accessToken = await this.getAccessToken();
      
      // Test API access by getting account info
      const response = await fetch(`${this.ZOHO_API_BASE}/accounts`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      });

      if (!response.ok) {
        return { valid: false, error: 'Invalid credentials or API access denied' };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Configuration validation failed' 
      };
    }
  }

  /**
   * Get account information
   */
  static async getAccountInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Zoho Mail not initialized' };
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.ZOHO_API_BASE}/accounts`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error getting Zoho account info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account info'
      };
    }
  }
}
