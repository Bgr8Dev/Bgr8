// Password validation and strength calculation
export interface PasswordStrength {
  score: number; // 0-100
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChar: boolean;
    noCommonPatterns: boolean;
    noUserInfo: boolean;
    notCommonPassword: boolean;
  };
  isCommonPassword?: boolean;
}

export const calculatePasswordStrength = (password: string, userInfo?: { firstName?: string; lastName?: string; email?: string }): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check (0-25 points)
  const lengthScore = Math.min(password.length * 2, 25);
  score += lengthScore;
  if (password.length < 8) feedback.push('Password should be at least 8 characters long');
  else if (password.length < 12) feedback.push('Consider using a longer password (12+ characters)');

  // Character variety checks (0-30 points)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#^~`|\\/<>:";=+_-]/.test(password);

  if (hasUpperCase) score += 8;
  else feedback.push('Add uppercase letters');
  
  if (hasLowerCase) score += 8;
  else feedback.push('Add lowercase letters');
  
  if (hasNumbers) score += 7;
  else feedback.push('Add numbers');
  
  if (hasSpecialChar) score += 7;
  else feedback.push('Add special characters (@$!%*?&)');

  // Pattern analysis (0-20 points)
  const noCommonPatterns = !hasCommonPatterns(password);
  if (noCommonPatterns) score += 20;
  else {
    score -= 10;
    feedback.push('Avoid common patterns like "123", "abc", or repeated characters');
  }

  // User information check (0-15 points)
  const noUserInfo = !containsUserInfo(password, userInfo);
  if (noUserInfo) score += 15;
  else {
    score -= 15;
    feedback.push('Avoid using personal information in your password');
  }

  // Common password check (0-10 points penalty if common)
  const notCommon = !isCommonPassword(password);
  if (!notCommon) {
    score -= 20; // Heavy penalty for common passwords
    feedback.push('This password is commonly used and easily guessed. Please choose something more unique.');
  }

  // Entropy bonus (0-10 points)
  const uniqueChars = new Set(password).size;
  const entropyBonus = Math.min(uniqueChars * 0.5, 10);
  score += entropyBonus;

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let level: PasswordStrength['level'];
  if (score < 20) level = 'Very Weak';
  else if (score < 40) level = 'Weak';
  else if (score < 60) level = 'Fair';
  else if (score < 80) level = 'Good';
  else if (score < 95) level = 'Strong';
  else level = 'Very Strong';

  // Add positive feedback for strong passwords
  if (score >= 80) {
    feedback.push('Great! Your password meets security requirements');
  }

  return {
    score,
    level,
    feedback,
    requirements: {
      length: password.length >= 12,
      uppercase: hasUpperCase,
      lowercase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
      noCommonPatterns,
      noUserInfo,
      notCommonPassword: notCommon
    },
    isCommonPassword: !notCommon
  };
};

const hasCommonPatterns = (password: string): boolean => {
  const commonPatterns = [
    /123/, /abc/, /qwe/, /asd/, /zxc/,
    /password/i, /admin/i, /user/i,
    /(.)\1{2,}/, // Repeated characters
    /0123456789/, /9876543210/,
    /abcdefghij/, /qwertyuiop/
  ];
  return commonPatterns.some(pattern => pattern.test(password));
};

const containsUserInfo = (password: string, userInfo?: { firstName?: string; lastName?: string; email?: string }): boolean => {
  if (!userInfo) return false;
  
  const lowerPassword = password.toLowerCase();
  const checks = [
    userInfo.firstName?.toLowerCase(),
    userInfo.lastName?.toLowerCase(),
    userInfo.email?.split('@')[0]?.toLowerCase()
  ].filter(Boolean);

  return checks.some(info => info && lowerPassword.includes(info));
};

// Import common password checker
import { isCommonPassword } from './commonPasswords';

export const validatePassword = (password: string): boolean => {
  const strength = calculatePasswordStrength(password);
  return strength.requirements.length &&
         strength.requirements.uppercase &&
         strength.requirements.lowercase &&
         strength.requirements.numbers &&
         strength.requirements.specialChar &&
         strength.requirements.notCommonPassword &&
         strength.score >= 60; // Minimum acceptable score
};

