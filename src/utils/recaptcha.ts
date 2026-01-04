/**
 * reCAPTCHA v3 Integration
 * 
 * Provides Google reCAPTCHA v3 verification for authentication forms
 */

// reCAPTCHA configuration
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const RECAPTCHA_SECRET_KEY = import.meta.env.VITE_RECAPTCHA_SECRET_KEY || ''; // Only needed on backend
const RECAPTCHA_SCORE_THRESHOLD = 0.5; // Score threshold (0.0 = bot, 1.0 = human)

/**
 * Load reCAPTCHA script
 */
export function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    if (existingScript) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA script failed to load'));
        }
      }, 10000); // 10 second timeout
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          resolve();
        });
      } else {
        reject(new Error('reCAPTCHA script loaded but grecaptcha not available'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA v3 and get token
 */
export async function executeRecaptcha(action: string = 'submit'): Promise<string> {
  try {
    // Load script if not already loaded
    if (!window.grecaptcha || !window.grecaptcha.ready) {
      await loadRecaptchaScript();
    }

    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured');
      return ''; // Return empty string if not configured
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: Error) => {
            console.error('reCAPTCHA execution error:', error);
            reject(error);
          });
      });
    });
  } catch (error) {
    console.error('Error executing reCAPTCHA:', error);
    // Return empty string on error (will be handled on backend)
    return '';
  }
}

/**
 * Verify reCAPTCHA token on backend
 * Note: This should be called from your backend, not frontend
 * This is a utility function for backend verification
 */
export interface RecaptchaVerificationResult {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  errorCodes?: string[];
}

/**
 * Verify reCAPTCHA token (backend function)
 * This should be called from your backend API
 */
export async function verifyRecaptchaToken(token: string): Promise<RecaptchaVerificationResult> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('reCAPTCHA secret key not configured');
    return {
      success: false,
      score: 0,
      action: '',
      challenge_ts: '',
      hostname: '',
      errorCodes: ['missing-secret-key']
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const data = await response.json();
    
    return {
      success: data.success === true,
      score: data.score || 0,
      action: data.action || '',
      challenge_ts: data.challenge_ts || '',
      hostname: data.hostname || '',
      errorCodes: data['error-codes'] || []
    };
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return {
      success: false,
      score: 0,
      action: '',
      challenge_ts: '',
      hostname: '',
      errorCodes: ['verification-error']
    };
  }
}

/**
 * Check if reCAPTCHA score is acceptable
 */
export function isRecaptchaScoreAcceptable(score: number): boolean {
  return score >= RECAPTCHA_SCORE_THRESHOLD;
}

/**
 * Initialize reCAPTCHA (load script on page load)
 */
export function initializeRecaptcha(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!RECAPTCHA_SITE_KEY) {
    console.warn('reCAPTCHA site key not configured. Skipping initialization.');
    return;
  }

  // Load script in background
  loadRecaptchaScript().catch((error) => {
    console.error('Failed to load reCAPTCHA:', error);
  });
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

