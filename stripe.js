const express = require('express');
const Stripe = require('stripe');
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'B8 Exclusive T-Shirt',
            images: ['https://example.com/assets/clothing1.jpg'],
          },
          unit_amount: 3000, // $30 in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });

  res.json({ id: session.id });
});
