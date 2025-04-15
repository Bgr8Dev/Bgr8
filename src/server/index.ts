import express from 'express';
import cors from 'cors';
import { createCheckoutSession, handleWebhook } from './stripe';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Stripe webhook endpoint needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Other routes use JSON body parser
app.use(express.json());

// Stripe routes
app.post('/create-checkout-session', createCheckoutSession);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 