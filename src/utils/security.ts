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
  };
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
      noUserInfo
    }
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

export const validatePassword = (password: string): boolean => {
  const strength = calculatePasswordStrength(password);
  return strength.requirements.length &&
         strength.requirements.uppercase &&
         strength.requirements.lowercase &&
         strength.requirements.numbers &&
         strength.requirements.specialChar &&
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