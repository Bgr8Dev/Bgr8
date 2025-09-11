import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Primary check: screen width (most reliable for responsive design)
      const isMobileWidth = window.innerWidth <= 768;
      
      // Check if user agent indicates mobile device (excluding tablets in desktop mode)
      const isMobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check if it's an iPad in desktop mode (should not be considered mobile)
      const isIPadDesktop = /iPad/i.test(navigator.userAgent) && window.innerWidth > 1024;
      
      // Consider mobile if screen width is small AND it's not an iPad in desktop mode
      // OR if it's a mobile user agent (excluding iPad in desktop mode)
      const shouldBeMobile = (isMobileWidth && !isIPadDesktop) || (isMobileUserAgent && !isIPadDesktop);
      
      setIsMobile(shouldBeMobile);
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