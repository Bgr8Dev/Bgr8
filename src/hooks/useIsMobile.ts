import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check if screen width is mobile-sized
      const isMobileWidth = window.innerWidth <= 768;
      
      // Check if user agent indicates mobile
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check if device has touch capability (common on mobile)
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider mobile if any of these conditions are met
      setIsMobile(isMobileWidth || isMobileUserAgent || hasTouchScreen);
    };

    // Check initially
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
} 