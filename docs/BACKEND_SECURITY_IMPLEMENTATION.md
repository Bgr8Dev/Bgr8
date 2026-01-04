# Backend Security Implementation Guide

## Overview

This document describes the backend security features implemented for the Bgr8 authentication system.

## Implemented Features

### 1. IP-based Rate Limiting ✅

**Status**: Service created, requires backend API for full functionality

**Location**: `src/services/ipRateLimitService.ts`

**What it does**:
- Tracks authentication attempts by IP address
- Limits attempts per time window (default: 10 attempts per 15 minutes)
- Progressive blocking (increases block duration for repeat offenders)
- Tracks device fingerprints from each IP
- Stores data in Firestore for persistence

**Limitation**: 
- **Requires backend API**: Cannot get client IP address in browser environment
- The service is ready but needs a backend API endpoint to get IP addresses
- Currently, rate limiting is done by email address as a fallback

**Usage (when backend API is available)**:
```typescript
import { IPRateLimitService } from '../services/ipRateLimitService';

// Check if IP is rate limited
const result = await IPRateLimitService.checkIPRateLimit(ipAddress, deviceFingerprint);
if (!result.allowed) {
  // Block request
}

// Record failed attempt
await IPRateLimitService.recordFailedAttempt(ipAddress, deviceFingerprint);

// Clear on success
await IPRateLimitService.clearIPRateLimit(ipAddress);
```

**Next Steps**:
- Create backend API endpoint to get client IP
- Integrate IP rate limiting in authentication flow
- Use Cloud Functions or Firebase Extensions for IP-based rate limiting

### 2. Device Fingerprinting ✅

**Status**: Fully implemented

**Location**: `src/utils/deviceFingerprint.ts`

**What it does**:
- Generates a unique fingerprint for each device using browser characteristics
- Uses multiple factors: user agent, screen resolution, timezone, canvas fingerprint, WebGL fingerprint
- Stores fingerprint in localStorage for persistence
- Creates a stable identifier for tracking suspicious devices

**Features**:
- Canvas fingerprinting (browser rendering characteristics)
- WebGL fingerprinting (graphics card identification)
- Hardware concurrency (CPU cores)
- Screen resolution and color depth
- Timezone offset
- Language and platform

**Usage**:
```typescript
import { getDeviceFingerprint, storeDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprint';

// Get or generate device fingerprint
const fingerprint = getDeviceFingerprint();

// Store fingerprint (called automatically on mount)
storeDeviceFingerprint();

// Get full device information
const deviceInfo = getDeviceInfo();
```

**Integration**:
- Automatically initialized on sign-in page mount
- Stored in localStorage for persistence
- Can be used with IP rate limiting and brute force protection

### 3. CAPTCHA Integration (reCAPTCHA v3) ✅

**Status**: Utility created, optional (requires configuration)

**Location**: `src/utils/recaptcha.ts`

**What it does**:
- Integrates Google reCAPTCHA v3 for bot detection
- Executes reCAPTCHA on form submission
- Returns token for backend verification
- Non-intrusive (no challenges for users)

**Features**:
- Automatic script loading
- Token generation for actions (signin, register)
- Backend verification utility (for when backend API is added)
- Optional - won't break if not configured

**Configuration Required**:
```env
# .env.local
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
VITE_RECAPTCHA_SECRET_KEY=your_secret_key_here  # Only needed on backend
```

**Setup Steps**:
1. Go to https://www.google.com/recaptcha/admin/create
2. Select reCAPTCHA v3
3. Add your domain (bgr8.uk, localhost for dev)
4. Copy Site Key to `.env.local` as `VITE_RECAPTCHA_SITE_KEY`
5. Copy Secret Key (store securely, use on backend)

**Usage**:
```typescript
import { executeRecaptcha, initializeRecaptcha } from '../utils/recaptcha';

// Initialize on page load (done automatically)
initializeRecaptcha();

// Execute before form submission
const token = await executeRecaptcha('signin');
// Send token to backend for verification
```

**Current Status**:
- Frontend integration complete
- Token is generated but not yet verified (needs backend API)
- Works gracefully if keys are not configured

**Next Steps**:
- Create backend API endpoint for token verification
- Verify token on backend before processing authentication
- Use score threshold (default: 0.5) to determine if request is legitimate

