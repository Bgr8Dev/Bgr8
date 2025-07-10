const fs = require('fs');
const path = require('path');

// Read the service account JSON file
const serviceAccountPath = path.join(__dirname, 'resounding-ace-465520-u4-d71a6d94cd85.json');

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Create .env content
  const envContent = `# Google Service Account Credentials
# Get these from Google Cloud Console > APIs & Services > Credentials > Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccount.client_email}
GOOGLE_PRIVATE_KEY="${serviceAccount.private_key}"

# Google Calendar Configuration
# Use 'primary' for service account's own calendar, or a shared calendar ID
# Example: GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_ID=primary

# Server Configuration
PORT=3001

# Optional: Enable detailed logging
DEBUG=false
`;

  // Write to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created successfully!');
  console.log(`📧 Service Account Email: ${serviceAccount.client_email}`);
  console.log('🔑 Private key has been properly formatted');
  console.log('🚀 You can now start the server with: npm start');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please create a .env file manually with the following content:');
  console.log('');
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com');
  console.log('GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"');
  console.log('GOOGLE_CALENDAR_ID=primary');
  console.log('PORT=3001');
  console.log('DEBUG=false');
} 