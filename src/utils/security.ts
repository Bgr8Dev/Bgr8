// Password validation
export const validatePassword = (password: string): boolean => {
  const requirements = {
    minLength: 12,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumbers: /\d/,
    hasSpecialChar: /[@$!%*?&#^~`|\\/<>:";=+_-]/
  };

  return (
    password.length >= requirements.minLength &&
    requirements.hasUpperCase.test(password) &&
    requirements.hasLowerCase.test(password) &&
    requirements.hasNumbers.test(password) &&
    requirements.hasSpecialChar.test(password)
  );
};

// Rate limiting for authentication
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const entry = rateLimitMap.get(identifier);
  if (!entry) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }

  if (now - entry.firstAttempt > timeWindow) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }

  if (entry.attempts >= maxAttempts) {
    return false;
  }

  entry.attempts++;
  return true;
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