import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createCheckoutSession, handleWebhook } from './stripe.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Stripe webhook requires raw body
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Other routes use JSON body parser
app.use(express.json());

// Routes
app.post('/create-checkout-session', createCheckoutSession);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 