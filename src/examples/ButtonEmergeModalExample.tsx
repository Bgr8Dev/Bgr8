import React from 'react';
import { useButtonEmergeModal } from '../hooks/useButtonEmergeModal';

/**
 * Example component showing how to use button-emerge modal animations
 */
export const ButtonEmergeModalExample: React.FC = () => {
  // Method 1: Using the custom hook (Recommended)
  const { 
    isModalOpen, 
    isAnimating, 
    openModalWithAnimation, 
    closeModal 
  } = useButtonEmergeModal({ 
    modalSelector: '.pem-profile-edit-modal' 
  });

  return (
    <div>
      {/* Button with button-emerge animation */}
      <button 
        className="profile-edit-btn"
        onClick={openModalWithAnimation}
        disabled={isAnimating}
      >
        {isAnimating ? 'Opening...' : 'Edit Profile'}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="pem-profile-edit-modal-overlay" onClick={closeModal}>
          <div className="pem-profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal content with loading states */}
            <div className="pem-modal-left-sidebar pem-modal-loading">
              <h3>Modal Content</h3>
              <p>This content will appear after the button-emerge animation completes.</p>
            </div>
            <div className="pem-modal-right-content pem-modal-loading">
              <h3>Form Content</h3>
              <p>This form content will also appear after the animation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
