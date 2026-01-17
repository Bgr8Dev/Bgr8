# Firebase Server

Secure proxy server for Firestore operations. This server acts as a secure gateway between the frontend and Firebase, preventing exposure of Firebase credentials and enforcing authentication and authorization rules.

## Why This Server?

- **Security**: Firebase config and Admin SDK credentials are kept server-side only
- **Authorization**: Enforces user authentication and role-based access control
- **Data Protection**: Prevents unauthorized access to user data
- **Inspect Element Protection**: Firebase references are not exposed in client-side code

## Running the Server

### Option 1: Run with Frontend (Recommended)
```bash
# From project root
npm run dev:stack
```

This runs the frontend, Cal.com server, email server, and Firebase server together.

### Option 2: Run Firebase Server Only
```bash
cd firebase-server
npm install
npm start

# Or for development with auto-reload
npm run dev
```

### Option 3: From Project Root
```bash
# Add to package.json scripts:
npm run firebase:server
```

## Server Details

- **Port**: 4001 (default, configurable via `FIREBASE_SERVER_PORT`)
- **Health Check**: `GET http://localhost:4001/`
- **Auth**: All endpoints require `Authorization: Bearer <Firebase_ID_Token>`

## Environment Variables

The server uses the same Firebase Admin credentials as the Cal.com server. Create a `.env` file in the project root:

```env
# Firebase Admin SDK (same as Cal.com server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: Custom port
FIREBASE_SERVER_PORT=4001
```

## API Endpoints

### Matches

- `POST /api/matches` - Create a match between two users
- `GET /api/matches` - Get all matches for the authenticated user
- `GET /api/matches/:matchedUserId` - Get a specific match
- `DELETE /api/matches/:matchedUserId` - Remove a match (unmatch)
- `PATCH /api/matches/:matchedUserId/last-message` - Update last message timestamp
- `PATCH /api/matches/:matchedUserId/unread/increment` - Increment unread count
- `PATCH /api/matches/:matchedUserId/unread/reset` - Reset unread count

### Messaging

- `POST /api/messaging/conversations` - Get or create a conversation
- `POST /api/messaging/send` - Send a message
- `GET /api/messaging/conversations` - Get all conversations for the authenticated user
- `GET /api/messaging/messages/:conversationId` - Get messages for a conversation
- `PATCH /api/messaging/messages/:conversationId/read` - Mark messages as read

### Sessions

- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all sessions for the authenticated user (as mentor or mentee)
- `GET /api/sessions/:sessionId` - Get a specific session
- `PATCH /api/sessions/:sessionId/status` - Update session status
- `POST /api/sessions/:sessionId/feedback` - Submit feedback for a session
- `GET /api/sessions/:sessionId/feedback` - Get feedback for a session

### Feedback Tickets

Coming soon...

## Authentication

All endpoints (except the health check) require a Firebase ID token:

```javascript
const token = await auth.currentUser.getIdToken();
fetch('http://localhost:4001/api/matches', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Authorization

- Users can only access their own data
- Admins can access any data
- Cross-user operations are validated (e.g., sending messages to matched users only)

## Migration Status

This server is being migrated incrementally. Current status:

- ✅ Matches service - Fully migrated
- ✅ Messaging service - Fully migrated
- ✅ Sessions service - Fully migrated
- ⏳ Feedback service - In progress
- ⏳ Other services - Planned

## Troubleshooting

If you see `ERR_CONNECTION_REFUSED`:
1. Make sure the Firebase server is running on port 4001
2. Check that port 4001 is not already in use
3. Verify Firebase Admin credentials are set in the server environment
4. Ensure the CSP in `index.html` allows `http://localhost:4001`

## Development

To extend the server with new endpoints:

1. Add the endpoint handler in `firebaseServer.mjs`
2. Use the `authenticateRequest` middleware for authentication
3. Verify permissions with `checkPermission` helper
4. Use Firestore Admin SDK for database operations
5. Return consistent JSON responses
6. Handle errors gracefully with proper HTTP status codes
