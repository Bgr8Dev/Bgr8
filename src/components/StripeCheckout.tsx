import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Ensure STRIPE_PUBLISHABLE_KEY is defined
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface StripeCheckoutProps {
  priceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CheckoutSessionResponse {
  sessionId: string;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  priceId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${document.location.origin}/success`,
          cancelUrl: `${document.location.origin}/cancel`,
        }),
      });

      const data = await response.json() as CheckoutSessionResponse;
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }

      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onCancel?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? 'Processing...' : 'Checkout'}
      </button>
      {error && (
        <div className="mt-2 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}; 