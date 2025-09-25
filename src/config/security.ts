// Authentication settings
export const AUTH_CONFIG = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PASSWORD_RESET_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REQUIRE_EMAIL_VERIFICATION: true,
  PASSWORD_HISTORY_SIZE: 5, // Keep last 5 passwords
  MIN_PASSWORD_STRENGTH_SCORE: 60, // Minimum password strength score (0-100)
  PROGRESSIVE_LOCKOUT: true, // Enable progressive lockout duration
  MAX_LOCKOUT_DURATION: 24 * 60, // Maximum lockout duration in minutes (24 hours)
  PERMANENT_LOCKOUT_THRESHOLD: 10 // Number of lockouts before permanent lockout
};

// API security settings
export const API_SECURITY = {
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Too many requests, please try again later.'
  },
  MAX_PAYLOAD_SIZE: 10 * 1024, // 10KB
  ALLOWED_ORIGINS: [
    'https://bgr8.uk',
    'https://www.bgr8.uk'
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE']
};

// File upload security settings
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  DANGEROUS_EXTENSIONS: [
    '.exe', '.dll', '.so', '.sh', '.bat', '.cmd', '.msi',
    '.vbs', '.js', '.php', '.py', '.pl', '.rb', '.asp'
  ],
  UPLOAD_PATH: 'uploads/',
  SCAN_TIMEOUT: 30 * 1000 // 30 seconds
};

// Content Security Policy
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://*.firebaseapp.com',
    'https://*.googleapis.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://apis.google.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
    'https://*.firebaseapp.com',
    'https://*.googleapis.com',
    'https://*.googleusercontent.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://*.firebaseio.com',
    'https://*.googleapis.com',
    'https://*.google-analytics.com',
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'wss://*.firebaseio.com'
  ],
  'frame-src': [
    "'self'",
    'https://*.firebaseapp.com',
    'https://*.stripe.com',
    'https://*.google.com',
    'https://cal.com',
    'https://*.cal.com'
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Security Headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=(self)',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', ')
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FILE_UPLOAD_FAILED: 'File upload failed. Please ensure the file meets our security requirements.',
  INVALID_REQUEST: 'Invalid request. Please try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
  FILE_SIZE_EXCEEDED: 'File size exceeds the maximum limit of 5MB.'
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https:\/\/[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-_.]*)*$/,
  SAFE_STRING: /^[^<>'"]*$/
}; 