// Rate limiting for authentication (enhanced with account lockout integration)
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const entry = rateLimitMap.get(identifier);
  if (!entry) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return true;
  }

  if (now - entry.firstAttempt > timeWindow) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return true;
  }

  if (entry.attempts >= maxAttempts) {
    return false;
  }

  entry.attempts++;
  entry.lastAttempt = now;
  return true;
};

// Enhanced rate limiting with progressive delays
export const checkProgressiveRateLimit = (identifier: string): {
  allowed: boolean;
  delayMs?: number;
  attemptsRemaining: number;
} => {
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const entry = rateLimitMap.get(identifier);
  if (!entry) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, attemptsRemaining: maxAttempts - 1 };
  }

  if (now - entry.firstAttempt > timeWindow) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, attemptsRemaining: maxAttempts - 1 };
  }

  if (entry.attempts >= maxAttempts) {
    // Calculate progressive delay based on number of attempts
    const progressiveDelay = Math.min(entry.attempts * 30 * 1000, 5 * 60 * 1000); // Max 5 minutes
    return { 
      allowed: false, 
      delayMs: progressiveDelay,
      attemptsRemaining: 0
    };
  }

  entry.attempts++;
  entry.lastAttempt = now;
  
  // Add progressive delay for repeated attempts
  const delayMs = entry.attempts > 2 ? (entry.attempts - 2) * 5 * 1000 : 0; // 5s per extra attempt
  
  return { 
    allowed: true, 
    delayMs: delayMs > 0 ? delayMs : undefined,
    attemptsRemaining: maxAttempts - entry.attempts
  };
};

// Clear rate limit for successful authentication
export const clearRateLimit = (identifier: string): void => {
  rateLimitMap.delete(identifier);
};

// Input validation
export const validateUserInput = (input: string): boolean => {
  const maxLength = 1000;
  const dangerousPatterns = /[<>]/;
  return input.length < maxLength && !dangerousPatterns.test(input);
};

// Name validation result interface
export interface NameValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

// Profanity filter - basic list of common profane words
// Note: This is a basic implementation. For production, consider using a more comprehensive library
const PROFANITY_WORDS = [
  // Common profane words (lowercase for case-insensitive matching)
  'damn', 'hell', 'crap', 'ass', 'bitch', 'bastard', 'fuck', 'shit', 'piss',
  // Add more as needed - keeping list minimal for basic filtering
];

/**
 * Check if a string contains profanity
 * @param text - The text to check
 * @param caseSensitive - Whether to perform case-sensitive matching (default: false)
 * @returns true if profanity is detected, false otherwise
 */
