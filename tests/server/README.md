# Server Tests

This directory contains integration tests for the backend servers.

## Available Tests

- `calcom-server.test.mjs` - Tests for the Cal.com proxy server
- `email-server.test.mjs` - Tests for the email server
- `firebase-server.test.mjs` - Tests for the Firebase server

## Running Tests

### Run All Server Tests

```bash
npm run test:servers
```

This will run all server tests in the `tests/server/` directory.

### Run Tests with Authentication

To test authenticated endpoints, you need to provide a Firebase ID token:

```bash
npm run test:servers:auth
```

Or set the environment variable manually:

```bash
# For Cal.com server tests
export CALCOM_SERVER_AUTH_TOKEN=your-firebase-id-token

# For Firebase server tests
export FIREBASE_SERVER_AUTH_TOKEN=your-firebase-id-token

# Run tests
npm run test:servers
```

### Getting a Firebase ID Token

Use the provided script to get an ID token:

```bash
npm run auth:token
```

Or manually:

```bash
node scripts/get-id-token.mjs
```

## Environment Variables

### Firebase Server Test Variables

- `FIREBASE_SERVER_BASE_URL` - Firebase server URL (default: `https://bgr8-firebase-server.onrender.com`)
- `FIREBASE_SERVER_AUTH_TOKEN` - Firebase ID token for authenticated tests

### Cal.com Server Test Variables

- `CALCOM_SERVER_BASE_URL` - Cal.com server URL (default: `https://bgr8-cal-server.onrender.com`)
- `CALCOM_SERVER_AUTH_TOKEN` - Firebase ID token for authenticated tests

## Test Coverage

### Firebase Server Test Coverage

- ✅ Health check endpoint
- ✅ Authentication validation (missing/invalid tokens)
- ✅ Matches endpoints (create, get, validation)
- ✅ Messaging endpoints (conversations, send, validation)
- ✅ Sessions endpoints (create, get, status, feedback)
- ✅ Error handling (malformed JSON, invalid methods)
- ✅ CORS headers

## Test Structure

Tests follow Node.js built-in test runner format:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

test('test name', async () => {
  // Test implementation
  assert.ok(condition, 'Error message');
});
```

## Notes

- Tests are integration tests that connect to live/deployed servers
- Some tests are skipped if authentication tokens are not provided
- Tests validate both success and error scenarios
- Payload validation is tested for all endpoints
