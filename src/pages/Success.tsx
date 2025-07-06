import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../styles/payment/Success.css';

export default function Success() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found');
      return;
    }

    const processPayment = async () => {
      try {
        // Update the invoice status
        const invoiceRef = doc(db, "Bgr8Donations", "Invoices", sessionId);
        await updateDoc(invoiceRef, {
          status: 'completed',
          completedAt: new Date()
        });

        // Update the total fundraised amount
        const fundraisedRef = doc(db, "Bgr8Donations", "Fundraised");
        const fundraisedDoc = await getDoc(fundraisedRef);
        
        if (fundraisedDoc.exists()) {
          await updateDoc(fundraisedRef, {
            total: increment(parseFloat(searchParams.get('amount') || '0'))
          });
        } else {
          // Create the fundraised document if it doesn't exist
          await updateDoc(fundraisedRef, {
            total: parseFloat(searchParams.get('amount') || '0')
          });
        }

        setStatus('success');
        setMessage('Payment processed successfully! Thank you for your donation.');
      } catch (error) {
        console.error('Error processing payment:', error);
        setStatus('error');
        setMessage('There was an error processing your payment. Please contact support.');
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="success-page">
      <div className="success-container">
        {status === 'loading' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Processing your payment...</h2>
            <p>Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-state">
            <FaCheckCircle className="success-icon" />
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            <div className="success-details">
              <p><strong>Session ID:</strong> {searchParams.get('session_id')}</p>
              <p><strong>Amount:</strong> £{searchParams.get('amount')}</p>
            </div>
            <a href="/" className="back-home-btn">Return to Home</a>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <FaTimesCircle className="error-icon" />
            <h2>Payment Error</h2>
            <p>{message}</p>
            <a href="/" className="back-home-btn">Return to Home</a>
          </div>
        )}
      </div>
    </div>
  );
}