/**
 * Email Configuration
 * 
 * This file contains configuration for the frontend email service.
 * NOTE: Zoho credentials are stored ONLY in the backend server for security.
 * The frontend only needs the API URL and API key to communicate with the backend.
 */

import { loggers } from '../utils/logger';

export interface EmailConfig {
  apiBaseUrl: string;
  apiKey: string;
}

// Frontend email configuration
export const emailConfig: EmailConfig = {
  // Backend API configuration (only these are needed in frontend)
  apiBaseUrl: import.meta.env.VITE_EMAIL_API_BASE_URL || 
    (import.meta.env.PROD ? 'https://bgr8-email-server.onrender.com' : 'http://localhost:3001'),
  apiKey: import.meta.env.VITE_EMAIL_API_KEY || 'your_api_key_here',
};

// Debug logging (using logger utility - respects console config)
loggers.config.log('🔧 Email Config Debug:', {
  env: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  viteEmailApiBaseUrl: import.meta.env.VITE_EMAIL_API_BASE_URL,
  finalApiBaseUrl: emailConfig.apiBaseUrl,
  apiKey: emailConfig.apiKey ? '***configured***' : 'NOT CONFIGURED',
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
});

// Override for localhost development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  loggers.config.log('🏠 Localhost detected - forcing local email server URL');
  emailConfig.apiBaseUrl = 'http://localhost:3001';
} else if (window.location.hostname.includes('dev') || window.location.hostname.includes('local')) {
  loggers.config.log('🏠 Development environment detected - forcing local email server URL');
  emailConfig.apiBaseUrl = 'http://localhost:3001';
}

// Manual override for development (uncomment to force localhost)
// emailConfig.apiBaseUrl = 'http://localhost:3001';
// loggers.config.log('🔧 Manual override: Forcing localhost email server');

// Final debug log
loggers.config.log('🎯 Final Email Config:', {
  apiBaseUrl: emailConfig.apiBaseUrl,
  apiKey: emailConfig.apiKey ? '***configured***' : 'NOT CONFIGURED'
});

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
