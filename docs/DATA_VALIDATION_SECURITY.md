# Data Validation Security Implementation

## Overview

This document describes the data validation security features implemented in the Bgr8 application.

## Feature Status

### 1. Frontend Validation ✅

**Status**: Fully implemented

**Location**: 
- `src/utils/security.ts` - Password, name, and general input validation
- `src/utils/emailValidation.ts` - Email validation
- `src/pages/authPages/SignInPage.tsx` - Form validation
- `src/pages/authPages/MobileSignInPage.tsx` - Mobile form validation

**What it does**:
- Validates all user inputs before submission
- Real-time validation feedback
- Field-level error messages
- Password strength validation
- Email format, domain, and availability validation
- Name validation (character limits, Unicode, profanity)

**Example**:
```typescript
import { validateFirstName, validateLastName, validatePassword } from '../utils/security';
import { validateEmail } from '../utils/emailValidation';

const firstNameResult = validateFirstName(formData.firstName);
const emailResult = await validateEmail(formData.email, { checkAvailability: true });
```

### 2. Backend Validation ✅

**Status**: Fully implemented on email server API

**Location**: `email-server/server.js`

**What it does**:
- Validates all API requests using Joi schemas
- Server-side validation before processing
- Rejects invalid requests with clear error messages
- Validates email addresses, content length, and data types

**Validation Schemas**:
```javascript
const emailSchema = Joi.object({
  to: Joi.array().items(Joi.string().email()).min(1).required(),
  cc: Joi.array().items(Joi.string().email()).optional(),
  bcc: Joi.array().items(Joi.string().email()).optional(),
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(1000000).required(),
  contentType: Joi.string().valid('text/plain', 'text/html').default('text/html'),
  fromEmail: Joi.string().email().optional(),
  fromName: Joi.string().max(100).optional(),
  attachments: Joi.array().items(Joi.object({
    fileName: Joi.string().required(),
    content: Joi.string().required(),
    contentType: Joi.string().required()
  })).optional()
});
```

**Usage**:
```javascript
app.post('/api/email/send', emailLimiter, async (req, res) => {
  // Validate request
  const { error, value } = emailSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  // Process validated request...
});
```

**Note**: For Firebase client-side operations (authentication, Firestore), validation is handled client-side. Firestore Security Rules provide additional server-side validation for database operations.

### 3. Input Sanitization ✅

**Status**: Fully implemented

**Location**: `src/utils/inputSanitization.ts`

**What it does**:
- Sanitizes HTML content to prevent XSS attacks
- Escapes HTML special characters
- Removes dangerous scripts and event handlers
- Validates and sanitizes URLs, emails, and numbers
- Deep sanitizes objects and arrays

**Functions**:
- `sanitizeHtml(input)` - Removes script tags, event handlers, dangerous URLs
- `escapeHtml(input)` - Escapes HTML special characters
- `sanitizeText(input, options)` - Sanitizes plain text with configurable options
- `sanitizeUrl(input, allowedProtocols)` - Validates and sanitizes URLs
- `sanitizeEmail(input)` - Validates and sanitizes email addresses
- `sanitizeNumber(input, options)` - Validates and sanitizes numeric values
- `sanitizeObject(obj, options)` - Recursively sanitizes object properties
- `sanitizeInput(input, type, options)` - Main entry point for input sanitization

**Usage**:
```typescript
import { sanitizeHtml, sanitizeText, sanitizeInput } from '../utils/inputSanitization';

// Sanitize HTML content
const safeHtml = sanitizeHtml(userInput);

// Sanitize plain text
const safeText = sanitizeText(userInput, { maxLength: 1000, allowNewlines: true });

// Sanitize with type detection
const sanitized = sanitizeInput(userInput, 'html');
```

**Integration**:
- Frontend: Can be used in React components before rendering user content
- Backend: Email server can use this for sanitizing email content (if needed)
- Firestore: Client-side sanitization before storing data

**XSS Prevention**:
- Removes `<script>` tags and their content
- Removes event handlers (`onclick`, `onerror`, etc.)
- Removes `javascript:` and `data:` URLs
- Escapes HTML special characters (`<`, `>`, `&`, `"`, `'`)
- Removes dangerous HTML tags (`<iframe>`, `<embed>`, `<object>`)

### 4. SQL Injection Prevention ✅

**Status**: Not applicable (using Firestore NoSQL database)

**Reason**: 
- **Firebase Firestore is a NoSQL database** - it doesn't use SQL queries
- Firestore queries are parameterized by design
- No SQL injection vulnerabilities exist in Firestore
- Firestore Security Rules provide additional protection

**Alternative Protections**:
- **Firestore Security Rules** - Validate data at the database level
- **Client-side validation** - Validate before sending to Firestore
- **Type safety** - TypeScript provides compile-time type checking

