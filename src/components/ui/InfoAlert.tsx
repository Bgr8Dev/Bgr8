import React, { useState } from 'react';
import { FaInfoCircle, FaTimes, FaLightbulb } from 'react-icons/fa';

interface InfoAlertProps {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warning';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function InfoAlert({ 
  title, 
  children, 
  type = 'info', 
  dismissible = true,
  onDismiss,
  className = ''
}: InfoAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  const getTypeClasses = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50/50 border-blue-200/50 text-blue-700';
      case 'tip':
        return 'bg-amber-50/50 border-amber-200/50 text-amber-700';
      case 'warning':
        return 'bg-orange-50/50 border-orange-200/50 text-orange-700';
      default:
        return 'bg-blue-50/50 border-blue-200/50 text-blue-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <FaLightbulb className="text-amber-500" size={14} />;
      case 'warning':
        return <FaInfoCircle className="text-orange-500" size={14} />;
      default:
        return <FaInfoCircle className="text-blue-500" size={14} />;
    }
  };

  return (
    <div className={`info-alert ${getTypeClasses()} ${className}`}>
      <div className="info-alert-content">
        <div className="info-alert-icon">
          {getIcon()}
        </div>
        <div className="info-alert-text">
          <h4 className="info-alert-title">{title}</h4>
          <div className="info-alert-description">
            {children}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="info-alert-dismiss"
            aria-label="Dismiss alert"
          >
            <FaTimes size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
