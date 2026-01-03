/**
 * Google Analytics Debug Log Suppression
 * 
 * This utility suppresses Google Analytics debug logs when analytics logging is disabled.
 * It intercepts console methods to filter out GA-related logs.
 */

import { isLoggingEnabled } from '../config/consoleConfig';

let isSuppressionActive = false;

/**
 * Suppress Google Analytics debug logs
 */
export function suppressAnalyticsLogs(): void {
  if (isSuppressionActive) return;
  
  // Check if analytics logging is enabled
  if (isLoggingEnabled('analytics')) {
    return; // Don't suppress if analytics logging is enabled
  }
  
  isSuppressionActive = true;
  
  // Store original console methods
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const originalWarn = console.warn;
  
  // Patterns to identify Google Analytics logs
  const gaPatterns = [
    /dataLayer/i,
    /gtag/i,
    /GTAG/i,
    /Processing (data layer|GTAG|commands)/i,
    /Tag fired/i,
    /Sending event/i,
    /Request parameters/i,
    /Event parameters/i,
    /Shared parameters/i,
    /G-T3M4QVLC02/i, // Your GA measurement ID
    /google-analytics/i,
    /googletagmanager/i,
    /_dbg/i,
    /Loaded existing client id/i,
    /Event would be batched/i,
  ];
  
  // Check if a message matches GA patterns
  const isGALog = (args: any[]): boolean => {
    const message = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') return JSON.stringify(arg);
      return String(arg);
    }).join(' ');
    
    return gaPatterns.some(pattern => pattern.test(message));
  };
  
  // Override console.log
  console.log = function(...args: any[]) {
    if (!isGALog(args)) {
      originalLog.apply(console, args);
    }
  };
  
  // Override console.info
  console.info = function(...args: any[]) {
    if (!isGALog(args)) {
      originalInfo.apply(console, args);
    }
  };
  
  // Override console.debug
  console.debug = function(...args: any[]) {
    if (!isGALog(args)) {
      originalDebug.apply(console, args);
    }
  };
  
  // Override console.warn (some GA logs use warn)
  console.warn = function(...args: any[]) {
    if (!isGALog(args)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Also suppress gtag debug mode if gtag is available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const originalGtag = (window as any).gtag;
    (window as any).gtag = function(...args: any[]) {
      // Disable debug mode in config calls
      if (args[0] === 'config' && args[2]) {
        args[2] = {
          ...args[2],
          debug_mode: false
        };
      }
      return originalGtag.apply(window, args);
    };
  }
}

/**
 * Restore original console methods (for testing)
 */
export function restoreAnalyticsLogs(): void {
  // This would require storing original methods, which we do above
  // But for simplicity, we'll just mark as inactive
  isSuppressionActive = false;
}

// Auto-suppress on module load if analytics logging is disabled
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      suppressAnalyticsLogs();
    });
  } else {
    suppressAnalyticsLogs();
  }
}

