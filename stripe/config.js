import dotenv from 'dotenv';

// Try to load .env file, but don't fail if it doesn't exist
try {
  dotenv.config();
} catch (error) {
  console.log('No .env file found, using process.env variables');
}

// Configuration object
export const config = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  PORT: process.env.PORT || 3001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};

// Verify required environment variables
if (!config.STRIPE_SECRET_KEY) {
  console.error('Missing required STRIPE_SECRET_KEY environment variable');
}

if (!config.STRIPE_WEBHOOK_SECRET) {
  console.warn('Missing STRIPE_WEBHOOK_SECRET environment variable - webhook verification will be disabled');
} 