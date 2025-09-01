import { useState, useEffect, useCallback } from 'react';
import { applyButtonEmergeAnimation, initializeModalForButtonEmerge } from '../utils/modalAnimation';

interface UseButtonEmergeModalOptions {
  modalSelector: string;
  animationDuration?: number;
}

/**
 * Custom hook for managing button-emerge modal animations
 * Handles loading states and ensures smooth animations
 */
export const useButtonEmergeModal = ({ 
  modalSelector, 
  animationDuration = 1000 
}: UseButtonEmergeModalOptions) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize modal when it opens
  useEffect(() => {
    if (isModalOpen) {
      const modal = document.querySelector(modalSelector) as HTMLElement;
      if (modal) {
        initializeModalForButtonEmerge(modal);
      }
    }
  }, [isModalOpen, modalSelector]);

  // Create button click handler with animation
  const openModalWithAnimation = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    
    // Add button highlight effect
    button.classList.add('pem-button-emerging');
    setTimeout(() => {
      button.classList.remove('pem-button-emerging');
    }, 800);

    // Set animating state
    setIsAnimating(true);
    
    // Open modal
    setIsModalOpen(true);

    // Apply emerge animation after modal is rendered
    setTimeout(() => {
      const modal = document.querySelector(modalSelector) as HTMLElement;
      if (modal) {
        applyButtonEmergeAnimation(modal, button);
        
        // Reset animating state after animation completes
        setTimeout(() => {
          setIsAnimating(false);
        }, animationDuration);
      }
    }, 10);
  }, [modalSelector, animationDuration]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsAnimating(false);
  }, []);

  return {
    isModalOpen,
    isAnimating,
    openModalWithAnimation,
    closeModal
  };
};
