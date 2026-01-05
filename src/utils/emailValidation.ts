import { auth } from '../firebase/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { loggers } from './logger';

// Email validation result interface
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
  suggestions?: string[];
  warnings?: string[];
  isDisposable?: boolean;
  isTypo?: boolean;
  suggestedDomain?: string;
}

// Common email domain typos mapping
const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaiil.com': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.coom': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlok.co': 'outlook.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaiil.com': 'hotmail.com',
  'icloud.co': 'icloud.com',
  'iclod.com': 'icloud.com',
  'protonmai.com': 'protonmail.com',
  'protonmail.co': 'protonmail.com',
};

// List of common disposable email domains
// In production, consider using an API service like https://www.disposable-email-detector.com/
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '20minutemail.com',
  '33mail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'getnada.com',
  'mohmal.com',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chitthi.in',
  'dispostable.com',
  'meltmail.com',
  'emailondeck.com',
  'fakemailgenerator.com',
  'maildrop.cc',
  'mintemail.com',
  'mytrashmail.com',
  'putthisinyourspamdatabase.com',
  'spamgourmet.com',
  'spamhole.com',
  'trashmail.com',
  'trashmailer.com',
  'tempail.com',
  'tempr.email',
  'tmpmail.org',
  'mail-temp.com',
  'getairmail.com',
  'inboxkitten.com',
  'mailsac.com',
  'mailcatch.com',
  'emailfake.com',
  'fakermail.com',
  'fakemail.net',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'mailforspam.com',
  'spambox.us',
  'spamfree24.org',
  'spamherelots.com',
  'spamhereplease.com',
  'spamhole.com',
  'spamtraps.com',
  'tempinbox.co.uk',
  'temporary-mail.net',
  'thrma.com',
  'trash-amil.com',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'trashymail.com',
  'tyldd.com',
  'wh4f.org',
  'zippymail.info',
  'zoemail.com',
  'zomg.info',
]);

// Valid TLDs (Top Level Domains)
// This is a subset - in production, consider using a comprehensive list or API
const VALID_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'com.mx',
  'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at', 'pl', 'cz', 'se', 'no', 'dk', 'fi',
  'jp', 'cn', 'in', 'kr', 'sg', 'my', 'th', 'ph', 'id', 'vn',
  'au', 'nz', 'ca', 'us', 'uk', 'ie',
  'io', 'ai', 'app', 'dev', 'tech', 'online', 'site', 'website', 'store', 'shop',
  'xyz', 'info', 'biz', 'name', 'pro', 'me', 'tv', 'cc', 'ws', 'mobi',
  'email', 'cloud', 'host', 'space', 'website', 'online', 'site',
]);

/**
 * Normalize email address
 * - Converts to lowercase
 * - Removes dots from Gmail addresses (gmail.com ignores dots)
 * - Handles +aliases (keeps them but normalizes)
 * - Trims whitespace
 */
export const normalizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Trim and convert to lowercase
  let normalized = email.trim().toLowerCase();
  
  // Extract local and domain parts
  const parts = normalized.split('@');
  if (parts.length !== 2) return normalized;
  
  const [localPart, domain] = parts;
  
  // Gmail normalization: remove dots and handle +aliases
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove all dots from local part
    const localWithoutDots = localPart.replace(/\./g, '');
    // Keep +alias if present
    normalized = `${localWithoutDots}@${domain}`;
  } else {
    // For other providers, just normalize case and trim
    normalized = `${localPart}@${domain}`;
  }
  
  return normalized;
};

/**
 * Check if email domain is a common typo
 */
const checkEmailTypo = (domain: string): { isTypo: boolean; suggestedDomain?: string } => {
  const lowerDomain = domain.toLowerCase();
  if (COMMON_TYPOS[lowerDomain]) {
    return {
      isTypo: true,
      suggestedDomain: COMMON_TYPOS[lowerDomain]
    };
  }
  return { isTypo: false };
};

/**
 * Check if email is from a disposable email service
 */
const isDisposableEmail = (domain: string): boolean => {
  return DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase());
};

/**
 * Validate TLD (Top Level Domain)
 */
