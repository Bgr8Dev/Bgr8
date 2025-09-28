import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeClasses = () => {
    switch (type) {
      case 'success': return 'modal-success';
      case 'warning': return 'modal-warning';
      case 'error': return 'modal-error';
      default: return 'modal-info';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'modal-small';
      case 'large': return 'modal-large';
      default: return 'modal-medium';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container ${getTypeClasses()} ${getSizeClasses()} ${className}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showCloseButton && (
            <button
              className="modal-close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          )}
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
