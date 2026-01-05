/**
 * Generate Zoho OAuth Authorization URL
 * 
 * For Server-based Applications, you need to visit this URL to authorize
 * and get an authorization code.
 * 
 * Usage:
 *   node generate-auth-url.js <client_id> [redirect_uri]
 */

require('dotenv').config();

const clientId = process.argv[2] || process.env.ZOHO_CLIENT_ID;
const redirectUri = process.argv[3] || process.env.ZOHO_REDIRECT_URI || 'https://bgr8.uk/auth/callback';

if (!clientId) {
  console.error('❌ Missing Client ID!');
  console.log('\nUsage:');
  console.log('  node generate-auth-url.js <client_id> [redirect_uri]');
  console.log('\nOr set environment variables:');
  console.log('  ZOHO_CLIENT_ID=your_client_id');
  console.log('  ZOHO_REDIRECT_URI=your_redirect_uri (optional)');
  process.exit(1);
}

// Zoho Mail API scopes
const scopes = [
  'ZohoMail.messages.CREATE',
  'ZohoMail.messages.READ',
  'ZohoMail.accounts.READ'
].join(',');

// Generate the authorization URL
const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodeURIComponent(scopes)}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`;

console.log('🔗 Zoho OAuth Authorization URL:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(authUrl);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Instructions:');
console.log('1. Copy the URL above');
console.log('2. Open it in your web browser');
console.log('3. Log in with your Zoho account');
console.log('4. Authorize the application');
console.log('5. You will be redirected to:', redirectUri);
console.log('6. Copy the "code" parameter from the redirect URL');
console.log('   Example: https://bgr8.uk/auth/callback?code=1000.abc123...');
console.log('7. Use that code with the exchange script:\n');
console.log(`   node exchange-zoho-token.js "YOUR_CODE" "${clientId}" "YOUR_CLIENT_SECRET"`);