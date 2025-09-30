/**
 * Email Configuration
 * 
 * This file contains configuration for the frontend email service.
 * NOTE: Zoho credentials are stored ONLY in the backend server for security.
 * The frontend only needs the API URL and API key to communicate with the backend.
 */

export interface EmailConfig {
  apiBaseUrl: string;
  apiKey: string;
}

// Frontend email configuration
export const emailConfig: EmailConfig = {
  // Backend API configuration (only these are needed in frontend)
  apiBaseUrl: import.meta.env.VITE_EMAIL_API_BASE_URL || 'http://localhost:3001',
  apiKey: import.meta.env.VITE_EMAIL_API_KEY || 'your_api_key_here',
};

// Validate frontend email configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Only validate frontend requirements
  if (!emailConfig.apiBaseUrl) {
    errors.push('Email API base URL not configured');
  }
  
  if (!emailConfig.apiKey || emailConfig.apiKey === 'your_api_key_here') {
    errors.push('Email API key not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