**Documentation**: 
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Security Best Practices](https://firebase.google.com/docs/firestore/security/best-practices)

### 5. CSRF Protection ✅

**Status**: Handled by Firebase and API authentication

**Firebase Authentication**:
- Firebase SDK handles CSRF protection automatically
- Uses secure token-based authentication
- Tokens are validated server-side by Firebase

**Email Server API**:
- Uses **API key authentication** instead of cookies
- CSRF attacks target cookie-based authentication
- API keys in headers are not vulnerable to CSRF
- CORS protection limits cross-origin requests

**Additional Protections**:
- **CORS configuration** - Only allows specific origins
- **API key authentication** - Required for all API endpoints
- **Rate limiting** - Prevents abuse
- **Same-origin policy** - Browser enforces for same-origin requests

**Documentation**:
- [Firebase Authentication Security](https://firebase.google.com/docs/auth/security)
- [CSRF Protection Best Practices](https://owasp.org/www-community/attacks/csrf)

### 6. Request Size Limits ✅

**Status**: Fully implemented

**Email Server** (`email-server/server.js`):
```javascript
// Global JSON body parser limit
app.use(express.json({ limit: '10mb' }));

// Email schema validation limits
const emailSchema = Joi.object({
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(1000000).required(), // 1MB limit
  fromName: Joi.string().max(100).optional(),
  // ...
});
```

**Frontend Validation** (`src/utils/security.ts`):
```typescript
export const validateUserInput = (input: string): boolean => {
  const maxLength = 1000;
  const dangerousPatterns = /[<>]/;
  return input.length < maxLength && !dangerousPatterns.test(input);
};
```

**Limits**:
- **Request body**: 10MB maximum (Express JSON parser)
- **Email content**: 1MB maximum (Joi validation)
- **Email subject**: 200 characters maximum
- **Email from name**: 100 characters maximum
- **General input**: 1000 characters (client-side validation)

**Benefits**:
- Prevents DoS attacks from large payloads
- Protects server resources
- Prevents memory exhaustion
- Limits attack surface

## Security Best Practices

### 1. Never Trust Client Input

✅ **Always validate on the backend** - Even if frontend validation exists
✅ **Use server-side validation** - Joi schemas on email server
✅ **Sanitize user input** - Use input sanitization utilities
✅ **Validate data types** - Ensure correct types before processing

### 2. Defense in Depth

✅ **Multiple layers of validation**:
   - Frontend validation (user experience)
   - Backend validation (security)
   - Database rules (Firestore Security Rules)
   - Input sanitization (XSS prevention)

### 3. Input Sanitization Guidelines

✅ **Sanitize before storing** - Clean data before saving to database
✅ **Sanitize before rendering** - Clean data before displaying to users
✅ **Use appropriate sanitization** - HTML for HTML content, text for plain text
✅ **Escape special characters** - Use `escapeHtml()` for user-generated content

### 4. Error Handling

✅ **Don't expose sensitive information** - Generic error messages
✅ **Log errors securely** - Don't log user input directly
✅ **Validate error responses** - Don't leak internal details

## Testing

### Test Frontend Validation

```typescript
import { sanitizeHtml, sanitizeText } from '../utils/inputSanitization';

// Test XSS prevention
const malicious = '<script>alert("XSS")</script>';
const safe = sanitizeHtml(malicious); // Should remove script tag

// Test HTML escaping
const html = '<div>Hello</div>';
const escaped = escapeHtml(html); // Should escape < and >
```

### Test Backend Validation

```bash
# Test email API validation
curl -X POST https://your-api.com/api/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["invalid-email"],  # Should fail validation
    "subject": "Test",
    "content": "Test content"
  }'
```

### Test Request Size Limits

```bash
# Test with large payload (should fail)
curl -X POST https://your-api.com/api/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @large-payload.json  # > 10MB file
```

## Configuration

### Email Server Validation

**Location**: `email-server/server.js`

**Customization**:
```javascript
// Adjust limits in Joi schema
const emailSchema = Joi.object({
  subject: Joi.string().min(1).max(200).required(), // Change max length
  content: Joi.string().min(1).max(1000000).required(), // Change max size
});

// Adjust Express body parser limit
app.use(express.json({ limit: '10mb' })); // Change limit
```

### Frontend Validation

**Location**: `src/utils/security.ts`

**Customization**:
```typescript
// Adjust validation options
export const validateUserInput = (input: string): boolean => {
  const maxLength = 1000; // Change max length
  const dangerousPatterns = /[<>]/;
  return input.length < maxLength && !dangerousPatterns.test(input);
};
```

## Future Enhancements

### Potential Improvements

1. **Content Security Policy (CSP)** - Already implemented in headers
2. **Input validation library** - Currently using custom validation, could use library like Zod
3. **Rate limiting per endpoint** - Currently global, could be endpoint-specific
4. **File upload validation** - If file uploads are added
5. **Input validation middleware** - Reusable middleware for all endpoints

## References

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Joi Validation Library](https://joi.dev/)

