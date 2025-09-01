import { useState, useEffect, useCallback, useRef } from 'react';
import { applyButtonEmergeAnimation, initializeModalForButtonEmerge } from '../utils/modalAnimation';

interface UseButtonEmergeModalOptions {
  modalSelector: string;
  animationDuration?: number;
}

/**
 * Custom hook for managing button-emerge modal animations (Performance Optimized)
 * Handles loading states and ensures smooth animations with minimal memory usage
 */
export const useButtonEmergeModal = ({ 
  modalSelector, 
  animationDuration = 1000 
}: UseButtonEmergeModalOptions) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Use refs to avoid recreating functions and reduce memory usage
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize modal when it opens (memoized)
  useEffect(() => {
    if (isModalOpen) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const modal = document.querySelector(modalSelector) as HTMLElement;
        if (modal) {
          initializeModalForButtonEmerge(modal);
        }
      });
    }
  }, [isModalOpen, modalSelector]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (buttonTimeoutRef.current) {
        clearTimeout(buttonTimeoutRef.current);
      }
    };
  }, []);

  // Create button click handler with animation (optimized)
  const openModalWithAnimation = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    
    // Clear any existing timeouts
    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current);
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Add button highlight effect
    button.classList.add('pem-button-emerging');
    buttonTimeoutRef.current = setTimeout(() => {
      button.classList.remove('pem-button-emerging');
    }, 800);

    // Set animating state
    setIsAnimating(true);
    
    // Open modal
    setIsModalOpen(true);

    // Apply emerge animation after modal is rendered (optimized timing)
    requestAnimationFrame(() => {
      const modal = document.querySelector(modalSelector) as HTMLElement;
      if (modal) {
        applyButtonEmergeAnimation(modal, button);
        
        // Reset animating state after animation completes
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, animationDuration);
      }
    });
  }, [modalSelector, animationDuration]);

  // Close modal (optimized)
  const closeModal = useCallback(() => {
    // Clear timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current);
    }
    
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
