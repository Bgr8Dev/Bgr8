/**
 * Logger Utility
 * 
 * Centralized logging utility that respects console configuration.
 * Use this instead of direct console.* calls throughout the application.
 */

import { isLoggingEnabled, LogCategory } from '../config/consoleConfig';

/**
 * Logger interface matching console methods
 */
export interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label?: string) => void;
  groupEnd: () => void;
  groupCollapsed: (label?: string) => void;
  table: (data: unknown) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

/**
 * Create a logger instance for a specific category
 */
export function createLogger(category: LogCategory = 'other'): Logger {
  // Store reference to original console methods
  const originalConsole = console;
  
  return {
    log: (...args: unknown[]) => {
      if (isLoggingEnabled(category) && isLoggingEnabled('log')) {
        originalConsole.log(...args);
      }
    },
    
    error: (...args: unknown[]) => {
      if (isLoggingEnabled(category) && isLoggingEnabled('error')) {
        originalConsole.error(...args);
      }
    },
    
    warn: (...args: unknown[]) => {
      if (isLoggingEnabled(category) && isLoggingEnabled('warn')) {
        originalConsole.warn(...args);
      }
    },
    
    info: (...args: unknown[]) => {
      if (isLoggingEnabled(category) && isLoggingEnabled('info')) {
        originalConsole.info(...args);
      }
    },
    
    debug: (...args: unknown[]) => {
      if (isLoggingEnabled(category) && isLoggingEnabled('debug')) {
        originalConsole.debug(...args);
      }
    },
    
    group: (label?: string) => {
      if (isLoggingEnabled(category)) {
        originalConsole.group(label);
      }
    },
    
    groupEnd: () => {
      if (isLoggingEnabled(category)) {
        originalConsole.groupEnd();
      }
    },
    
    groupCollapsed: (label?: string) => {
      if (isLoggingEnabled(category)) {
        originalConsole.groupCollapsed(label);
      }
    },
    
    table: (data: unknown) => {
      if (isLoggingEnabled(category)) {
        originalConsole.table(data);
      }
    },
    
    time: (label: string) => {
      if (isLoggingEnabled(category)) {
        originalConsole.time(label);
      }
    },
    
    timeEnd: (label: string) => {
      if (isLoggingEnabled(category)) {
        originalConsole.timeEnd(label);
      }
    },
  };
}

/**
 * Default logger instance (category: 'other')
 */
export const logger = createLogger('other');

/**
 * Pre-configured loggers for common categories
 */
export const loggers = {
  analytics: createLogger('analytics'),
  firebase: createLogger('firebase'),
  api: createLogger('api'),
  auth: createLogger('auth'),
  booking: createLogger('booking'),
  email: createLogger('email'),
  config: createLogger('config'),
  error: createLogger('error'),
  warn: createLogger('warn'),
  info: createLogger('info'),
  debug: createLogger('debug'),
  log: createLogger('log'),
};

/**
 * Convenience function for logging with a specific category
 */
export function log(category: LogCategory, ...args: unknown[]): void {
  const categoryLogger = createLogger(category);
  categoryLogger.log(...args);
}

/**
 * Convenience function for error logging with a specific category
 */
export function logError(category: LogCategory, ...args: unknown[]): void {
  const categoryLogger = createLogger(category);
  categoryLogger.error(...args);
}

/**
 * Convenience function for warning logging with a specific category
 */
export function logWarn(category: LogCategory, ...args: unknown[]): void {
  const categoryLogger = createLogger(category);
  categoryLogger.warn(...args);
}

/**
 * Convenience function for info logging with a specific category
 */
export function logInfo(category: LogCategory, ...args: unknown[]): void {
  const categoryLogger = createLogger(category);
  categoryLogger.info(...args);
}

/**
 * Convenience function for debug logging with a specific category
 */
export function logDebug(category: LogCategory, ...args: unknown[]): void {
  const categoryLogger = createLogger(category);
  categoryLogger.debug(...args);
}

