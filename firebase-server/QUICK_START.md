# Firebase Server Quick Start

This server acts as a secure proxy between the frontend and Firebase Firestore, preventing exposure of Firebase credentials and enforcing authentication and authorization on requests.

## Running the Server

### Option 1: Run Both Servers Together (Recommended)

```bash
npm run dev:stack
```

This will start the Vite dev server, Cal.com proxy server, email server, and Firebase server simultaneously.

### Option 2: Run Servers Separately

Terminal 1 (Frontend):

```bash
npm run dev
```

Terminal 2 (Firebase Server):

```bash
npm run firebase:server
```

Or from the firebase-server directory:

```bash
cd firebase-server
npm install
npm start
```

## Server Details


- **Port**: 4001 (default, can be changed via `FIREBASE_SERVER_PORT` environment variable)
- **Health Check**: `http://localhost:4001/`
- **Auth**: All non-health endpoints require `Authorization: Bearer <Firebase_ID_Token>`

## Environment Variables
The server uses the same Firebase Admin credentials as the Cal.com server. Ensure these are set in your `.env` file in the project root:

```env
# Firebase Admin SDK (same as Cal.com server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: Custom port
FIREBASE_SERVER_PORT=4001

# Optional: Server URL (for client-side)
VITE_FIREBASE_SERVER_URL=http://localhost:4001
```

## API Endpoints

### Matches

- `POST /api/matches` - Create a match between two users
- `GET /api/matches` - Get all matches for the authenticated user
- `GET /api/matches/:matchedUserId` - Get a specific match
- `DELETE /api/matches/:matchedUserId` - Remove a match
- `PATCH /api/matches/:matchedUserId/last-message` - Update last message timestamp
- `PATCH /api/matches/:matchedUserId/unread/increment` - Increment unread count
- `PATCH /api/matches/:matchedUserId/unread/reset` - Reset unread count

### Messaging

- `POST /api/messaging/conversations` - Get or create a conversation
- `POST /api/messaging/send` - Send a message
- `GET /api/messaging/conversations` - Get all conversations
- `GET /api/messaging/messages/:conversationId` - Get messages for a conversation
- `PATCH /api/messaging/messages/:conversationId/read` - Mark messages as read

### Sessions

- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all sessions for the authenticated user
- `GET /api/sessions/:sessionId` - Get a specific session
- `PATCH /api/sessions/:sessionId/status` - Update session status
- `POST /api/sessions/:sessionId/feedback` - Submit feedback for a session
- `GET /api/sessions/:sessionId/feedback` - Get feedback for a session

## Troubleshooting

If you see `ERR_CONNECTION_REFUSED`:

1. Make sure the Firebase server is running on port 4001
2. Check that port 4001 is not already in use
3. Verify Firebase Admin credentials are set in the server environment
4. Ensure the CSP in `index.html` allows `http://localhost:4001`

## Migration Status

This server is being migrated incrementally. Currently implemented:


- ✅ Matches service endpoints
- ✅ Messaging service endpoints
- ✅ Sessions service endpoints
- ⏳ Feedback service endpoints (coming soon)
- ⏳ Other services (planned)

## Usage Example
```typescript
import { FirebaseApiService } from '../services/firebaseApiService';

// Create a match
const matchId = await FirebaseApiService.createMatch(otherUserId);

// Get all matches
const matches = await FirebaseApiService.getMatches();

// Send a message
const messageId = await FirebaseApiService.sendMessage(
  recipientId,
  'Hello!',
  'text'
);
```
