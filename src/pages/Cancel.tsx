import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { FaTimesCircle } from 'react-icons/fa';
import '../styles/payment/Cancel.css';

export default function Cancel() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'cancelled' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found');
      return;
    }

    const processCancellation = async () => {
      try {
        // Update the invoice status to cancelled
        const invoiceRef = doc(firestore, "Bgr8Donations", "Invoices", sessionId);
        await updateDoc(invoiceRef, {
          status: 'cancelled',
          cancelledAt: new Date()
        });

        setStatus('cancelled');
        setMessage('Payment was cancelled successfully.');
      } catch (error) {
        console.error('Error processing cancellation:', error);
        setStatus('error');
        setMessage('There was an error processing your cancellation. Please contact support.');
      }
    };

    processCancellation();
  }, [searchParams]);

  return (
    <div className="cancel-page">
      <div className="cancel-container">
        {status === 'loading' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Processing cancellation...</h2>
            <p>Please wait while we cancel your transaction.</p>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="cancelled-state">
            <FaTimesCircle className="cancel-icon" />
            <h2>Payment Cancelled</h2>
            <p>{message}</p>
            <div className="cancel-details">
              <p><strong>Session ID:</strong> {searchParams.get('session_id')}</p>
            </div>
            <a href="/" className="back-home-btn">Return to Home</a>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <FaTimesCircle className="error-icon" />
            <h2>Cancellation Error</h2>
            <p>{message}</p>
            <a href="/" className="back-home-btn">Return to Home</a>
          </div>
        )}
      </div>
    </div>
  );
} 