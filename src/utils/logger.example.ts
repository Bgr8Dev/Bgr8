/**
 * Logger Usage Examples
 * 
 * This file demonstrates how to use the logger utility throughout the codebase.
 * This is an example file - you can reference it but don't import it.
 * 
 * Note: This file contains example code with placeholder variables for demonstration purposes.
 */

// ============================================
// Basic Usage
// ============================================

import { logger, loggers } from './logger';

// General logging
logger.log('General log message');
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');

// ============================================
// Category-Specific Logging
// ============================================

// Analytics logs (can be disabled separately)
loggers.analytics.log('User clicked button');
loggers.analytics.info('Page view tracked');

// Firebase logs
const firebaseError = new Error('Firebase connection failed');
loggers.firebase.log('Firebase operation started');
loggers.firebase.error('Firebase error:', firebaseError);

// API logs
loggers.api.log('API request:', { method: 'GET', url: '/api/users' });
const apiError = new Error('API request failed');
loggers.api.error('API error:', apiError);

// Auth logs
loggers.auth.log('User authenticated');
loggers.auth.warn('Authentication failed');

// Booking logs
const bookingId = 'booking-123';
loggers.booking.log('Booking created:', bookingId);
const bookingError = new Error('Booking creation failed');
loggers.booking.error('Booking error:', bookingError);

// Email logs
loggers.email.log('Email sent successfully');
const emailError = new Error('Email sending failed');
loggers.email.error('Email sending failed:', emailError);

// Config logs
loggers.config.log('Configuration loaded');

// ============================================
// Advanced Usage
// ============================================

import { createLogger, log, logError, logWarn } from './logger';

// Create a custom logger for a specific category
const customLogger = createLogger('other');
customLogger.log('Custom log message');

// Use convenience functions
log('api', 'API call made');
const bookingError2 = new Error('Booking failed');
logError('booking', 'Booking failed:', bookingError2);
logWarn('auth', 'Authentication warning');

// ============================================
// Runtime Configuration
// ============================================

import { setConsoleConfig, getConsoleConfig, resetConsoleConfig } from '../config/consoleConfig';

// Update configuration at runtime
setConsoleConfig({
  enabled: true,
  enableInProduction: false,
  categories: {
    analytics: false,  // Disable analytics logs
    error: true,       // Always show errors
    warn: true,        // Always show warnings
    api: true,         // Enable API logs
  }
});

// Get current configuration
const consoleConfig = getConsoleConfig();
console.log('Current config:', consoleConfig);

// Reset to defaults
resetConsoleConfig();

// ============================================
// Migration Examples
// ============================================

// BEFORE (direct console calls):
// console.log('Email config loaded:', config);
// console.error('Error saving booking:', error);
// console.warn('API rate limit approaching');

// AFTER (using logger):
const emailConfig = { apiUrl: 'http://localhost:3001' };
loggers.email.log('Email config loaded:', emailConfig);
const saveError = new Error('Failed to save booking');
loggers.booking.error('Error saving booking:', saveError);
loggers.api.warn('API rate limit approaching');

// ============================================
// Grouping Logs
// ============================================

const apiLogger = loggers.api;
apiLogger.group('API Request Details');
apiLogger.log('Method: GET');
apiLogger.log('URL: /api/users');
const headers = { 'Content-Type': 'application/json' };
apiLogger.log('Headers:', headers);
apiLogger.groupEnd();

// Collapsed groups
apiLogger.groupCollapsed('Response Data');
apiLogger.log('Status: 200');
const responseData = { users: [] };
apiLogger.log('Data:', responseData);
apiLogger.groupEnd();

// ============================================
// Performance Timing
// ============================================

const perfLogger = loggers.api;
perfLogger.time('API Request');
// ... perform API call ...
perfLogger.timeEnd('API Request'); // Logs: "API Request: 123.456ms"

// ============================================
// Table Display
// ============================================

const dataLogger = loggers.api;
const users = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
];
dataLogger.table(users); // Displays as a table in console

