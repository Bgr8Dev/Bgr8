/**
 * Modal Animation Utilities (Performance Optimized)
 * Provides functions to create button-to-modal animations with minimal memory usage
 */

import { batchDOMOperations, optimizeForAnimation } from './performanceOptimization';

export interface ButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get the position and dimensions of a button element
 */
export const getButtonPosition = (button: HTMLElement): ButtonPosition => {
  const rect = button.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height
  };
};

/**
 * Calculate the transform origin for modal animation based on button position
 */
export const calculateModalTransformOrigin = (
  buttonPos: ButtonPosition,
  modalWidth: number,
  modalHeight: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } => {
  // Calculate the relative position of the button center within the modal
  const modalCenterX = viewportWidth / 2;
  const modalCenterY = viewportHeight / 2;
  
  // Calculate offset from modal center to button center
  const offsetX = buttonPos.x - modalCenterX;
  const offsetY = buttonPos.y - modalCenterY;
  
  // Convert to percentage for transform-origin
  const originX = 50 + (offsetX / modalWidth) * 100;
  const originY = 50 + (offsetY / modalHeight) * 100;
  
  // Clamp values to reasonable bounds
  const clampedX = Math.max(10, Math.min(90, originX));
  const clampedY = Math.max(10, Math.min(90, originY));
  
  return { x: clampedX, y: clampedY };
};

/**
 * Apply button-emerge animation to a modal (Performance Optimized)
 */
export const applyButtonEmergeAnimation = (
  modal: HTMLElement,
  button: HTMLElement
): void => {
  // Optimize modal for animation
  optimizeForAnimation(modal);
  
  // Batch all DOM operations for better performance
  batchDOMOperations([
    () => {
      // Cache DOM queries to avoid repeated lookups
      const buttonRect = button.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      
      // Calculate transform origin efficiently
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      const modalCenterX = window.innerWidth / 2;
      const modalCenterY = window.innerHeight / 2;
      
      const offsetX = buttonCenterX - modalCenterX;
      const offsetY = buttonCenterY - modalCenterY;
      
      // Convert to percentage with bounds checking
      const originX = Math.max(10, Math.min(90, 50 + (offsetX / modalRect.width) * 100));
      const originY = Math.max(10, Math.min(90, 50 + (offsetY / modalRect.height) * 100));
      
      // Set transform origin and animation class
      modal.style.transformOrigin = `${originX}% ${originY}%`;
      modal.classList.add('emerging-from-button');
      
      // Cache loading elements to avoid repeated queries
      const loadingElements = modal.querySelectorAll('.pem-modal-loading, .modal-loading');
      
      // Batch loading element operations
      if (loadingElements.length > 0) {
        loadingElements.forEach(element => {
          element.classList.add('emerging');
        });
        
        // Use a single timeout for all operations
        setTimeout(() => {
          batchDOMOperations([
            () => modal.classList.remove('emerging-from-button'),
            () => {
              loadingElements.forEach(element => {
                element.classList.remove('emerging');
                element.classList.add('ready');
              });
            }
          ]);
        }, 1000);
      } else {
        // Fallback if no loading elements
        setTimeout(() => {
          modal.classList.remove('emerging-from-button');
        }, 1000);
      }
    }
  ]);
};

/**
 * Create a button click handler that applies the emerge animation
 */
export const createButtonEmergeHandler = (
  modalSelector: string,
  onOpen: () => void
) => {
  return (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    
    // Open the modal first
    onOpen();
    
    // Apply animation after a brief delay to ensure modal is rendered
    setTimeout(() => {
      const modal = document.querySelector(modalSelector) as HTMLElement;
      if (modal) {
        applyButtonEmergeAnimation(modal, button);
      }
    }, 10);
  };
};

/**
 * Enhanced modal opening with button-emerge animation
 */
export const openModalWithButtonEmerge = (
  modalElement: HTMLElement,
  triggerButton: HTMLElement,
  onOpen?: () => void
): void => {
  // Execute any provided open callback
  if (onOpen) {
    onOpen();
  }
  
  // Apply the animation after modal is rendered
  requestAnimationFrame(() => {
    applyButtonEmergeAnimation(modalElement, triggerButton);
  });
};

/**
 * Initialize modal for button-emerge animation
 * Call this when the modal is first rendered to set up loading states
 */
export const initializeModalForButtonEmerge = (modalElement: HTMLElement): void => {
  // Set initial loading state for all content
  const loadingElements = modalElement.querySelectorAll('.pem-modal-loading, .modal-loading');
  loadingElements.forEach(element => {
    element.classList.add('emerging');
  });
  
  // Also hide content that should be animated
  const contentElements = modalElement.querySelectorAll('.pem-modal-left-sidebar, .pem-modal-right-content, .modal-header, .modal-body');
  contentElements.forEach(element => {
    element.classList.add('pem-modal-loading', 'emerging');
  });
};
