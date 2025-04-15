import express from 'express';
import cors from 'cors';
import { createCheckoutSession, handleWebhook } from './stripe.js';
import { config } from './config.js';

const app = express();
const port = config.PORT;

// Debug logging
console.log('Environment variables loaded:');
console.log('- STRIPE_SECRET_KEY:', config.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
console.log('- PORT:', config.PORT);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook requires raw body
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Other routes use JSON body parser
app.use(express.json());

// Routes
app.post('/create-checkout-session', createCheckoutSession);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    stripe: config.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 