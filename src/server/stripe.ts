import Stripe from 'stripe';
import { Request, Response } from 'express';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.VITE_STRIPE_TEST_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Types for the request body
interface CreateCheckoutSessionRequest {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}

// Create a checkout session
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { items, successUrl, cancelUrl } = req.body as CreateCheckoutSessionRequest;

    // Validate the request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.id, // You should fetch the actual product name from your database
          },
          unit_amount: 3000, // Replace with actual price from your database
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl || `${process.env.CLIENT_URL}/success`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        // Add any additional metadata you need
        orderId: 'order_' + Date.now(),
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Handle Stripe webhooks
export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // Handle successful payment
      console.log('Payment successful:', session.id);
      // Add your business logic here (e.g., update order status, send confirmation email)
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}; 