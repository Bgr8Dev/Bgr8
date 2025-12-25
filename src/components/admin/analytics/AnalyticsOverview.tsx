import React, { useState, useEffect, useCallback } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaUsers, FaCalendarCheck, FaEye, FaUserClock, FaSync, FaSearch, FaTimes, FaChevronDown, FaChevronUp, FaCopy } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { convertTimestampToDate, formatFirestoreDate, convertTimestampFields, formatRoles, getNestedProperty, isDateInRange } from '../../../utils/firestoreUtils';
import {
  formatDateForInput,
  formatTimeForInput,
  formatDate,
  formatTime,
  formatTimeRange,
  parseDateFromInput,
  parseTimeFromInput,
  generateTimeBuckets,
  filterConsecutiveZeros,
  aggregateDataByTime,
  convertGranularityToHours,
  getTimeRangeInDays,
  validateDateRange,
  type TimeUnit
} from '../../../utils/analyticsHelpers';
import '../../../styles/adminStyles/AnalyticsOverview.css';

interface AnalyticsOverviewProps {
  queryHistory: QueryResult[];
}

interface UserData {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  lastUpdated?: Date | null;
  dateCreated?: Date | null;
  roles?: Record<string, boolean>;
}

interface BookingData {
  bookingId: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  startTime: Date;
  endTime: Date;
}

