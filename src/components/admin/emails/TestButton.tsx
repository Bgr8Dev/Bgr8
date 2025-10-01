import React from 'react';
import { FaSpinner, FaInfoCircle, FaCheck, FaTimes } from 'react-icons/fa';

interface TestStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  timestamp: Date | null;
}

interface TestButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  text: string;
  disabled?: boolean;
  status: TestStatus;
}

export const TestButton: React.FC<TestButtonProps> = ({ 
  onClick, 
  title, 
  icon, 
  text, 
  disabled = false,
  status 
}) => {
  return (
    <div className="email-test-button-container">
      <button 
        className="email-refresh-btn"
        onClick={onClick}
        title={title}
        disabled={disabled || status.status === 'testing'}
      >
        {status.status === 'testing' ? <FaSpinner className="email-spinning" /> : icon}
        {text}
      </button>
      
      {/* Status Bar */}
      <div className={`email-test-status-bar email-test-status-${status.status}`}>
        <div className="email-test-status-content">
          <div className="email-test-status-icon">
            {status.status === 'idle' && <FaInfoCircle />}
            {status.status === 'testing' && <FaSpinner className="email-spinning" />}
            {status.status === 'success' && <FaCheck />}
            {status.status === 'error' && <FaTimes />}
          </div>
          <div className="email-test-status-text">
            <div className="email-test-status-message">
              {status.status === 'idle' && 'Ready to test'}
              {status.status === 'testing' && status.message}
              {status.status === 'success' && status.message}
              {status.status === 'error' && status.message}
            </div>
            {status.timestamp && (
              <div className="email-test-status-time">
                {status.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestButton;
