import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

export const config = {
  STRIPE_SECRET_KEY: process.env.VITE_STRIPE_TEST_SECRET_KEY,
  PORT: process.env.PORT || 3001,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
};

// Verify required environment variables
if (!config.STRIPE_SECRET_KEY) {
  console.error('Missing VITE_STRIPE_TEST_SECRET_KEY environment variable');
  process.exit(1);
} 