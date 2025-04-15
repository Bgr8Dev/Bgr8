import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import '../styles/payment/Success.css';

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="success-container">
      <div className="success-content">
        <FaCheckCircle className="success-icon" />
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase. Your order has been confirmed.</p>
        <p>You will receive an email confirmation shortly.</p>
        <button 
          className="continue-shopping-btn"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
} 