export const containsProfanity = (text: string, caseSensitive: boolean = false): boolean => {
  if (!text || text.trim().length === 0) return false;
  
  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const normalizedWords = caseSensitive ? PROFANITY_WORDS : PROFANITY_WORDS.map(w => w.toLowerCase());
  
  // Check for whole word matches (with word boundaries)
  const words = normalizedText.split(/\s+/);
  for (const word of words) {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[^\w]/g, '');
    if (normalizedWords.includes(cleanWord)) {
      return true;
    }
  }
  
  // Also check if any profanity word appears as a substring (for obfuscation attempts)
  for (const profanity of normalizedWords) {
    if (normalizedText.includes(profanity)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Normalize Unicode characters in a name
 * This handles Unicode normalization (NFD to NFC) and removes potentially problematic characters
 * @param name - The name to normalize
 * @returns The normalized name
 */
export const normalizeUnicodeName = (name: string): string => {
  if (!name) return '';
  
  // Normalize Unicode characters (NFD to NFC)
  // This combines decomposed characters (e.g., é = e + ´) into composed form
  let normalized = name.normalize('NFC');
  
  // Remove zero-width characters and other invisible characters
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  
  // Trim whitespace
  normalized = normalized.trim();
  
  return normalized;
};

/**
 * Validate a name field with character limits, Unicode handling, and optional profanity filtering
 * @param name - The name to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export const validateName = (
  name: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowUnicode?: boolean;
    checkProfanity?: boolean;
    fieldName?: string;
  } = {}
): NameValidationResult => {
  const {
    maxLength = 50,
    minLength = 1,
    allowUnicode = true,
    checkProfanity = true,
    fieldName = 'Name'
  } = options;

  // Check if name is provided
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }

  // Normalize Unicode characters
  const normalized = normalizeUnicodeName(name);

  // Check minimum length
  if (normalized.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} character${minLength !== 1 ? 's' : ''} long`
    };
  }

  // Check maximum length (using normalized length for accurate character count)
  if (normalized.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters long`
    };
  }

  // Check for dangerous characters (XSS prevention)
  const dangerousPatterns = /[<>]/;
  if (dangerousPatterns.test(normalized)) {
    return {
      isValid: false,
      error: `${fieldName} contains invalid characters`
    };
  }

  // Unicode validation - allow Unicode letters, spaces, hyphens, and apostrophes
  // This includes accented characters, Cyrillic, Arabic, Chinese, etc.
  if (allowUnicode) {
    // Allow Unicode letter characters, spaces, hyphens, apostrophes, and periods
    // This regex allows most international name characters
    const unicodeNamePattern = /^[\p{L}\s'\-\.]+$/u;
    if (!unicodeNamePattern.test(normalized)) {
      return {
        isValid: false,
        error: `${fieldName} contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed`
      };
    }
  } else {
    // ASCII-only validation
    const asciiPattern = /^[a-zA-Z\s'\-\.]+$/;
    if (!asciiPattern.test(normalized)) {
      return {
        isValid: false,
        error: `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods`
      };
    }
  }

  // Profanity check (optional)
  if (checkProfanity && containsProfanity(normalized)) {
    return {
      isValid: false,
      error: `${fieldName} contains inappropriate language`
    };
  }

  return {
    isValid: true,
    normalized
  };
};

/**
 * Validate first name with standard settings
 * @param firstName - The first name to validate
 * @returns Validation result
 */
export const validateFirstName = (firstName: string): NameValidationResult => {
  return validateName(firstName, {
    maxLength: 50,
    minLength: 1,
    allowUnicode: true,
    checkProfanity: true,
    fieldName: 'First name'
  });
};

/**
 * Validate last name with standard settings
 * @param lastName - The last name to validate
 * @returns Validation result
 */
export const validateLastName = (lastName: string): NameValidationResult => {
  return validateName(lastName, {
    maxLength: 50,
    minLength: 1,
    allowUnicode: true,
    checkProfanity: true,
    fieldName: 'Last name'
  });
};

// Session management
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const updateLastActivity = (): void => {
  sessionStorage.setItem('lastActivity', Date.now().toString());
};

export const checkSessionTimeout = (): boolean => {
  const lastActivity = sessionStorage.getItem('lastActivity');
  if (!lastActivity) return false;
  return Date.now() - Number(lastActivity) <= SESSION_TIMEOUT;
};

// File upload validation
export const validateFile = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  return file.size <= maxSize && allowedTypes.includes(file.type);
};

// Error handling
export const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const handleError = (error: Error): string => {
  const errorId = generateErrorId();
  console.error(`Error ID: ${errorId}`, error);
  return `An error occurred (ID: ${errorId}). Please try again later.`;
};

// API rate limiting
interface ApiRateLimit {
  windowMs: number;
  max: number;
  current: number;
  windowStart: number;
}

const apiRateLimits = new Map<string, ApiRateLimit>();

export const checkApiRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit: ApiRateLimit = apiRateLimits.get(identifier) || {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    current: 0,
    windowStart: now
  };

  if (now - limit.windowStart > limit.windowMs) {
    limit.current = 1;
    limit.windowStart = now;
    apiRateLimits.set(identifier, limit);
    return true;
  }

  if (limit.current >= limit.max) {
    return false;
  }

  limit.current++;
  apiRateLimits.set(identifier, limit);
  return true;
}; 