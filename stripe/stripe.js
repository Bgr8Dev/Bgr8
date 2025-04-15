import Stripe from 'stripe';
import { config } from './config.js';

// Initialize Stripe with the secret key
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Debug logging
console.log('Stripe initialized with API key:', config.STRIPE_SECRET_KEY.slice(0, 7) + '...');

export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency, successUrl, cancelUrl, metadata } = req.body;

    console.log('Creating checkout session with:', {
      amount,
      currency,
      successUrl,
      cancelUrl,
      metadata
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'gbp',
            product_data: {
              name: 'B8 World Donation',
              description: 'Support our global initiatives',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
    });

    console.log('Checkout session created:', session.id);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error.message,
      details: error
    });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Handle successful payment
      console.log('Payment successful:', session.id);
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment intent
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}; 