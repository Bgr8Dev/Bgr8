/**
 * Screen Resolution Detection Utility
 * Provides functions to detect and format screen resolution information
 */

export interface ScreenResolutionInfo {
  width: number;
  height: number;
  formatted: string;
  displayName: string;
  isDetected: boolean;
}

/**
 * Detects the screen resolution using window.screen properties
 * @returns ScreenResolutionInfo object with resolution details
 */
export const detectScreenResolution = (): ScreenResolutionInfo => {
  try {
    // Get screen resolution
    const width = window.screen.width;
    const height = window.screen.height;
    
    // Get available screen area (excluding taskbars, etc.)
    // Note: availWidth and availHeight are available but not currently used
    // They could be used for future features like detecting available workspace
    
    // Format resolution string
    const formatted = `${width}x${height}`;
    
    // Create display name with common resolution names
    const displayName = getResolutionDisplayName(width, height);
    
    return {
      width,
      height,
      formatted,
      displayName: `${formatted} (${displayName})`,
      isDetected: true
    };
  } catch (error) {
    console.warn('Failed to detect screen resolution:', error);
    return {
      width: 0,
      height: 0,
      formatted: 'Unknown',
      displayName: 'Unknown',
      isDetected: false
    };
  }
};

/**
 * Detects the browser viewport resolution
 * @returns ScreenResolutionInfo object with viewport details
 */
export const detectViewportResolution = (): ScreenResolutionInfo => {
  try {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const formatted = `${width}x${height}`;
    const displayName = getResolutionDisplayName(width, height);
    
    return {
      width,
      height,
      formatted,
      displayName: `${formatted} (${displayName}) - Viewport`,
      isDetected: true
    };
  } catch (error) {
    console.warn('Failed to detect viewport resolution:', error);
    return {
      width: 0,
      height: 0,
      formatted: 'Unknown',
      displayName: 'Unknown',
      isDetected: false
    };
  }
};

/**
 * Gets a user-friendly display name for common resolutions
 * @param width - Screen width in pixels
 * @param height - Screen height in pixels
 * @returns Display name for the resolution
 */
const getResolutionDisplayName = (width: number, height: number): string => {
  const resolution = `${width}x${height}`;
  
  const commonResolutions: Record<string, string> = {
    '3840x2160': '4K/UHD',
    '2560x1440': '2K/QHD',
    '1920x1080': 'Full HD',
    '1680x1050': 'WSXGA+',
    '1600x900': 'HD+',
    '1440x900': 'WXGA+',
    '1366x768': 'HD',
    '1280x720': 'HD',
    '1024x768': 'XGA',
    '800x600': 'SVGA'
  };
  
  return commonResolutions[resolution] || 'Custom';
};

/**
 * Gets both screen and viewport resolution information
 * @returns Object containing both screen and viewport resolution info
 */
export const getFullResolutionInfo = () => {
  return {
    screen: detectScreenResolution(),
    viewport: detectViewportResolution()
  };
};

/**
 * Formats resolution info for display in dropdowns or forms
 * @param resolutionInfo - The resolution info object
 * @returns Formatted string for display
 */
export const formatResolutionForDisplay = (resolutionInfo: ScreenResolutionInfo): string => {
  if (!resolutionInfo.isDetected) {
    return 'Failed to detect';
  }
  
  return resolutionInfo.formatted;
};

/**
 * Checks if a detected resolution matches common resolution options
 * @param resolutionInfo - The resolution info object
 * @returns The matching dropdown option value or 'Other'
 */
export const getMatchingResolutionOption = (resolutionInfo: ScreenResolutionInfo): string => {
  if (!resolutionInfo.isDetected) {
    return 'Other';
  }
  
  // Check if it matches a common resolution
  const commonResolutions = [
    '1920x1080', '2560x1440', '3840x2160', '1366x768', 
    '1440x900', '1600x900', '1680x1050', '1280x720', 
    '1024x768', '800x600'
  ];
  
  return commonResolutions.includes(resolutionInfo.formatted) 
    ? resolutionInfo.formatted 
    : 'Other';
};
