import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import '../styles/payment/Success.css';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const updateDonationStatus = async () => {
      try {
        // Get session ID from URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          setError('No session ID found');
          return;
        }

        // Get the invoice document
        const invoiceRef = doc(db, "B8World", "Donations", "Invoices", sessionId);
        const invoiceDoc = await getDoc(invoiceRef);

        if (!invoiceDoc.exists()) {
          setError('Invoice not found');
          return;
        }

        // Check if this donation has already been processed
        if (invoiceDoc.data().status === 'completed') {
          setIsProcessing(false);
          setProcessed(true);
          return;
        }

        // Update invoice status
        await updateDoc(invoiceRef, {
          status: 'completed',
          completedAt: Timestamp.now()
        });

        // Get or create Fundraised document
        const fundraisedRef = doc(db, "B8World", "Fundraised");
        const fundraisedDoc = await getDoc(fundraisedRef);

        const amount = invoiceDoc.data().amount;
        const currentTotal = fundraisedDoc.exists() ? (fundraisedDoc.data().totalRaised || 0) : 0;
        const newTotal = currentTotal + amount;

        // Update or create Fundraised document
        if (fundraisedDoc.exists()) {
          await updateDoc(fundraisedRef, {
            totalRaised: newTotal,
            log: arrayUnion({
              amount,
              timestamp: Timestamp.now(),
              donorName: invoiceDoc.data().donorName || 'Anonymous',
              previousTotal: currentTotal,
              newTotal,
              sessionId
            })
          });
        } else {
          await setDoc(fundraisedRef, {
            totalRaised: amount,
            log: [{
              amount,
              timestamp: Timestamp.now(),
              donorName: invoiceDoc.data().donorName || 'Anonymous',
              previousTotal: 0,
              newTotal: amount,
              sessionId
            }]
          });
        }

        setProcessed(true);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error updating donation status:', error);
        setError('Failed to process donation. Please contact support.');
      }
    };

    // Only process if we haven't already processed this donation
    if (!processed && isProcessing) {
      updateDonationStatus();
    }
  }, [location, processed, isProcessing]);

  if (error) {
    return (
      <div className="success-container">
        <div className="success-content error">
          <FaCheckCircle className="success-icon error" />
          <h1>Oops! Something went wrong</h1>
          <p>{error}</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="loading-spinner"></div>
          <h1>Processing your donation...</h1>
          <p>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-content">
        <FaCheckCircle className="success-icon" />
        <h1>Thank You for Your Donation!</h1>
        <p>Your generous contribution has been received and will help make a difference.</p>
        <p>You will receive an email confirmation shortly.</p>
        <button 
          className="continue-shopping-btn"
          onClick={() => navigate('/')}
        >
          Return Home
        </button>
      </div>
    </div>
  );
}