const TIME_PRESETS = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ queryHistory }) => {
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(now.getDate() - 7);
  
  // Applied dates (trigger data fetch)
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(now);
  
  // Pending dates (user input, not yet applied)
  const [pendingStartDate, setPendingStartDate] = useState<Date>(defaultStart);
  const [pendingEndDate, setPendingEndDate] = useState<Date>(now);
  
  // Input strings for free-form typing
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [startTimeInput, setStartTimeInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [endTimeInput, setEndTimeInput] = useState<string>('');
  
  const [sliderValue, setSliderValue] = useState<number>(7);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    totalUsers: false,
    activeUsers: false,
    bookings: false,
    profileViews: false
  });

  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [totalProfileViews, setTotalProfileViews] = useState<number>(0);

  // Query strings for each analytics block
  const [totalUsersQuery, setTotalUsersQuery] = useState<string>('');
  const [activeUsersQuery, setActiveUsersQuery] = useState<string>('');
  const [bookingsQuery, setBookingsQuery] = useState<string>('');
  const [profileViewsQuery, setProfileViewsQuery] = useState<string>('');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [activeUserSearch, setActiveUserSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  
  const [selectedProfile, setSelectedProfile] = useState<UserData | null>(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [loadingProfileViews, setLoadingProfileViews] = useState(false);

  // Granularity settings for each chart
  const [granularity, setGranularity] = useState<Record<string, number>>({
    totalUsers: 24, // hours
    activeUsers: 24,
    bookings: 24,
    profileViews: 24
  });

  // Custom granularity input state (for user input in days/hours/minutes)
  const [customGranularityInput, setCustomGranularityInput] = useState<Record<string, { value: string; unit: TimeUnit }>>({
    totalUsers: { value: '1', unit: 'days' },
    activeUsers: { value: '1', unit: 'days' },
    bookings: { value: '1', unit: 'days' },
    profileViews: { value: '1', unit: 'days' }
  });

  // Calculate the time range in days
  const timeRangeInDays = getTimeRangeInDays(startDate, endDate);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const setGranularityForSection = (section: string, hours: number) => {
    setGranularity(prev => ({ ...prev, [section]: hours }));
  };

  // Set custom granularity from user input
  const setCustomGranularity = (section: string, value: string, unit: TimeUnit) => {
    const numValue = parseFloat(value);
    // Enforce minimum value of 1 for any unit
    if (isNaN(numValue) || numValue < 1) return;

    // Convert to hours
    const hours = convertGranularityToHours(numValue, unit);

    setCustomGranularityInput(prev => ({ ...prev, [section]: { value, unit } }));
    setGranularity(prev => ({ ...prev, [section]: hours }));
  };

  // Generate time buckets based on granularity is now imported from utils

  // Aggregate data into time buckets
  // Helper function to filter out consecutive zero periods is now imported from utils

  const aggregateDataByTimeCallback = useCallback((
    data: Array<{ timestamp: Date }>,
    granularityHours: number
  ) => {
    return aggregateDataByTime(data, startDate, endDate, granularityHours);
  }, [startDate, endDate]);

  // Prepare chart data for total users (cumulative)
  const getTotalUsersChartData = useCallback(() => {
    const buckets = generateTimeBuckets(startDate, endDate, granularity.totalUsers);
    const granularityMs = granularity.totalUsers * 60 * 60 * 1000;

    const data = buckets.map(bucket => {
      const bucketEnd = new Date(bucket.time.getTime() + granularityMs);
      const count = allUsers.filter(user => {
        return user.dateCreated && user.dateCreated <= bucketEnd;
      }).length;

      return {
        time: bucket.label,
        count: count
      };
    });

    return filterConsecutiveZeros(data);
  }, [allUsers, startDate, endDate, granularity.totalUsers, generateTimeBuckets, filterConsecutiveZeros]);

  // Prepare chart data for active users
  const getActiveUsersChartData = useCallback(() => {
    const dataWithTimestamp = activeUsers.map(user => ({
      timestamp: user.lastUpdated || new Date()
    }));
    return aggregateDataByTimeCallback(dataWithTimestamp, granularity.activeUsers);
  }, [activeUsers, granularity.activeUsers, aggregateDataByTimeCallback]);

  // Prepare chart data for bookings
  const getBookingsChartData = useCallback(() => {
    const dataWithTimestamp = bookings.map(booking => ({
      timestamp: booking.startTime
    }));
    return aggregateDataByTimeCallback(dataWithTimestamp, granularity.bookings);
  }, [bookings, granularity.bookings, aggregateDataByTimeCallback]);

  const filteredAllUsers = allUsers.filter(user => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return user.firstName?.toLowerCase().includes(search) || user.lastName?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search);
  }).sort((a, b) => {
    // Sort by dateCreated descending (most recent first)
    const dateA = a.dateCreated ? a.dateCreated.getTime() : 0;
    const dateB = b.dateCreated ? b.dateCreated.getTime() : 0;
    return dateB - dateA;
  });

  const filteredActiveUsers = activeUsers.filter(user => {
    if (!activeUserSearch) return true;
    const search = activeUserSearch.toLowerCase();
    return user.firstName?.toLowerCase().includes(search) || user.lastName?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search);
  }).sort((a, b) => {
    // Sort by lastUpdated descending (most recent first)
    const dateA = a.lastUpdated ? a.lastUpdated.getTime() : 0;
    const dateB = b.lastUpdated ? b.lastUpdated.getTime() : 0;
    return dateB - dateA;
  });

  const filteredBookings = bookings.filter(booking => {
    if (!bookingSearch) return true;
    const search = bookingSearch.toLowerCase();
    
    // Safely check each field
    const mentorNameMatch = booking.mentorName?.toLowerCase().includes(search) || false;
    const menteeNameMatch = booking.menteeName?.toLowerCase().includes(search) || false;
    const statusMatch = booking.status?.toLowerCase().includes(search) || false;
    
    const matches = mentorNameMatch || menteeNameMatch || statusMatch;
    
    // Debug logging (remove after testing)
    if (bookingSearch && !matches) {
      console.log('Booking filtered out:', {
        search,
        mentorName: booking.mentorName,
        menteeName: booking.menteeName,
        status: booking.status,
        mentorNameMatch,
        menteeNameMatch,
        statusMatch
      });
    }
    
    return matches;
  });

  const filteredProfileUsers = allUsers.filter(user => {
    if (!profileSearch) return true;
    const search = profileSearch.toLowerCase();
    return user.firstName?.toLowerCase().includes(search) || user.lastName?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search);
  }).slice(0, 10);

  const fetchProfileViewsForUser = useCallback(async (userId: string) => {
    setLoadingProfileViews(true);
    try {
      const viewsQuery = query(collection(firestore, 'profileViews'), where('profileId', '==', userId), where('timestamp', '>=', Timestamp.fromDate(startDate)));
      const viewsSnapshot = await getDocs(viewsQuery);
      setProfileViews(viewsSnapshot.size);
    } catch {
      setProfileViews(0);
    } finally {
      setLoadingProfileViews(false);
    }
  }, [startDate]);

  useEffect(() => {
    if (selectedProfile) fetchProfileViewsForUser(selectedProfile.uid);
  }, [selectedProfile, fetchProfileViewsForUser]);

  // Initialize input strings on mount
  useEffect(() => {
    setStartDateInput(formatDateForInput(pendingStartDate));
    setStartTimeInput(formatTimeForInput(pendingStartDate));
    setEndDateInput(formatDateForInput(pendingEndDate));
    setEndTimeInput(formatTimeForInput(pendingEndDate));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Date/time formatting and parsing functions are now imported from analyticsHelpers

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const newStart = new Date();
    newStart.setDate(now.getDate() - value);
    setPendingStartDate(newStart);
    setPendingEndDate(new Date());
    // Update input strings
    setStartDateInput(formatDateForInput(newStart));
    setStartTimeInput(formatTimeForInput(newStart));
    setEndDateInput(formatDateForInput(new Date()));
    setEndTimeInput(formatTimeForInput(new Date()));
  };

  const handlePresetClick = (days: number) => {
    handleSliderChange(days);
    // Only update pending dates, don't apply immediately
    // User must click refresh to apply
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setStartDateInput(dateValue);
    
    // Try to parse and update pending date
    const parsedDate = parseDateFromInput(dateValue);
    if (parsedDate) {
      parsedDate.setHours(pendingStartDate.getHours());
      parsedDate.setMinutes(pendingStartDate.getMinutes());
      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);
      
      if (!isNaN(parsedDate.getTime())) {
        setPendingStartDate(parsedDate);
      }
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setStartTimeInput(timeValue);
    
    // Try to parse and update pending time
    const parsedTime = parseTimeFromInput(timeValue);
    if (parsedTime) {
      const newDate = new Date(pendingStartDate);
      newDate.setHours(parsedTime.hours);
      newDate.setMinutes(parsedTime.minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      
      if (!isNaN(newDate.getTime())) {
        setPendingStartDate(newDate);
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setEndDateInput(dateValue);
    
    // Try to parse and update pending date
    const parsedDate = parseDateFromInput(dateValue);
    if (parsedDate) {
      parsedDate.setHours(pendingEndDate.getHours());
      parsedDate.setMinutes(pendingEndDate.getMinutes());
      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);
      
      if (!isNaN(parsedDate.getTime())) {
        setPendingEndDate(parsedDate);
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setEndTimeInput(timeValue);
    
    // Try to parse and update pending time
    const parsedTime = parseTimeFromInput(timeValue);
    if (parsedTime) {
      const newDate = new Date(pendingEndDate);
      newDate.setHours(parsedTime.hours);
      newDate.setMinutes(parsedTime.minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      
      if (!isNaN(newDate.getTime())) {
        setPendingEndDate(newDate);
      }
    }
  };

  // Apply pending dates and trigger refresh
  const applyDateChanges = () => {
    // Try to parse the current input strings
    const startDateParsed = parseDateFromInput(startDateInput);
    const startTimeParsed = parseTimeFromInput(startTimeInput);
    const endDateParsed = parseDateFromInput(endDateInput);
    const endTimeParsed = parseTimeFromInput(endTimeInput);
    
    // Build complete start date
    let finalStartDate = new Date(pendingStartDate);
    if (startDateParsed) {
      finalStartDate = new Date(startDateParsed);
      if (startTimeParsed) {
        finalStartDate.setHours(startTimeParsed.hours);
        finalStartDate.setMinutes(startTimeParsed.minutes);
      } else {
        finalStartDate.setHours(pendingStartDate.getHours());
        finalStartDate.setMinutes(pendingStartDate.getMinutes());
      }
    }
    
    // Build complete end date
    let finalEndDate = new Date(pendingEndDate);
    if (endDateParsed) {
      finalEndDate = new Date(endDateParsed);
      if (endTimeParsed) {
        finalEndDate.setHours(endTimeParsed.hours);
        finalEndDate.setMinutes(endTimeParsed.minutes);
      } else {
        finalEndDate.setHours(pendingEndDate.getHours());
        finalEndDate.setMinutes(pendingEndDate.getMinutes());
      }
    }
    
    // Validate date range using helper function
    const validationError = validateDateRange(finalStartDate, finalEndDate);
    if (validationError) {
      console.error(`Cannot apply changes: ${validationError}`);
      alert(validationError);
      // Reset input strings to last valid dates
      setStartDateInput(formatDateForInput(pendingStartDate));
      setStartTimeInput(formatTimeForInput(pendingStartDate));
      setEndDateInput(formatDateForInput(pendingEndDate));
      setEndTimeInput(formatTimeForInput(pendingEndDate));
      return;
    }
    
    // Update pending dates
    setPendingStartDate(finalStartDate);
    setPendingEndDate(finalEndDate);
    
    // Apply to actual date filters
    setStartDate(finalStartDate);
    setEndDate(finalEndDate);
    
    // Sync input strings to the validated dates
    setStartDateInput(formatDateForInput(finalStartDate));
    setStartTimeInput(formatTimeForInput(finalStartDate));
    setEndDateInput(formatDateForInput(finalEndDate));
    setEndTimeInput(formatTimeForInput(finalEndDate));
    
    // Update slider to reflect the applied date range
    const daysDiff = Math.round((finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (!isNaN(daysDiff) && daysDiff > 0) {
      setSliderValue(Math.min(365, Math.max(1, daysDiff)));
    }
  };

  // Helper function to generate query strings for Firebase Console Query Terminal
  const generateQueryString = (blockType: string, startDate: Date, endDate: Date): string => {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    // Format dates in UK format for query comments
    const startUK = formatFirestoreDate(startDate, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const endUK = formatFirestoreDate(endDate, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    switch (blockType) {
      case 'totalUsers':
        return `// Total Users
const snapshot = await getDocs(
  collection(db, 'users')
);
const results = [];
snapshot.forEach(doc => {
  const data = doc.data();
  
  results.push({
    uid: data.uid || doc.id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    displayName: data.displayName || '',
    dateCreated: data.dateCreated,
    lastUpdated: data.lastUpdated,
    roles: data.roles
  });
});
return results;`;

      case 'activeUsers':
        return `// Active Users (${startUK} - ${endUK})
const snapshot = await getDocs(
  query(
    collection(db, 'users'),
    where('activityLog.lastLogin', '>=', Timestamp.fromDate(new Date('${startISO}'))),
    where('activityLog.lastLogin', '<=', Timestamp.fromDate(new Date('${endISO}')))
  )
);
const results = [];
snapshot.forEach(doc => {
  const data = doc.data();
  const lastLogin = data.activityLog?.lastLogin;
  results.push({
    uid: data.uid || doc.id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    displayName: data.displayName || '',
    lastLogin: lastLogin,
    loginCount: data.activityLog?.loginCount || 0
  });
});
return results;`;

      case 'bookings':
        return `// Bookings/Sessions (${startUK} - ${endUK})
const snapshot = await getDocs(
  query(
    collection(db, 'sessions'),
    where('startTime', '>=', '${startISO}'),
    where('startTime', '<=', '${endISO}')
  )
);
const results = [];
snapshot.forEach(doc => {
  const data = doc.data();
  results.push({
    bookingId: data.bookingId || doc.id,
    mentorId: data.mentorId || '',
    menteeId: data.menteeId || '',
    status: data.status || 'pending',
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  });
});
return results;`;

      case 'profileViews':
        return `// Profile Views (${startUK} - ${endUK})
const snapshot = await getDocs(
  query(
    collection(db, 'profileViews'),
    where('timestamp', '>=', Timestamp.fromDate(new Date('${startISO}'))),
    where('timestamp', '<=', Timestamp.fromDate(new Date('${endISO}')))
  )
);
const results = [];
snapshot.forEach(doc => {
  const data = doc.data();
  results.push({
    id: doc.id,
    profileId: data.profileId || '',
    viewerId: data.viewerId || '',
    timestamp: data.timestamp || null
  });
});
return results;`;

      default:
        return '// Unknown query type';
    }
  };

  const copyQueryToClipboard = (query: string) => {
    navigator.clipboard.writeText(query).then(() => {
      console.log('Query copied to clipboard');
      setCopiedQuery(query);
      setTimeout(() => setCopiedQuery(null), 2000);
    }).catch(err => {
      console.error('Failed to copy query:', err);
    });
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[AnalyticsOverview] Fetching analytics...');
      
      // Generate and store query strings
      setTotalUsersQuery(generateQueryString('totalUsers', startDate, endDate));
      setActiveUsersQuery(generateQueryString('activeUsers', startDate, endDate));
      setBookingsQuery(generateQueryString('bookings', startDate, endDate));
      setProfileViewsQuery(generateQueryString('profileViews', startDate, endDate));

      // Fetch total users
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData: UserData[] = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        // Use activityLog.lastLogin if present, else fallback
        let lastLogin: Date | null = null;
        if (data.activityLog && data.activityLog.lastLogin && typeof data.activityLog.lastLogin.seconds === 'number') {
          lastLogin = new Date(data.activityLog.lastLogin.seconds * 1000);
        } else if (data.lastUpdated?.toDate) {
          lastLogin = data.lastUpdated.toDate();
        } else {
          lastLogin = null;
        }
        usersData.push({
          uid: data.uid,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          displayName: data.displayName || '',
          lastUpdated: lastLogin,
          dateCreated: data.dateCreated?.toDate?.() || null,
          roles: data.roles || {}
        });
      });
      setAllUsers(usersData);
      console.log('[AnalyticsOverview] Users fetched:', usersData.length);

      // Filter active users based on date range
      const activeUsersData: UserData[] = usersData.filter(user => user.lastUpdated && user.lastUpdated >= startDate && user.lastUpdated <= endDate);
      setActiveUsers(activeUsersData);
      console.log('[AnalyticsOverview] Active users:', activeUsersData.length);

      // Fetch bookings (sessions)
      const bookingsData: BookingData[] = [];
      try {
        const sessionsSnapshot = await getDocs(collection(firestore, 'sessions'));
        console.log('[AnalyticsOverview] Sessions fetched:', sessionsSnapshot.size);
        
        // Build a lookup map for user names
        const userMap = new Map();
        usersData.forEach(user => {
          userMap.set(user.uid, `${user.firstName} ${user.lastName}`);
        });
        
        const OLD_DATE = new Date('2000-01-01T00:00:00Z');
        sessionsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('[AnalyticsOverview] DOC DATA:', data);
          
          // Convert Firestore Timestamps using utility
          const startTime = convertTimestampToDate(data.startTime, OLD_DATE)!;
          
          if (isDateInRange(startTime, startDate, endDate)) {
            const mentorName = userMap.get(data.mentorId) || 'Unknown';
            const menteeName = userMap.get(data.menteeId) || 'Unknown';
            
            // Convert all timestamp fields at once
            const convertedData = convertTimestampFields(
              data,
              ['endTime', 'createdAt', 'updatedAt'],
              OLD_DATE
            );
            
            bookingsData.push({
              bookingId: data.bookingId || doc.id,
              mentorId: data.mentorId || '',
              mentorName,
              menteeId: data.menteeId || '',
              menteeName,
              status: data.status || 'pending',
              createdAt: convertedData.createdAt,
              updatedAt: convertedData.updatedAt,
              startTime,
              endTime: convertedData.endTime,
            });
          }
        });
        console.log('[AnalyticsOverview] Bookings in range:', bookingsData.length, bookingsData);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
      setBookings(bookingsData);

      // Fetch profile views
      let views = 0;
      try {
        const viewsSnapshot = await getDocs(collection(firestore, 'profileViews'));
        viewsSnapshot.forEach(doc => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate?.();
          if (timestamp && timestamp >= startDate && timestamp <= endDate) views++;
        });
      } catch { views = 0; }
      setTotalProfileViews(views);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Automatically adjust granularity when time range changes
  useEffect(() => {
    // If time range is more than 1 day, enforce minimum granularity of 1 day
    if (timeRangeInDays > 1) {
      // Check each section and update if using minutes or hours
      Object.keys(customGranularityInput).forEach((section) => {
        const input = customGranularityInput[section];
        
        // If currently using minutes or hours, switch to days
        if (input.unit === 'minutes' || input.unit === 'hours') {
          // Convert current granularity to days
          let currentHours = granularity[section];
          let daysValue = Math.max(1, Math.round(currentHours / 24 * 10) / 10); // Round to 1 decimal
          
          setCustomGranularityInput(prev => ({
            ...prev,
            [section]: { value: daysValue.toString(), unit: 'days' }
          }));
          
          setGranularity(prev => ({
            ...prev,
            [section]: daysValue * 24
          }));
        }
      });
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // formatDate, formatTime, and formatTimeRange are now imported from analyticsHelpers

  return (
    <div className="analytics-overview">
      <div className="analytics-header-label">
        <span className="last-updated-label">Last updated: {new Date().toLocaleTimeString('en-GB')}</span>
      </div>
      
      <div className="time-range-controls">
        <button className="refresh-btn" onClick={() => { applyDateChanges(); fetchAnalytics(); }} disabled={loading} title="Refresh">
          <FaSync className={loading ? 'spinning' : ''} />
        </button>
        <div className="preset-buttons">
          {TIME_PRESETS.map(preset => (
            <button key={preset.label} className={`preset-btn ${sliderValue === preset.days ? 'active' : ''}`} onClick={() => handlePresetClick(preset.days)}>{preset.label}</button>
          ))}
        </div>
        <div className="slider-container">
          <input type="range" min="1" max="365" value={sliderValue} onChange={(e) => handleSliderChange(parseInt(e.target.value))} className="time-slider" />
          <span className="slider-label">{sliderValue}d</span>
        </div>
        <div className="datetime-inputs">
          <div className="datetime-group">
            <input 
              type="text" 
              value={startDateInput} 
              onChange={handleStartDateChange} 
              className="date-input" 
              placeholder="DD/MM/YYYY"
              maxLength={10}
            />
            <input 
              type="text" 
              value={startTimeInput} 
              onChange={handleStartTimeChange} 
              className="time-input" 
              placeholder="HH:MM"
              maxLength={5}
            />
          </div>
          <span className="datetime-separator">→</span>
          <div className="datetime-group">
            <input 
              type="text" 
              value={endDateInput} 
              onChange={handleEndDateChange} 
              className="date-input" 
              placeholder="DD/MM/YYYY"
              maxLength={10}
            />
            <input 
              type="text" 
              value={endTimeInput} 
              onChange={handleEndTimeChange} 
              className="time-input" 
              placeholder="HH:MM"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      <div className="metric-sections">
        {/* Total Users */}
        <div className={`metric-section ${expandedSections.totalUsers ? 'expanded' : ''}`}>
          <div className="section-header" style={{ borderLeftColor: '#22c55e' }}>
            <div onClick={() => toggleSection('totalUsers')} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <div className="section-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}><FaUsers /></div>
              <div className="section-info">
                <h3>Total Users</h3>
                <span className="section-count">{allUsers.length.toLocaleString()}</span>
              </div>
            </div>
            <button className="copy-query-btn" onClick={(e) => { e.stopPropagation(); copyQueryToClipboard(totalUsersQuery); }} title="Copy query to clipboard">
              {copiedQuery === totalUsersQuery ? '✓' : <FaCopy />}
            </button>
            <div className="section-toggle" onClick={() => toggleSection('totalUsers')} style={{ cursor: 'pointer' }}>
              {expandedSections.totalUsers ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          {expandedSections.totalUsers && (
            <div className="section-content">
              {/* Chart Controls */}
              <div className="chart-controls">
                <label>Granularity:</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={customGranularityInput.totalUsers.value}
                  onChange={(e) => setCustomGranularity('totalUsers', e.target.value, customGranularityInput.totalUsers.unit)}
                  className="granularity-input"
                  style={{ width: '70px', padding: '6px 8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e6edf3', fontSize: '0.85rem' }}
                />
                <div className="unit-buttons">
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.totalUsers.unit === 'minutes' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('totalUsers', customGranularityInput.totalUsers.value, 'minutes')}
                    >
                      Minutes
                    </button>
                  )}
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.totalUsers.unit === 'hours' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('totalUsers', customGranularityInput.totalUsers.value, 'hours')}
                    >
                      Hours
                    </button>
                  )}
                  <button 
                    className={`unit-btn ${customGranularityInput.totalUsers.unit === 'days' ? 'active' : ''}`}
                    onClick={() => setCustomGranularity('totalUsers', customGranularityInput.totalUsers.value, 'days')}
                  >
                    Days
                  </button>
                </div>
              </div>
              
              {/* Chart */}
              <div className="section-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getTotalUsersChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      type="category"
                      allowDataOverflow={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Total Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="section-search">
                <FaSearch />
                <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                {userSearch && <button onClick={() => setUserSearch('')}><FaTimes /></button>}
              </div>
              <div className="section-list">
                {filteredAllUsers.length === 0 ? <div className="empty-list">No users found</div> : filteredAllUsers.map(user => (
                  <div key={user.uid} className="list-item user-item">
                    <div className="item-avatar">{user.firstName?.charAt(0) || '?'}</div>
                    <div className="item-details">
                      <span className="item-name">{user.firstName} {user.lastName}</span>
                      <span className="item-email">{user.email}</span>
                    </div>
                    <div className="item-meta">
                      <span className="meta-label">Joined</span>
                      <span className="meta-value">{formatDate(user.dateCreated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className={`metric-section ${expandedSections.activeUsers ? 'expanded' : ''}`}>
          <div className="section-header" style={{ borderLeftColor: '#3b82f6' }}>
            <div onClick={() => toggleSection('activeUsers')} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <div className="section-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}><FaUserClock /></div>
              <div className="section-info">
                <h3>Active Users</h3>
                <span className="section-count">{activeUsers.length.toLocaleString()}</span>
                <span className="section-subtitle">{startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
            <button className="copy-query-btn" onClick={(e) => { e.stopPropagation(); copyQueryToClipboard(activeUsersQuery); }} title="Copy query to clipboard">
              {copiedQuery === activeUsersQuery ? '✓' : <FaCopy />}
            </button>
            <div className="section-toggle" onClick={() => toggleSection('activeUsers')} style={{ cursor: 'pointer' }}>
              {expandedSections.activeUsers ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          {expandedSections.activeUsers && (
            <div className="section-content">
              {/* Chart Controls */}
              <div className="chart-controls">
                <label>Granularity:</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={customGranularityInput.activeUsers.value}
                  onChange={(e) => setCustomGranularity('activeUsers', e.target.value, customGranularityInput.activeUsers.unit)}
                  className="granularity-input"
                  style={{ width: '70px', padding: '6px 8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e6edf3', fontSize: '0.85rem' }}
                />
                <div className="unit-buttons">
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.activeUsers.unit === 'minutes' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('activeUsers', customGranularityInput.activeUsers.value, 'minutes')}
                    >
                      Minutes
                    </button>
                  )}
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.activeUsers.unit === 'hours' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('activeUsers', customGranularityInput.activeUsers.value, 'hours')}
                    >
                      Hours
                    </button>
                  )}
                  <button 
                    className={`unit-btn ${customGranularityInput.activeUsers.unit === 'days' ? 'active' : ''}`}
                    onClick={() => setCustomGranularity('activeUsers', customGranularityInput.activeUsers.value, 'days')}
                  >
                    Days
                  </button>
                </div>
              </div>
              
              {/* Chart */}
              <div className="section-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getActiveUsersChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      type="category"
                      allowDataOverflow={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="section-search">
                <FaSearch />
                <input type="text" placeholder="Search active users..." value={activeUserSearch} onChange={(e) => setActiveUserSearch(e.target.value)} />
                {activeUserSearch && <button onClick={() => setActiveUserSearch('')}><FaTimes /></button>}
              </div>
              <div className="section-list">
                {filteredActiveUsers.length === 0 ? <div className="empty-list">No active users in this period</div> : filteredActiveUsers.map(user => (
                  <div key={user.uid} className="list-item user-item">
                    <div className="item-avatar active">{user.firstName?.charAt(0) || '?'}</div>
                    <div className="item-details">
                      <span className="item-name">{user.firstName} {user.lastName}</span>
                      <span className="item-email">{user.email}</span>
                    </div>
                    <div className="item-meta">
                      <span className="meta-label">Last Updated</span>
                      <span className="meta-value">{formatDate(user.lastUpdated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bookings */}
        <div className={`metric-section ${expandedSections.bookings ? 'expanded' : ''}`}>
          <div className="section-header" style={{ borderLeftColor: '#a855f7' }}>
            <div onClick={() => toggleSection('bookings')} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <div className="section-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}><FaCalendarCheck /></div>
              <div className="section-info">
                <h3>Bookings</h3>
                <span className="section-count">{bookings.length.toLocaleString()}</span>
                <span className="section-subtitle">{startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
            <button className="copy-query-btn" onClick={(e) => { e.stopPropagation(); copyQueryToClipboard(bookingsQuery); }} title="Copy query to clipboard">
              {copiedQuery === bookingsQuery ? '✓' : <FaCopy />}
            </button>
            <div className="section-toggle" onClick={() => toggleSection('bookings')} style={{ cursor: 'pointer' }}>
              {expandedSections.bookings ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          {expandedSections.bookings && (
            <div className="section-content">
              {/* Chart Controls */}
              <div className="chart-controls">
                <label>Granularity:</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={customGranularityInput.bookings.value}
                  onChange={(e) => setCustomGranularity('bookings', e.target.value, customGranularityInput.bookings.unit)}
                  className="granularity-input"
                  style={{ width: '70px', padding: '6px 8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e6edf3', fontSize: '0.85rem' }}
                />
                <div className="unit-buttons">
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.bookings.unit === 'minutes' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('bookings', customGranularityInput.bookings.value, 'minutes')}
                    >
                      Minutes
                    </button>
                  )}
                  {timeRangeInDays <= 1 && (
                    <button 
                      className={`unit-btn ${customGranularityInput.bookings.unit === 'hours' ? 'active' : ''}`}
                      onClick={() => setCustomGranularity('bookings', customGranularityInput.bookings.value, 'hours')}
                    >
                      Hours
                    </button>
                  )}
                  <button 
                    className={`unit-btn ${customGranularityInput.bookings.unit === 'days' ? 'active' : ''}`}
                    onClick={() => setCustomGranularity('bookings', customGranularityInput.bookings.value, 'days')}
                  >
                    Days
                  </button>
                </div>
              </div>
              
              {/* Chart */}
              <div className="section-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getBookingsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      type="category"
                      allowDataOverflow={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={{ fill: '#a855f7', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Bookings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="section-search">
                <FaSearch />
                <input type="text" placeholder="Search by mentor, mentee, or status..." value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} />
                {bookingSearch && <button onClick={() => setBookingSearch('')}><FaTimes /></button>}
              </div>
              <div className="section-list">
                {filteredBookings.length === 0 ? <div className="empty-list">No bookings in this period</div> : filteredBookings.map(booking => (
                  <div key={booking.bookingId} className="list-item booking-item">
                    <div className="booking-parties">
                      <div className="booking-party mentor">
                        <span className="party-label">Mentor</span>
                        <span className="party-name">{booking.mentorName}</span>
                      </div>
                      <span className="booking-arrow">→</span>
                      <div className="booking-party mentee">
                        <span className="party-label">Mentee</span>
                        <span className="party-name">{booking.menteeName}</span>
                      </div>
                    </div>
                    <div className="booking-meta">
                      <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                      <span className="booking-date">{formatDate(booking.startTime)}</span>
                      <span className="booking-time">{formatTimeRange(booking.startTime, booking.endTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Views */}
        <div className={`metric-section ${expandedSections.profileViews ? 'expanded' : ''}`}>
          <div className="section-header" style={{ borderLeftColor: '#f59e0b' }}>
            <div onClick={() => toggleSection('profileViews')} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <div className="section-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FaEye /></div>
              <div className="section-info">
                <h3>Profile Views</h3>
                <span className="section-count">{totalProfileViews.toLocaleString()}</span>
                <span className="section-subtitle">{startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
            <button className="copy-query-btn" onClick={(e) => { e.stopPropagation(); copyQueryToClipboard(profileViewsQuery); }} title="Copy query to clipboard">
              {copiedQuery === profileViewsQuery ? '✓' : <FaCopy />}
            </button>
            <div className="section-toggle" onClick={() => toggleSection('profileViews')} style={{ cursor: 'pointer' }}>
              {expandedSections.profileViews ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          {expandedSections.profileViews && (
            <div className="section-content">
              <div className="profile-views-filter">
                <label>View by specific user:</label>
                <div className="profile-search-container">
                  <div className="profile-search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input type="text" className="profile-search-input" placeholder="Search user..." value={profileSearch} onChange={(e) => { setProfileSearch(e.target.value); setShowProfileDropdown(true); }} onFocus={() => setShowProfileDropdown(true)} />
                    {selectedProfile && <button className="clear-profile-btn" onClick={() => { setSelectedProfile(null); setProfileSearch(''); setProfileViews(0); }}><FaTimes /></button>}
                  </div>
                  {showProfileDropdown && profileSearch && filteredProfileUsers.length > 0 && (
                    <div className="profile-dropdown">
                      {filteredProfileUsers.map(user => (
                        <div key={user.uid} className="profile-dropdown-item" onClick={() => { setSelectedProfile(user); setProfileSearch(`${user.firstName} ${user.lastName}`); setShowProfileDropdown(false); }}>
                          <span className="profile-name">{user.firstName} {user.lastName}</span>
                          <span className="profile-email">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProfile && (
                  <div className="selected-profile-views">
                    <span className="selected-name">{selectedProfile.firstName} {selectedProfile.lastName}</span>
                    <span className="selected-count">{loadingProfileViews ? '...' : `${profileViews} views`}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
