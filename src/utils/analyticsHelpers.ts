/**
 * Analytics Helper Functions
 * Reusable utility functions for analytics components
 */

// ============================================
// Date/Time Formatting
// ============================================

/**
 * Format date for UK date input (DD/MM/YYYY)
 */
export const formatDateForInput = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format time for 24-hour input (HH:MM)
 */
export const formatTimeForInput = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date for display (e.g., "25 Dec 2024")
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Format time for display (24-hour format, e.g., "14:30")
 */
export const formatTime = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Format a time range (e.g., "14:30 - 15:30")
 */
export const formatTimeRange = (startTime: Date | null | undefined, endTime: Date | null | undefined): string => {
  if (!startTime || !endTime) return 'Time TBD';
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Format time label based on granularity for chart display
 */
export const formatTimeLabel = (date: Date, granularityHours: number): string => {
  if (granularityHours < 24) {
    // Show hour format
    return date.toLocaleString('en-GB', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (granularityHours === 24) {
    // Show day format
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric'
    });
  } else {
    // Show week/month format
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric'
    });
  }
};

// ============================================
// Date/Time Parsing
// ============================================

const MIN_YEAR = 2023; // Minimum year to prevent system crashes

/**
 * Parse date from UK format input (DD/MM/YYYY)
 * Returns null if invalid or year < 2023
 */
export const parseDateFromInput = (dateStr: string): Date | null => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  // Enforce minimum year to prevent system crashes
  if (year < MIN_YEAR) return null;
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Parse time from 24-hour format input (HH:MM)
 * Returns null if invalid
 */
export const parseTimeFromInput = (timeStr: string): { hours: number; minutes: number } | null => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  return { hours, minutes };
};

// ============================================
// Time Bucket Generation
// ============================================

export interface TimeBucket {
  time: Date;
  label: string;
}

/**
 * Generate time buckets based on start, end, and granularity
 */
export const generateTimeBuckets = (
  start: Date, 
  end: Date, 
  granularityHours: number
): TimeBucket[] => {
  const buckets: TimeBucket[] = [];
  const current = new Date(start);
  const granularityMs = granularityHours * 60 * 60 * 1000;

  while (current <= end) {
    buckets.push({
      time: new Date(current),
      label: formatTimeLabel(new Date(current), granularityHours)
    });
    current.setTime(current.getTime() + granularityMs);
  }

  return buckets;
};

// ============================================
// Data Filtering
// ============================================

export interface DataPoint {
  time: string;
  count: number;
}

/**
 * Filter out consecutive zero periods, keeping only first and last zero in a sequence
 * This improves chart performance by reducing data points
 */
export const filterConsecutiveZeros = (data: DataPoint[]): DataPoint[] => {
  if (data.length <= 2) return data; // Keep all if too few points
  
  const filtered: DataPoint[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const isZero = current.count === 0;
    
    if (!isZero) {
      // Non-zero point: always include it
      filtered.push(current);
    } else {
      // Zero point: include if it's the first or last in the dataset,
      // or if it's the first or last in a sequence of zeros
      const isFirst = i === 0;
      const isLast = i === data.length - 1;
      const prevNonZero = i > 0 && data[i - 1].count !== 0;
      const nextNonZero = i < data.length - 1 && data[i + 1].count !== 0;
      
      if (isFirst || isLast || prevNonZero || nextNonZero) {
        filtered.push(current);
      }
    }
  }
  
  return filtered;
};

// ============================================
// Data Aggregation
// ============================================

/**
 * Aggregate timestamped data into time buckets
 */
export const aggregateDataByTime = (
  data: Array<{ timestamp: Date }>,
  start: Date,
  end: Date,
  granularityHours: number
): DataPoint[] => {
  const buckets = generateTimeBuckets(start, end, granularityHours);
  const granularityMs = granularityHours * 60 * 60 * 1000;

  const aggregated = buckets.map(bucket => {
    const bucketEnd = new Date(bucket.time.getTime() + granularityMs);
    const count = data.filter(item => {
      return item.timestamp >= bucket.time && item.timestamp < bucketEnd;
    }).length;

    return {
      time: bucket.label,
      count: count
    };
  });

  return filterConsecutiveZeros(aggregated);
};

// ============================================
// Granularity Conversion
// ============================================

export type TimeUnit = 'minutes' | 'hours' | 'days';

/**
 * Convert granularity value to hours based on unit
 */
export const convertGranularityToHours = (value: number, unit: TimeUnit): number => {
  switch (unit) {
    case 'minutes':
      return value / 60;
    case 'hours':
      return value;
    case 'days':
      return value * 24;
  }
};

/**
 * Calculate time range in days
 */
export const getTimeRangeInDays = (startDate: Date, endDate: Date): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
};

// ============================================
// Date Validation
// ============================================

/**
 * Validate date range
 * Returns error message if invalid, null if valid
 */
export const validateDateRange = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
): string | null => {
  if (!startDate || !endDate) {
    return 'Cannot apply changes: dates are undefined';
  }
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Please enter valid dates before refreshing';
  }
  
  if (startDate.getFullYear() < MIN_YEAR || endDate.getFullYear() < MIN_YEAR) {
    return `Please enter dates from ${MIN_YEAR} onwards`;
  }
  
  if (startDate >= endDate) {
    return 'Start date must be before end date';
  }
  
  return null;
};
