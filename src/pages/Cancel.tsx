import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import '../styles/payment/Cancel.css';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Cancel() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateDonationStatus = async () => {
      try {
        // Get session ID from URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');

        if (sessionId) {
          // Get the invoice document
          const invoiceRef = doc(db, "B8World", "Donations", "Invoices", sessionId);
          const invoiceDoc = await getDoc(invoiceRef);

          if (invoiceDoc.exists()) {
            // Update invoice status to cancelled
            await updateDoc(invoiceRef, {
              status: 'cancelled',
              cancelledAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Error updating donation status:', error);
      }
    };

    updateDonationStatus();
  }, [location]);

  return (
    <div className="cancel-container">
      <div className="cancel-content">
        <FaTimesCircle className="cancel-icon" />
        <h1>Donation Cancelled</h1>
        <p>Your donation was not completed. No charges have been made to your account.</p>
        <p>If you'd like to try again or have any questions, please feel free to contact us.</p>
        <button 
          className="try-again-btn"
          onClick={() => navigate('/')}
        >
          Return Home
        </button>
      </div>
    </div>
  );
} 