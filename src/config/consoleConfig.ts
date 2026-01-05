/**
 * Console Log Configuration
 * 
 * Centralized configuration for controlling console logging behavior across the application.
 * Supports environment-based defaults, category filtering, and granular control.
 */

export type LogCategory = 
  | 'all'           // All logs
  | 'error'         // console.error
  | 'warn'          // console.warn
  | 'info'          // console.info
  | 'log'           // console.log
  | 'debug'         // console.debug
  | 'analytics'     // Google Analytics, tracking, etc.
  | 'firebase'      // Firebase-related logs
  | 'api'           // API calls and responses
  | 'auth'          // Authentication-related logs
  | 'booking'      // Booking/Cal.com related logs
  | 'email'         // Email service logs
  | 'config'        // Configuration logs
  | 'other';        // Other/miscellaneous logs

export interface ConsoleConfig {
  /**
   * Master switch - if false, all logs are disabled regardless of other settings
   * Default: true for development, false for production
   */
  enabled: boolean;
  
  /**
   * Enable logs in development/local environment
   * Default: true
   */
  enableInDevelopment: boolean;
  
  /**
   * Enable logs in production environment
   * Default: false
   */
  enableInProduction: boolean;
  
  /**
   * Category-specific enable/disable flags
   * If a category is not specified, it defaults to the master 'enabled' setting
   */
  categories: {
    [K in LogCategory]?: boolean;
  };
}

/**
 * Get default configuration based on environment
 */
const getDefaultConfig = (): ConsoleConfig => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // Check for environment variable overrides
  const envEnabled = import.meta.env.VITE_CONSOLE_LOGS_ENABLED;
  const envDevEnabled = import.meta.env.VITE_CONSOLE_LOGS_DEV;
  const envProdEnabled = import.meta.env.VITE_CONSOLE_LOGS_PROD;
  
  // Determine if logs should be enabled
  let enabled = true;
  if (envEnabled !== undefined) {
    enabled = envEnabled === 'true' || envEnabled === '1';
  } else if (isProduction) {
    enabled = envProdEnabled === 'true' || envProdEnabled === '1' || false;
  } else if (isDevelopment) {
    enabled = envDevEnabled === 'true' || envDevEnabled === '1' || true;
  }
  
  return {
    enabled,
    enableInDevelopment: envDevEnabled !== undefined 
      ? (envDevEnabled === 'true' || envDevEnabled === '1')
      : true,
    enableInProduction: envProdEnabled !== undefined
      ? (envProdEnabled === 'true' || envProdEnabled === '1')
      : false,
    categories: {
      // By default, errors and warnings are enabled even in production
      error: true,
      warn: true,
      // Other categories follow the master enabled setting
      log: enabled,
      info: enabled,
      debug: enabled,
      analytics: import.meta.env.VITE_CONSOLE_LOGS_ANALYTICS === 'true' || import.meta.env.VITE_CONSOLE_LOGS_ANALYTICS === '1' || false,
      firebase: enabled,
      api: enabled,
      auth: enabled,
      booking: enabled,
      email: enabled,
      config: enabled,
      other: enabled,
    }
  };
};

/**
 * Current console configuration
 * Can be modified at runtime if needed
 */
let currentConfig: ConsoleConfig = getDefaultConfig();

/**
 * Update console configuration
 */
export function setConsoleConfig(config: Partial<ConsoleConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    categories: {
      ...currentConfig.categories,
      ...(config.categories || {})
    }
  };
}

/**
 * Get current console configuration
 */
export function getConsoleConfig(): ConsoleConfig {
  return { ...currentConfig };
}

/**
 * Reset console configuration to defaults
 */
export function resetConsoleConfig(): void {
  currentConfig = getDefaultConfig();
}

/**
 * Check if logging is enabled for a specific category
 */
export function isLoggingEnabled(category: LogCategory = 'other'): boolean {
  // Master switch check
  if (!currentConfig.enabled) {
    return false;
  }
  
  // Environment check
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  if (isProduction && !currentConfig.enableInProduction) {
    return false;
  }
  
  if (isDevelopment && !currentConfig.enableInDevelopment) {
    return false;
  }
  
  // Category-specific check
  if (category === 'all') {
    return true;
  }
  
  const categoryEnabled = currentConfig.categories[category];
  if (categoryEnabled !== undefined) {
    return categoryEnabled;
  }
  
  // Default to master enabled setting
  return currentConfig.enabled;
}

/**
 * Initialize console configuration from environment variables
 * Call this early in your app initialization
 */
export function initializeConsoleConfig(): void {
  currentConfig = getDefaultConfig();
  
  // Log the configuration (only if config category is enabled)
  if (isLoggingEnabled('config')) {
    // Use native console to avoid circular dependency
    const originalConsole = (window as Window & { __originalConsole?: Console }).__originalConsole || console;
    originalConsole.log(
      '%c🔧 Console Log Configuration',
      'color: #4CAF50; font-weight: bold; font-size: 12px;',
      {
        enabled: currentConfig.enabled,
        environment: import.meta.env.MODE,
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
        categories: currentConfig.categories
      }
    );
  }
}

// Initialize on module load
initializeConsoleConfig();