### 4. Honeypot Fields ✅

**Status**: Fully implemented

**Location**: `src/utils/honeypot.ts`, integrated in `SignInPage.tsx`

**What it does**:
- Adds hidden form fields that humans won't see but bots will fill
- Detects bots when honeypot field is filled
- Blocks submissions from bots automatically

**Features**:
- Randomly generated field names (harder for bots to detect)
- Hidden with CSS (position: absolute, left: -9999px, opacity: 0)
- Not included in tab order (tabIndex: -1)
- Marked as aria-hidden for screen readers
- Automatically validated on form submission

**Usage**:
```typescript
import { generateHoneypotField, validateHoneypot } from '../utils/honeypot';

// Generate honeypot field (once per component)
const honeypotField = generateHoneypotField();

// In form
<input
  type="text"
  {...honeypotField.props}
  value={honeypotValue}
  onChange={(e) => setHoneypotValue(e.target.value)}
/>

// On submit
const check = validateHoneypot({ [honeypotField.name]: honeypotValue }, honeypotField.name);
if (check.isBot) {
  // Block submission
}
```

**Integration**:
- ✅ Integrated in `SignInPage.tsx`
- ✅ Automatically validates on form submission
- ✅ Blocks bot submissions silently

## Feature Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| IP-based Rate Limiting | ⚠️ Service Created | Requires backend API for IP address |
| Device Fingerprinting | ✅ Fully Implemented | Working client-side |
| CAPTCHA Integration | ⚠️ Utility Created | Requires configuration and backend verification |
| Honeypot Fields | ✅ Fully Implemented | Working and integrated |

## Next Steps

### Short Term (Can do now)
1. ✅ Device fingerprinting - DONE
2. ✅ Honeypot fields - DONE
3. ⚠️ Configure reCAPTCHA keys (optional)
4. ⚠️ Integrate device fingerprinting with brute force protection

### Medium Term (Requires backend API)
1. Create backend API endpoint to get client IP addresses
2. Integrate IP-based rate limiting in authentication flow
3. Create backend API endpoint for reCAPTCHA verification
4. Verify reCAPTCHA tokens on backend before authentication

### Long Term (Optional enhancements)
1. Use Firebase Cloud Functions for IP-based rate limiting
2. Implement geolocation-based blocking
3. Add machine learning for bot detection
4. Implement progressive challenges (CAPTCHA only when suspicious)

## Configuration

### Required Environment Variables

**For CAPTCHA (Optional)**:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

**For Backend API (when created)**:
```env
VITE_BACKEND_API_URL=https://your-api.com
VITE_BACKEND_API_KEY=your_api_key_here
```

### Firebase Collections Used

- `ipRateLimits` - IP-based rate limiting data
- `bruteForceProtection` - Brute force protection (already exists)
- `deviceFingerprints` - Device tracking (can be added)

## Testing

### Test Device Fingerprinting
```typescript
import { getDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprint';

const fingerprint = getDeviceFingerprint();
console.log('Device fingerprint:', fingerprint);

const info = getDeviceInfo();
console.log('Device info:', info);
```

### Test Honeypot Fields
1. Open sign-in form
2. Inspect page source
3. Find hidden honeypot field
4. Try to fill it manually (should be blocked)
5. Submit form normally (should work)

### Test CAPTCHA (when configured)
1. Set up reCAPTCHA keys in `.env.local`
2. Open sign-in form
3. Check browser console for reCAPTCHA initialization
4. Submit form - should execute reCAPTCHA
5. Check network tab for reCAPTCHA token

## Security Considerations

1. **Device Fingerprinting**: 
   - Privacy-conscious (no PII collected)
   - Used only for security purposes
   - Consider adding privacy policy notice

2. **Honeypot Fields**:
   - Harmless if detected by bots (they just won't work)
   - Multiple honeypot fields can be used for better protection

3. **CAPTCHA**:
   - Respects user privacy (reCAPTCHA v3 is privacy-focused)
   - No user interaction required
   - Scores users from 0.0 (bot) to 1.0 (human)

4. **IP Rate Limiting**:
   - Be careful not to block legitimate users
   - Consider whitelisting trusted IPs
   - Monitor false positives

## Documentation References

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Device Fingerprinting Best Practices](https://github.com/fingerprintjs/fingerprintjs)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

