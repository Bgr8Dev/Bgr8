/**
 * Firestore Utility Functions
 * Helper functions for converting and formatting Firestore data types
 */

// Type for Firestore Timestamp
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

/**
 * Convert a Firestore Timestamp to a JavaScript Date
 * @param timestamp - Firestore Timestamp object with seconds/nanoseconds, or a Date, or null
 * @param fallbackDate - Optional fallback date if conversion fails (default: null)
 * @returns JavaScript Date object or fallback
 */
export const convertTimestampToDate = (
  timestamp: unknown,
  fallbackDate: Date | null = null
): Date | null => {
  if (!timestamp) return fallbackDate;
  
  // Check if it's a Firestore Timestamp (has seconds property)
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
    const ts = timestamp as FirestoreTimestamp;
    return new Date(ts.seconds * 1000);
  }
  
  // Check if it has a toDate method (Firestore Timestamp)
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    const ts = timestamp as FirestoreTimestamp;
    if (ts.toDate && typeof ts.toDate === 'function') {
      return ts.toDate();
    }
  }
  
  // Try to convert as a regular date
  try {
    const date = new Date(timestamp as string | number | Date);
    return isNaN(date.getTime()) ? fallbackDate : date;
  } catch {
    return fallbackDate;
  }
};

/**
 * Format a Firestore Timestamp or Date to UK date format
 * @param timestamp - Firestore Timestamp, Date, or null
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string or 'N/A'
 */
export const formatFirestoreDate = (
  timestamp: unknown,
  options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }
): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return 'N/A';
  
  return date.toLocaleDateString('en-GB', options);
};

/**
 * Format a Firestore Timestamp or Date to UK datetime format (ISO-ish sortable)
 * @param timestamp - Firestore Timestamp, Date, or null
 * @returns Formatted datetime string (YYYY-MM-DD HH:MM:SS) or empty string
 */
export const formatFirestoreDateTime = (timestamp: unknown): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Convert multiple Firestore Timestamps in an object
 * @param data - Object containing potential Firestore Timestamps
 * @param timestampFields - Array of field names that should be converted
 * @param fallbackDate - Optional fallback date for failed conversions
 * @returns New object with converted Date fields
 */
export const convertTimestampFields = <T extends Record<string, unknown>>(
  data: T,
  timestampFields: (keyof T)[],
  fallbackDate: Date | null = null
): T => {
  const converted = { ...data };
  
  timestampFields.forEach(field => {
    if (field in converted) {
      converted[field] = convertTimestampToDate(converted[field], fallbackDate) as T[keyof T];
    }
  });
  
  return converted;
};

/**
 * Extract active roles from a Firestore roles object
 * @param roles - Object with role names as keys and boolean values
 * @returns Comma-separated string of active roles, sorted alphabetically
 */
export const formatRoles = (roles: Record<string, boolean> | null | undefined): string => {
  if (!roles || typeof roles !== 'object') return '';
  
  return Object.entries(roles)
    .filter(([, isActive]) => isActive === true)
    .map(([role]) => role)
    .sort()
    .join(', ');
};

/**
 * Safely get a nested property from Firestore data
 * @param data - Firestore document data
 * @param path - Dot-notation path (e.g., 'activityLog.lastLogin')
 * @param defaultValue - Default value if path doesn't exist
 * @returns The value at the path or default value
 */
export const getNestedProperty = (
  data: Record<string, unknown>,
  path: string,
  defaultValue: unknown = null
): unknown => {
  const keys = path.split('.');
  let current: Record<string, unknown> | unknown = data;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
};

/**
 * Format a date for datetime-local input
 * @param date - JavaScript Date object
 * @returns String in format YYYY-MM-DDTHH:mm
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Check if a date falls within a date range (inclusive)
 * @param date - Date to check
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns true if date is within range
 */
export const isDateInRange = (
  date: Date | null | undefined,
  startDate: Date,
  endDate: Date
): boolean => {
  if (!date) return false;
  return date >= startDate && date <= endDate;
};
