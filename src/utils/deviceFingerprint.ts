/**
 * Device Fingerprinting Utility
 * 
 * Generates a unique fingerprint for a device to track suspicious activity
 */

/**
 * Generate a device fingerprint using browser characteristics
 * This creates a relatively stable identifier for the device
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const components: string[] = [];

    // User Agent
    components.push(navigator.userAgent || '');

    // Language
    components.push(navigator.language || '');

    // Screen resolution
    components.push(`${screen.width}x${screen.height}`);

    // Color depth
    components.push(`${screen.colorDepth || 24}`);

    // Timezone offset
    components.push(`${new Date().getTimezoneOffset()}`);

    // Platform
    components.push(navigator.platform || '');

    // Hardware concurrency (CPU cores)
    components.push(`${navigator.hardwareConcurrency || 0}`);

    // Canvas fingerprint (browser rendering characteristics)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        components.push(canvas.toDataURL().substring(0, 100)); // First 100 chars
      }
    } catch (e) {
      // Canvas not available
    }

    // WebGL fingerprint (if available)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
        }
      }
    } catch (e) {
      // WebGL not available
    }

    // Combine all components
    const fingerprint = components.join('|');

    // Generate hash
    return hashString(fingerprint);
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to simple identifier
    return `fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Hash a string to create a consistent fingerprint
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get device information for logging/tracking
 */
export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  hardwareConcurrency: number;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      fingerprint: 'server',
      userAgent: 'server',
      platform: 'server',
      language: 'en',
      screenResolution: '0x0',
      timezone: '0',
      hardwareConcurrency: 0
    };
  }

  return {
    fingerprint: generateDeviceFingerprint(),
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    language: navigator.language || 'en',
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: `${new Date().getTimezoneOffset()}`,
    hardwareConcurrency: navigator.hardwareConcurrency || 0
  };
}

/**
 * Store device fingerprint in localStorage for persistence
 */
export function storeDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const stored = localStorage.getItem('deviceFingerprint');
    if (stored) {
      return stored;
    }

    const fingerprint = generateDeviceFingerprint();
    localStorage.setItem('deviceFingerprint', fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Error storing device fingerprint:', error);
    return generateDeviceFingerprint();
  }
}

/**
 * Get stored device fingerprint or generate new one
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const stored = localStorage.getItem('deviceFingerprint');
    if (stored) {
      return stored;
    }
    return storeDeviceFingerprint();
  } catch (error) {
    console.error('Error getting device fingerprint:', error);
    return generateDeviceFingerprint();
  }
}

