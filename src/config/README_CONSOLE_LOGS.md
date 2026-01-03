# Console Log Configuration

This document explains how to use the centralized console log configuration system.

## Overview

The console log configuration system allows you to:
- Enable/disable console logs globally or by category
- Control logging based on environment (development vs production)
- Filter specific types of logs (e.g., analytics, API calls, errors)
- Configure via environment variables or programmatically

## Quick Start

### Basic Usage

Instead of using `console.log()` directly, use the logger utility:

```typescript
import { logger, loggers } from '../utils/logger';

// General logging
logger.log('This is a general log message');

// Category-specific logging
loggers.analytics.log('Analytics event tracked');
loggers.api.log('API call made');
loggers.error.error('An error occurred');
loggers.booking.log('Booking created');
```

### Using Pre-configured Loggers

```typescript
import { loggers } from '../utils/logger';

// Analytics logs (can be disabled separately)
loggers.analytics.log('User clicked button');

// Firebase logs
loggers.firebase.log('Firebase operation completed');

// API logs
loggers.api.log('API request:', requestData);

// Auth logs
loggers.auth.log('User authenticated');

// Booking logs
loggers.booking.log('Booking saved');

// Email logs
loggers.email.log('Email sent');

// Config logs
loggers.config.log('Configuration loaded');
```

### Creating Custom Category Loggers

```typescript
import { createLogger } from '../utils/logger';

const myCustomLogger = createLogger('other');
myCustomLogger.log('Custom log message');
```

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Master switch for all console logs
VITE_CONSOLE_LOGS_ENABLED=true

# Enable logs in development (default: true)
VITE_CONSOLE_LOGS_DEV=true

# Enable logs in production (default: false)
VITE_CONSOLE_LOGS_PROD=false

# Enable analytics logs specifically (default: false)
VITE_CONSOLE_LOGS_ANALYTICS=false
```

### Programmatic Configuration

```typescript
import { setConsoleConfig, getConsoleConfig } from '../config/consoleConfig';

// Update configuration at runtime
setConsoleConfig({
  enabled: true,
  enableInProduction: false,
  categories: {
    analytics: false,  // Disable analytics logs
    error: true,       // Always show errors
    warn: true,        // Always show warnings
    api: true,         // Enable API logs
  }
});

// Get current configuration
const config = getConsoleConfig();
console.log(config);
```

## Available Categories

- `all` - All logs (master category)
- `error` - Error logs (console.error)
- `warn` - Warning logs (console.warn)
- `info` - Info logs (console.info)
- `log` - General logs (console.log)
- `debug` - Debug logs (console.debug)
- `analytics` - Google Analytics, tracking, etc.
- `firebase` - Firebase-related logs
- `api` - API calls and responses
- `auth` - Authentication-related logs
- `booking` - Booking/Cal.com related logs
- `email` - Email service logs
- `config` - Configuration logs
- `other` - Other/miscellaneous logs

## Default Behavior

- **Development**: All logs enabled by default (except analytics)
- **Production**: Only errors and warnings enabled by default
- **Analytics**: Disabled by default in all environments

## Examples

### Example 1: Disable Analytics Logs

```typescript
// In your .env.local
VITE_CONSOLE_LOGS_ANALYTICS=false

// In your code
import { loggers } from '../utils/logger';

// This won't log if analytics is disabled
loggers.analytics.log('User event tracked');
```

### Example 2: Enable All Logs in Production (for debugging)

```typescript
// In your .env.local
VITE_CONSOLE_LOGS_PROD=true
VITE_CONSOLE_LOGS_ENABLED=true
```

### Example 3: Disable All Logs Except Errors

```typescript
import { setConsoleConfig } from '../config/consoleConfig';

setConsoleConfig({
  enabled: true,
  categories: {
    error: true,
    warn: false,
    log: false,
    info: false,
    debug: false,
    analytics: false,
  }
});
```

### Example 4: Migrating Existing Code

**Before:**
```typescript
console.log('Email config loaded:', config);
console.error('Error saving booking:', error);
```

**After:**
```typescript
import { loggers } from '../utils/logger';

loggers.email.log('Email config loaded:', config);
loggers.booking.error('Error saving booking:', error);
```

## Best Practices

1. **Use category-specific loggers** for better control:
   ```typescript
   loggers.api.log('API call')  // ✅ Good
   logger.log('API call')       // ⚠️ Less specific
   ```

2. **Always use loggers for new code** instead of direct console calls

3. **Use appropriate log levels**:
   - `error()` for errors
   - `warn()` for warnings
   - `log()` for general information
   - `debug()` for detailed debugging

4. **Keep analytics logs separate** so they can be easily disabled

5. **Don't log sensitive information** even if logs are disabled

## Migration Guide

To migrate existing `console.*` calls:

1. Import the logger utility:
   ```typescript
   import { logger, loggers } from '../utils/logger';
   ```

2. Replace `console.log()` with `logger.log()` or category-specific logger

3. Replace `console.error()` with `logger.error()` or `loggers.error.error()`

4. Replace `console.warn()` with `logger.warn()` or `loggers.warn.warn()`

5. For analytics/tracking logs, use `loggers.analytics.*`

## Troubleshooting

**Q: Logs aren't showing up in development**
- Check `VITE_CONSOLE_LOGS_DEV=true` in your `.env.local`
- Verify `VITE_CONSOLE_LOGS_ENABLED=true`

**Q: Logs are showing in production**
- Set `VITE_CONSOLE_LOGS_PROD=false` in your production environment
- Or set `VITE_CONSOLE_LOGS_ENABLED=false`

**Q: Analytics logs are still showing**
- Set `VITE_CONSOLE_LOGS_ANALYTICS=false`
- Or use `setConsoleConfig({ categories: { analytics: false } })`

