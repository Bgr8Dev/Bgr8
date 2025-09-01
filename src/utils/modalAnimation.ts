/**
 * Modal Animation Utilities
 * Provides functions to create button-to-modal animations
 */

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
 * Apply button-emerge animation to a modal
 */
export const applyButtonEmergeAnimation = (
  modal: HTMLElement,
  button: HTMLElement
): void => {
  console.log('🎯 Applying button-emerge animation');
  console.log('Modal:', modal);
  console.log('Button:', button);
  
  const buttonPos = getButtonPosition(button);
  const modalRect = modal.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  console.log('Button position:', buttonPos);
  console.log('Modal rect:', modalRect);
  console.log('Viewport:', { width: viewportWidth, height: viewportHeight });
  
  const transformOrigin = calculateModalTransformOrigin(
    buttonPos,
    modalRect.width,
    modalRect.height,
    viewportWidth,
    viewportHeight
  );
  
  console.log('Transform origin:', transformOrigin);
  
  // Set the transform origin
  modal.style.transformOrigin = `${transformOrigin.x}% ${transformOrigin.y}%`;
  
  // Add the emerging-from-button class
  modal.classList.add('emerging-from-button');
  console.log('Added emerging-from-button class');
  
  // Handle loading states for button-emerge animation
  const loadingElements = modal.querySelectorAll('.pem-modal-loading, .modal-loading');
  console.log('Found loading elements:', loadingElements.length);
  loadingElements.forEach(element => {
    element.classList.add('emerging');
  });
  
  // Remove the class and show content after animation completes
  setTimeout(() => {
    console.log('🎯 Button-emerge animation completed, showing content');
    modal.classList.remove('emerging-from-button');
    
    // Show loading content after button-emerge animation completes
    loadingElements.forEach(element => {
      element.classList.remove('emerging');
      element.classList.add('ready');
    });
  }, 1000); // Match animation duration
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
