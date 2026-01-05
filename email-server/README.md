# Bgr8 Email Server

Backend email service for the Bgr8 admin portal that handles secure email sending through Zoho Mail API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file and configure:
```bash
cp env.example .env
```

3. Update `.env` with your Zoho Mail credentials:
   - Get your Zoho Mail API credentials from the Zoho Developer Console
   - Set up OAuth2 application and get client ID, client secret, and refresh token
   - Configure the from email and name

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the service is running

### Email Operations
- `POST /api/email/test` - Test email configuration
- `POST /api/email/send` - Send single email
- `POST /api/email/send-bulk` - Send multiple emails
- `GET /api/email/stats` - Get email statistics

### Webhooks
- `POST /api/webhooks/calcom` - Cal.com webhook endpoint for booking events
  - Automatically saves bookings made through embedded Cal.com iframe to Firestore
  - See [CALCOM_WEBHOOK_SETUP.md](./CALCOM_WEBHOOK_SETUP.md) for detailed setup instructions

## Zoho Mail Setup

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create a new application
3. Enable Zoho Mail API
4. Generate OAuth2 credentials
5. Use the refresh token for server-to-server authentication

## Security Features

- Rate limiting (100 requests per 15 minutes, 10 emails per minute)
- Input validation using Joi
- CORS protection
- Helmet security headers
- Environment variable validation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:5173) |
| `ZOHO_CLIENT_ID` | Zoho OAuth2 client ID | Yes |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth2 client secret | Yes |
| `ZOHO_REFRESH_TOKEN` | Zoho OAuth2 refresh token | Yes |
| `ZOHO_FROM_EMAIL` | Default from email | No (default: info@bgr8.uk) |
| `ZOHO_FROM_NAME` | Default from name | No (default: Bgr8 Team) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (for webhooks) | No* |
| `FIREBASE_PROJECT_ID` | Firebase project ID (alternative to service account) | No* |
| `CALCOM_WEBHOOK_SECRET` | Secret for verifying Cal.com webhook signatures | No (recommended) |

\* Required for Cal.com webhook functionality. See [CALCOM_WEBHOOK_SETUP.md](./CALCOM_WEBHOOK_SETUP.md) for details.
