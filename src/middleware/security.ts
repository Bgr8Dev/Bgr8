import { checkApiRateLimit } from '../utils/security';

// Types for middleware
type NextFunction = () => void;

interface RequestBody {
  [key: string]: string | number | boolean | null | RequestBody | RequestBody[];
}

type Request = {
  ip: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: RequestBody;
};

type Response = {
  status: (code: number) => Response;
  json: (data: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  next();
};

// Rate limiting middleware
export const rateLimiter = (req: Request, res: Response, _next: NextFunction) => {
  const identifier = req.ip; // Use IP address as identifier

  if (!checkApiRateLimit(identifier)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: '15 minutes'
    });
  }

  _next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, _next: NextFunction) => {
  // Validate request method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT'].includes(req.method) && req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ error: 'Unsupported Media Type. Please use application/json' });
  }

  // Validate request body size (10kb limit)
  const MAX_BODY_SIZE = 10 * 1024; // 10kb
  if (req.body && JSON.stringify(req.body).length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request entity too large' });
  }

  _next();
};

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://bgr8.uk',
    'https://www.bgr8.uk'
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response) => {
  console.error('Error:', error);

  // Generate error ID for tracking
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error with ID for tracking
  console.error(`Error ID: ${errorId}`, {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send safe error response to client
  res.status(500).json({
    error: 'An unexpected error occurred',
    errorId,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
  });
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Recursively sanitize object
    const sanitizeValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters and limit length
        return value
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '')
          .substring(0, 1000);
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value as Record<string, unknown>).reduce((acc, key) => {
          acc[key] = sanitizeValue((value as Record<string, unknown>)[key]);
          return acc;
        }, {} as Record<string, unknown>);
      }
      return value;
    };

    req.body = sanitizeValue(req.body) as RequestBody;
  }

  next();
}; 