const isValidTLD = (domain: string): boolean => {
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  
  // Check last part (TLD)
  const tld = parts[parts.length - 1].toLowerCase();
  
  // Check two-part TLDs (e.g., co.uk)
  if (parts.length >= 3) {
    const twoPartTLD = `${parts[parts.length - 2]}.${tld}`.toLowerCase();
    if (VALID_TLDS.has(twoPartTLD)) return true;
  }
  
  // Check single-part TLD
  return VALID_TLDS.has(tld);
};

/**
 * Comprehensive email validation
 */
export const validateEmail = async (
  email: string,
  options: {
    checkAvailability?: boolean;
    checkDisposable?: boolean;
    checkTypo?: boolean;
    normalize?: boolean;
  } = {}
): Promise<EmailValidationResult> => {
  const {
    checkAvailability = false,
    checkDisposable = true,
    checkTypo = true,
    normalize = true
  } = options;

  // Basic format validation
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }

  // Extract domain
  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  const [localPart, domain] = parts;

  // Validate local part
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: 'Email address is invalid'
    };
  }

  // Validate domain
  if (domain.length === 0 || domain.length > 255) {
    return {
      isValid: false,
      error: 'Email domain is invalid'
    };
  }

  // Check for valid TLD
  if (!isValidTLD(domain)) {
    return {
      isValid: false,
      error: 'Email domain appears to be invalid. Please check the domain extension.'
    };
  }

  // Check for disposable emails
  let isDisposable = false;
  if (checkDisposable && isDisposableEmail(domain)) {
    isDisposable = true;
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
      isDisposable: true
    };
  }

  // Check for typos
  let isTypo = false;
  let suggestedDomain: string | undefined;
  if (checkTypo) {
    const typoCheck = checkEmailTypo(domain);
    if (typoCheck.isTypo && typoCheck.suggestedDomain) {
      isTypo = true;
      suggestedDomain = typoCheck.suggestedDomain;
      const suggestedEmail = `${localPart}@${suggestedDomain}`;
      return {
        isValid: false,
        error: `Did you mean ${suggestedEmail}?`,
        isTypo: true,
        suggestedDomain: suggestedDomain,
        suggestions: [suggestedEmail]
      };
    }
  }

  // Normalize email
  let normalizedEmail = email;
  if (normalize) {
    normalizedEmail = normalizeEmail(email);
  }

  // Check email availability (if requested)
  if (checkAvailability) {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (signInMethods.length > 0) {
        return {
          isValid: false,
          error: 'An account with this email already exists',
          normalized: normalizedEmail
        };
      }
    } catch (error) {
      // If there's an error checking availability, log it but don't fail validation
      loggers.error.error('Error checking email availability:', error);
      // Continue with validation - availability check is optional
    }
  }

  // Email is valid
  return {
    isValid: true,
    normalized: normalizedEmail,
    isDisposable: isDisposable,
    isTypo: isTypo,
    suggestedDomain: suggestedDomain
  };
};

/**
 * Quick email format validation (synchronous, no async checks)
 */
export const validateEmailFormat = (email: string): EmailValidationResult => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  const domain = parts[1];
  
  // Quick typo check
    const typoCheck = checkEmailTypo(domain);
  if (typoCheck.isTypo && typoCheck.suggestedDomain) {
    const suggestedEmail = `${parts[0]}@${typoCheck.suggestedDomain}`;
    return {
      isValid: false,
      error: `Did you mean ${suggestedEmail}?`,
      isTypo: true,
      suggestedDomain: typoCheck.suggestedDomain,
      suggestions: [suggestedEmail]
    };
  }

  // Quick disposable check
  if (isDisposableEmail(domain)) {
    return {
      isValid: false,
      error: 'Temporary email addresses are not allowed',
      isDisposable: true
    };
  }

  return {
    isValid: true,
    normalized: normalizeEmail(email)
  };
};

/**
 * Check if email is available (not already registered)
 */
export const checkEmailAvailability = async (email: string): Promise<{
  available: boolean;
  error?: string;
}> => {
  try {
    const normalized = normalizeEmail(email);
    const signInMethods = await fetchSignInMethodsForEmail(auth, normalized);
    
    if (signInMethods.length > 0) {
      return {
        available: false,
        error: 'An account with this email already exists'
      };
    }
    
    return {
      available: true
    };
  } catch (error) {
    loggers.error.error('Error checking email availability:', error);
    return {
      available: false,
      error: 'Unable to verify email availability. Please try again.'
    };
  }
};

