import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import '../styles/payment/Cancel.css';

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="cancel-container">
      <div className="cancel-content">
        <FaTimesCircle className="cancel-icon" />
        <h1>Payment Cancelled</h1>
        <p>Your payment was not completed. No charges should have been made to your account.</p>
        <p>If you have any questions, please contact our support team.</p>
        <button 
          className="try-again-btn"
          onClick={() => navigate('/')}
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 