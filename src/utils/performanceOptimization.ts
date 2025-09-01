/**
 * Performance Optimization Utilities
 * Helps reduce memory usage and improve animation performance
 */

/**
 * Debounce function to limit function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Clean up animation classes to prevent memory leaks
 */
export const cleanupAnimationClasses = (element: HTMLElement): void => {
  const animationClasses = [
    'emerging-from-button',
    'pem-button-emerging',
    'button-emerging',
    'emerging',
    'ready'
  ];
  
  animationClasses.forEach(className => {
    element.classList.remove(className);
  });
  
  // Reset transform properties
  element.style.transform = '';
  element.style.transformOrigin = '';
  element.style.willChange = '';
  element.style.backfaceVisibility = '';
};

/**
 * Optimize element for animations
 */
export const optimizeForAnimation = (element: HTMLElement): void => {
  // Force hardware acceleration
  element.style.transform = 'translateZ(0)';
  element.style.willChange = 'transform, opacity, border-radius';
  element.style.backfaceVisibility = 'hidden';
  
  // Add vendor prefixes for better browser support
  element.style.webkitTransform = 'translateZ(0)';
  element.style.webkitBackfaceVisibility = 'hidden';
};

/**
 * Batch DOM operations for better performance
 */
export const batchDOMOperations = (operations: (() => void)[]): void => {
  requestAnimationFrame(() => {
    operations.forEach(operation => operation());
  });
};

/**
 * Memory-efficient element query with caching
 */
class ElementCache {
  private cache = new Map<string, HTMLElement | null>();
  
  query(selector: string): HTMLElement | null {
    if (this.cache.has(selector)) {
      return this.cache.get(selector) || null;
    }
    
    const element = document.querySelector(selector) as HTMLElement | null;
    this.cache.set(selector, element);
    
    // Clear cache after a short delay to allow for DOM changes
    setTimeout(() => {
      this.cache.delete(selector);
    }, 100);
    
    return element;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const elementCache = new ElementCache();

/**
 * Performance monitoring for animations
 */
export const monitorAnimationPerformance = (animationName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16.67) { // More than one frame (60fps)
        console.warn(`⚠️ Animation "${animationName}" took ${duration.toFixed(2)}ms (target: <16.67ms)`);
      } else {
        console.log(`✅ Animation "${animationName}" completed in ${duration.toFixed(2)}ms`);
      }
    }
  };
};
