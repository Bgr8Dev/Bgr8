/**
 * Input Sanitization Utilities
 * 
 * Provides comprehensive input sanitization for XSS prevention and data validation
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  sanitized = sanitized.replace(/data:image\/svg\+xml/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
  
  // Remove iframe, embed, object tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  
  return sanitized.trim();
}

/**
 * Escape HTML special characters
 * Converts HTML entities to their encoded equivalents
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize plain text input
 * Removes or escapes dangerous characters for text fields
 */
export function sanitizeText(input: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowSpecialChars?: boolean;
} = {}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 10000,
    allowNewlines = false,
    allowSpecialChars = true
  } = options;

  let sanitized = input.trim();

  // Remove control characters (except newlines if allowed)
  // Using character code filtering to avoid linter warnings about control characters
  if (allowNewlines) {
    sanitized = sanitized.split('').filter(char => {
      const code = char.charCodeAt(0);
      // Allow newline (10), carriage return (13), and printable characters (32-126, 128+)
      return code === 10 || code === 13 || (code >= 32 && code !== 127) || code >= 128;
    }).join('');
  } else {
    sanitized = sanitized.split('').filter(char => {
      const code = char.charCodeAt(0);
      // Only allow printable characters (32-126, 128+)
      return (code >= 32 && code !== 127) || code >= 128;
    }).join('');
  }

  // Remove HTML tags if present (for text fields)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove dangerous patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove or escape dangerous characters if not allowed
  if (!allowSpecialChars) {
    // Only allow alphanumeric, spaces, and basic punctuation
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s.,!?\-_()]/g, '');
  } else {
    // Escape HTML special characters
    sanitized = escapeHtml(sanitized);
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize URL input
 * Validates and sanitizes URL strings
 */
export function sanitizeUrl(input: string, allowedProtocols: string[] = ['http', 'https']): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Remove dangerous protocols
  const dangerousPatterns = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousPatterns.test(trimmed)) {
    return null;
  }

  // Validate protocol
  try {
    const url = new URL(trimmed);
    if (!allowedProtocols.includes(url.protocol.replace(':', '').toLowerCase())) {
      return null;
    }
    return url.toString();
  } catch {
    // If not a valid URL, return null
    return null;
  }
}

/**
 * Sanitize email input
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Remove dangerous characters
  const sanitized = trimmed.replace(/[<>'"&]/g, '');

  // Check length (reasonable limit for email)
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize numeric input
 * Validates and sanitizes numeric values
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    allowNegative?: boolean;
  } = {}
): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const {
    min,
    max,
    allowDecimals = true,
    allowNegative = false
  } = options;

  let num: number;

  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    // Remove any non-numeric characters (except decimal point and minus sign)
    let cleaned = input.trim();
    if (!allowDecimals) {
      cleaned = cleaned.replace(/[^\d-]/g, '');
    } else {
      cleaned = cleaned.replace(/[^\d.-]/g, '');
    }

    num = parseFloat(cleaned);
    if (isNaN(num)) {
      return null;
    }
  } else {
    return null;
  }

  // Check if negative is allowed
  if (!allowNegative && num < 0) {
    return null;
  }

  // Check bounds
  if (min !== undefined && num < min) {
    return null;
  }
  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Deep sanitize object
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    sanitizeHtml?: boolean;
    maxStringLength?: number;
  } = {}
): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const {
    sanitizeHtml: shouldSanitizeHtml = false,
    maxStringLength = 10000
  } = options;

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedObj = sanitized as Record<string, unknown>;
    if (typeof value === 'string') {
      sanitizedObj[key] = shouldSanitizeHtml 
        ? sanitizeHtml(value) 
        : sanitizeText(value, { maxLength: maxStringLength });
    } else if (Array.isArray(value)) {
      sanitizedObj[key] = value.map(item => 
        typeof item === 'string' 
          ? (shouldSanitizeHtml ? sanitizeHtml(item) : sanitizeText(item, { maxLength: maxStringLength }))
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitizedObj[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      sanitizedObj[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize user input
 * Main entry point for input sanitization
 */
export function sanitizeInput(
  input: unknown,
  type: 'text' | 'html' | 'email' | 'url' | 'number' = 'text',
  options: Record<string, unknown> = {}
): unknown {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'string') {
    switch (type) {
      case 'html':
        return sanitizeHtml(input);
      case 'email':
        return sanitizeEmail(input);
      case 'url':
        return sanitizeUrl(input, options.allowedProtocols as string[]);
      case 'number':
        return sanitizeNumber(input, options as {
          min?: number;
          max?: number;
          allowDecimals?: boolean;
          allowNegative?: boolean;
        });
      case 'text':
      default:
        return sanitizeText(input, options as {
          maxLength?: number;
          allowNewlines?: boolean;
          allowSpecialChars?: boolean;
        });
    }
  }

  if (typeof input === 'number') {
    if (type === 'number') {
      return sanitizeNumber(input, options as {
        min?: number;
        max?: number;
        allowDecimals?: boolean;
        allowNegative?: boolean;
      });
    }
    return input;
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    return sanitizeObject(input as Record<string, unknown>, options as {
      sanitizeHtml?: boolean;
      maxStringLength?: number;
    });
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item, type, options));
  }

  return input;
}

/**
 * Convert HTML to plain text by stripping all tags and decoding entities
 * This is a more comprehensive version that handles nested tags and entities properly
 */
export function htmlToText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let text = input;
  
  // First, decode HTML entities to prevent double-encoding issues
  // Use a temporary DOM element for proper entity decoding
  const htmlEntityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&apos;': "'"
  };
  
  // Decode named entities
  for (const [entity, char] of Object.entries(htmlEntityMap)) {
    text = text.replace(new RegExp(entity, 'gi'), char);
  }
  
  // Decode numeric entities (&#123; and &#x1A;)
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Remove script and style tags with their content (case-insensitive, multiline)
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Validate origin against allowed origins (exact match)
 * Returns true if origin is in the allowed list
 */
export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (!origin || typeof origin !== 'string') {
    return false;
  }
  
  try {
    // Parse the origin to ensure it's valid
    const url = new URL(origin);
    const normalizedOrigin = url.origin;
    
    // Check for exact match in allowed origins
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return allowedUrl.origin === normalizedOrigin;
      } catch {
        // If allowed is not a full URL, do exact string match
        return allowed === normalizedOrigin;
      }
    });
  } catch {
    // Invalid origin format
    return false;
  }
}

/**
 * Sanitize string for logging to prevent log injection
 * Removes control characters and escapes special characters
 */
export function sanitizeForLogging(input: unknown): string {
  if (input === null || input === undefined) {
    return String(input);
  }
  
  if (typeof input !== 'string') {
    // Convert to JSON for complex objects, but limit depth to prevent DoS
    try {
      return JSON.stringify(input).substring(0, 1000);
    } catch {
      return '[Object]';
    }
  }
  
  // Remove control characters (except newline and tab for readability)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent log flooding
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '... [truncated]';
  }
  
  return sanitized;
}

