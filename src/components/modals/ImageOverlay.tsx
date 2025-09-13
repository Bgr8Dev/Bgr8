import React, { useEffect } from 'react';
import { FaTimes, FaDownload, FaExpand } from 'react-icons/fa';
import { downloadFile } from '../../utils/fileDownload';
import './ImageOverlay.css';

interface ImageOverlayProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  isOpen,
  imageUrl,
  imageName,
  onClose
}) => {
  // Handle escape key to close overlay
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    try {
      await downloadFile(imageUrl, imageName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close overlay when clicking on the backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="image-overlay" onClick={handleOverlayClick}>
      <div className="image-overlay-content">
        <div className="image-overlay-header">
          <div className="image-overlay-title">
            <FaExpand className="image-icon" />
            <span>{imageName}</span>
          </div>
          <div className="image-overlay-actions">
            <button
              className="image-overlay-btn download"
              onClick={handleDownload}
              title="Download image"
              aria-label="Download image"
            >
              <FaDownload />
            </button>
            <button
              className="image-overlay-btn close"
              onClick={onClose}
              title="Close overlay"
              aria-label="Close image overlay"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        <div className="image-overlay-body">
          <img
            src={imageUrl}
            alt={imageName}
            className="overlay-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              // Show error message
              const errorDiv = document.createElement('div');
              errorDiv.className = 'image-error';
              errorDiv.textContent = 'Failed to load image';
              target.parentNode?.appendChild(errorDiv);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageOverlay;
