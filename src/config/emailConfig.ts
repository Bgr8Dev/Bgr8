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
}

// Frontend email configuration
export const emailConfig: EmailConfig = {
  // Backend API configuration (only these are needed in frontend)
  // Always use the live email server - can be overridden via VITE_EMAIL_API_BASE_URL env var if needed
  apiBaseUrl: import.meta.env.VITE_EMAIL_API_BASE_URL || 'https://bgr8-email-server.onrender.com',
};

// Debug logging (using logger utility - respects console config)
loggers.config.log('🔧 Email Config Debug:', {
  env: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  viteEmailApiBaseUrl: import.meta.env.VITE_EMAIL_API_BASE_URL,
  finalApiBaseUrl: emailConfig.apiBaseUrl,
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
});

// Note: Always using live email server (https://bgr8-email-server.onrender.com)
// To use localhost for development, set VITE_EMAIL_API_BASE_URL=http://localhost:3001 in .env.local

// Final debug log
loggers.config.log('🎯 Final Email Config:', {
  apiBaseUrl: emailConfig.apiBaseUrl
});

// Validate frontend email configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Only validate frontend requirements
  if (!emailConfig.apiBaseUrl) {
    errors.push('Email API base URL not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
