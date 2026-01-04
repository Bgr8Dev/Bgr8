/**
 * Honeypot Field Utility
 * 
 * Provides honeypot fields for anti-bot protection
 * These are hidden fields that bots will fill but humans won't see
 */

/**
 * Generate a random field name for honeypot
 * This makes it harder for bots to detect the honeypot field
 */
export function generateHoneypotFieldName(): string {
  // Generate a realistic-sounding field name
  const prefixes = ['website', 'url', 'homepage', 'site'];
  const suffixes = ['url', 'link', 'address'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomPrefix}_${randomSuffix}_${randomNum}`;
}

/**
 * Check if honeypot field was filled (indicates bot)
 */
export function isHoneypotFilled(formData: Record<string, unknown>, honeypotFieldName: string): boolean {
  const value = formData[honeypotFieldName];
  // If field has any value, it was filled by a bot
  return value !== undefined && value !== null && value !== '';
}

/**
 * Create honeypot field props for React
 */
export interface HoneypotFieldProps {
  name: string;
  style: React.CSSProperties;
  tabIndex: number;
  autoComplete: string;
  'aria-hidden': boolean;
}

/**
 * Generate honeypot field configuration
 */
export function generateHoneypotField(): {
  name: string;
  props: HoneypotFieldProps;
} {
  const fieldName = generateHoneypotFieldName();
  
  return {
    name: fieldName,
    props: {
      name: fieldName,
      style: {
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      },
      tabIndex: -1,
      autoComplete: 'off',
      'aria-hidden': true
    }
  };
}

/**
 * Validate form submission (check for honeypot)
 */
export interface HoneypotValidationResult {
  isValid: boolean;
  isBot: boolean;
  honeypotFieldName?: string;
}

export function validateHoneypot(
  formData: Record<string, unknown>,
  honeypotFieldName: string
): HoneypotValidationResult {
  const isFilled = isHoneypotFilled(formData, honeypotFieldName);
  
  return {
    isValid: !isFilled,
    isBot: isFilled,
    honeypotFieldName: isFilled ? honeypotFieldName : undefined
  };
}

