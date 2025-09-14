# Instagram API Integration Setup Guide

This guide will help you set up Instagram API integration for your BGr8 website.

## Prerequisites

1. A Facebook Developer account
2. An Instagram account (personal or business)
3. Access to your website's environment variables

## Step 1: Create a Facebook App

1. Go to [Facebook Developers Portal](https://developers.facebook.com/)
2. Click "Create App" and select "Consumer" app type
3. Fill in your app details:
   - App Name: "BGr8 Website"
   - App Contact Email: Your email
   - App Purpose: Choose appropriate category

## Step 2: Add Instagram Basic Display API

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Configure the product:
   - Valid OAuth Redirect URIs: `http://localhost:5173/auth/instagram/callback` (for development)
   - Valid OAuth Redirect URIs: `https://yourdomain.com/auth/instagram/callback` (for production)

## Step 3: Create Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Instagram API Configuration (Vite format)
VITE_INSTAGRAM_APP_ID=your_facebook_app_id_here
VITE_INSTAGRAM_APP_SECRET=your_facebook_app_secret_here
VITE_INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
VITE_INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback
```

## Step 4: Get Access Token

### Option A: Using Instagram Basic Display API (Recommended for personal accounts)

1. **Generate Authorization URL:**
   ```javascript
   const authURL = instagramService.generateAuthURL(
     'YOUR_APP_ID',
     'YOUR_REDIRECT_URI'
   );
   console.log('Visit this URL to authorize:', authURL);
   ```

2. **After authorization, extract the code from the callback URL:**
   ```javascript
   const code = instagramService.extractCodeFromCallback(window.location.href);
   ```

3. **Exchange code for access token:**
   ```javascript
   const accessToken = await instagramService.exchangeCodeForToken(
     code,
     'YOUR_APP_ID',
     'YOUR_APP_SECRET',
     'YOUR_REDIRECT_URI'
   );
   ```

4. **Get long-lived token (optional but recommended):**
   ```javascript
   const longLivedToken = await instagramService.getLongLivedToken(
     accessToken,
     'YOUR_APP_SECRET'
   );
   ```

### Option B: For Business Accounts (Instagram Graph API)

If you have a business Instagram account connected to a Facebook Page:

1. Go to Facebook Developers Portal
2. Add "Instagram Graph API" product
3. Connect your Instagram Business account to a Facebook Page
4. Use the Page Access Token to access Instagram data

## Step 5: Test the Integration

1. Add your access token to the `.env` file
2. Restart your development server
3. Visit your BGr8 page to see the Instagram feed

## Step 6: Token Management

### Long-lived Token Refresh

Instagram access tokens expire. You'll need to refresh them periodically:

```javascript
// Refresh token (should be done before it expires)
const newToken = await instagramService.refreshLongLivedToken(longLivedToken);
```

### Token Expiration Handling

Add error handling in your component to detect expired tokens:

```javascript
useEffect(() => {
  if (error && error.includes('token')) {
    // Handle token expiration
    console.log('Instagram token expired, please refresh');
  }
}, [error]);
```

## Troubleshooting

### Common Issues

1. **"Invalid access token"**
   - Check if your token is correct
   - Verify the token hasn't expired
   - Ensure you're using the right API version

2. **"User not authorized"**
   - Make sure the Instagram account has granted permissions
   - Check that the user is added as a test user in your Facebook app

3. **"Rate limit exceeded"**
   - Instagram has rate limits (200 calls per hour per user)
   - Implement caching to reduce API calls
   - Consider using a backend service to cache data

### Rate Limits

- **Basic Display API**: 200 calls per hour per user
- **Graph API**: 4800 calls per hour per app

## Security Considerations

1. **Never expose your App Secret in client-side code**
2. **Use environment variables for all sensitive data**
3. **Implement proper error handling**
4. **Consider using a backend service for production**

## Alternative Solutions

If the Instagram API setup is too complex, consider these alternatives:

1. **EmbedSocial**: Third-party service that handles Instagram integration
2. **SnapWidget**: Simple Instagram widget
3. **Juicer**: Social media aggregator
4. **Manual updates**: Periodically update posts manually

## Production Deployment

1. Update redirect URIs to your production domain
2. Submit your app for Facebook review if needed
3. Implement proper error handling and fallbacks
4. Consider using a backend service to manage tokens securely

## Support

For issues with the Instagram API, check:
- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Developers Community](https://developers.facebook.com/community/)
- [Instagram API Status](https://developers.facebook.com/status/)
