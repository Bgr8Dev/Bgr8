# Zoho Mail Integration Setup Guide

This guide will help you set up Zoho Mail integration for the Bgr8 admin portal email service.

## Prerequisites

- Zoho Mail account with admin access
- Domain verified with Zoho Mail (bgr8.uk)
- Access to Zoho Developer Console

## Step 1: Create Zoho OAuth2 Application

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Sign in with your Zoho account
3. Click "Add Client" or "Create App"
4. Choose "Server-based Applications"
5. Fill in the application details:
   - **Client Name**: Bgr8 Email Service
   - **Homepage URL**: `https://bgr8.uk`
   - **Authorized Redirect URIs**: `https://bgr8.uk/auth/callback` (or your domain)
6. Click "Create"
7. Note down the **Client ID** and **Client Secret**

## Step 2: Generate Refresh Token

1. In your Zoho Developer Console, go to your application
2. Click on "Generate Code" or "Generate Token"
3. Select the following scopes:
   - `ZohoMail.messages.CREATE`
   - `ZohoMail.messages.READ`
   - `ZohoMail.accounts.READ`
4. Copy the generated **Refresh Token**

## Step 3: Configure Backend Server

1. Navigate to the `email-server` directory:
   ```bash
   cd email-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Update `.env` with your Zoho credentials and Firebase Admin:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://bgr8.uk

   # Zoho Mail Configuration
   ZOHO_CLIENT_ID=your_actual_client_id_here
   ZOHO_CLIENT_SECRET=your_actual_client_secret_here
   ZOHO_REFRESH_TOKEN=your_actual_refresh_token_here
   ZOHO_FROM_EMAIL=info@bgr8.uk
   ZOHO_FROM_NAME=Bgr8 Team

   # Firebase Admin
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
   ```

5. Start the email server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Step 4: Configure Frontend

1. Update your frontend environment variables:
   ```env
   VITE_EMAIL_API_BASE_URL=https://your-domain.com:3001
   ```

2. The frontend will automatically use Firebase Auth ID tokens for requests.

## Step 5: Test the Integration

1. Start both the frontend and email server
2. Go to the Admin Portal > Email Management
3. Check that the configuration warning is gone
4. Try sending a test email

## Step 6: Deploy to Production

### Backend Deployment

1. Deploy the email server to your hosting platform (e.g., Heroku, DigitalOcean, AWS)
2. Set environment variables in your hosting platform
3. Ensure the server is accessible from your frontend domain

### Frontend Deployment

1. Update the `VITE_EMAIL_API_BASE_URL` to point to your production email server
2. Deploy your frontend as usual

## Security Considerations

1. **Firebase Auth**: Only admin users can send email
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: The server includes rate limiting to prevent abuse
4. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### Common Issues

1. **"Email service not configured" warning**
   - Check that all environment variables are set correctly
   - Verify the email server is running and accessible

2. **"Failed to send email" errors**
   - Check Zoho Mail API credentials
   - Verify the refresh token is valid
   - Check Zoho Mail API quotas

3. **CORS errors**
   - Ensure `FRONTEND_URL` is set correctly in the email server
   - Check that the frontend URL matches exactly

### Testing API Endpoints

You can test the email server directly (requires Firebase ID token):

```bash
# Health check
curl https://your-domain.com:3001/api/health

# Authenticated endpoint example
curl -H "Authorization: Bearer FIREBASE_ID_TOKEN" \
  https://your-domain.com:3001/api/email/stats

# Test configuration
curl -X POST https://your-domain.com:3001/api/email/test

# Send test email
curl -X POST https://your-domain.com:3001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "content": "This is a test email from Bgr8",
    "contentType": "text/html"
  }'
```

## Monitoring

- Monitor email server logs for errors
- Check Zoho Mail API usage in the developer console
- Set up alerts for failed email sends
- Monitor rate limiting and adjust if needed

## Support

If you encounter issues:
1. Check the email server logs
2. Verify Zoho Mail API status
3. Test individual API endpoints
4. Contact Zoho support for API-related issues
