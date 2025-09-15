import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { MentorMenteeProfile } from '../../widgets/MentorAlgorithm/algorithm/matchUsers';
import { CalComAvailability } from '../../widgets/MentorAlgorithm/CalCom/calComService';
import { Booking } from '../../../types/bookings';
import { 
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaSync,
  FaUserEdit,
  FaEye
} from 'react-icons/fa';
import '../../../styles/adminStyles/MobileMentorManagement.css';

// Import existing components
import AdminMentorModal from './AdminMentorModal';
import BookingDetailsModal from './BookingDetailsModal';

// Interfaces
interface TimeSlot {
  id: string;
  day?: string;
  date?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  type: 'recurring' | 'specific';
}

interface MentorAvailability {
  mentorId: string;
  timeSlots: TimeSlot[];
  lastUpdated: Date;
}

interface MentorAvailabilityWithProfile extends MentorAvailability {
  mentorProfile?: MentorMenteeProfile;
  calComAvailability?: CalComAvailability[];
  hasCalComIntegration?: boolean;
}

interface MentorMenteeProfileWithId extends MentorMenteeProfile {
  id: string;
  isGenerated?: boolean;
}

interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
  bookingMethod?: string;
}

interface MobileMentorManagementProps {
  isOpen: boolean;
  onClose: () => void;
}


export const MobileMentorManagement: React.FC<MobileMentorManagementProps> = ({
  isOpen,
  onClose
}) => {
  // State management
  const [users, setUsers] = useState<MentorMenteeProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<MentorMenteeProfileWithId | null>(null);
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Availability state
  const [availabilityData, setAvailabilityData] = useState<MentorAvailabilityWithProfile[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  
  // Search and filter state
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [userGeneratedFilter, setUserGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');
  const [bookingGeneratedFilter, setBookingGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');
  const [bookingMethodFilter, setBookingMethodFilter] = useState<'all' | 'internal' | 'calcom'>('all');
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [availabilityStatusFilter, setAvailabilityStatusFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [availabilityTypeFilter, setAvailabilityTypeFilter] = useState<'all' | 'recurring' | 'specific'>('all');

  // Define tabs for mobile navigation
  const tabs = [
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'bookings', name: 'Bookings', icon: '📅' },
    { id: 'availability', name: 'Availability', icon: '⏰' },
    { id: 'analytics', name: 'Analytics', icon: '📊' }
  ];

  // Calculate counts
  const generatedUsers = users.filter(u => u.isGenerated);

  // Fetch users from mentorProgram subcollections and generated collections
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers: MentorMenteeProfileWithId[] = [];
      
      // Get all users and check their mentorProgram subcollections (original profiles)
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            const isGenerated = userData.isGenerated === true;
            
            let userType = 'unknown';
            if (userData.isMentor === true) {
              userType = 'MENTOR';
            } else if (userData.isMentee === true) {
              userType = 'MENTEE';
            } else if (userData.type) {
              userType = userData.type.toUpperCase();
            }
            
            allUsers.push({
              ...userData,
              id: userDoc.id,
              isGenerated: isGenerated,
              type: userType
            } as unknown as MentorMenteeProfileWithId);
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch generated mentors from "Generated Mentors" collection
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          const userType = mentorData.isMentor === true ? 'MENTOR' : 
                          mentorData.isMentee === true ? 'MENTEE' : 
                          mentorData.type ? mentorData.type.toUpperCase() : 'MENTOR';
          
          allUsers.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true,
            type: userType
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees from "Generated Mentees" collection
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          const userType = menteeData.isMentor === true ? 'MENTOR' : 
                          menteeData.isMentee === true ? 'MENTEE' : 
                          menteeData.type ? menteeData.type.toUpperCase() : 'MENTEE';
          
          allUsers.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true,
            type: userType
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const results: Booking[] = [];
      
      // Fetch Firestore bookings
      const bookingsSnapshot = await getDocs(collection(firestore, 'bookings'));
      const firestoreBookings = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          mentorName: data.mentorName || 'Unknown',
          mentorEmail: data.mentorEmail || 'No email',
          menteeName: data.menteeName || 'Unknown',
          menteeEmail: data.menteeEmail || 'No email',
          sessionDate: data.sessionDate,
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || 'pending',
          meetLink: data.meetLink,
          eventId: data.eventId,
          mentorId: data.mentorId,
          menteeId: data.menteeId,
          createdAt: data.createdAt,
          duration: data.duration || 60,
          revenue: data.revenue || 0,
          isCalComBooking: data.isCalComBooking || false,
          day: data.day || '',
          calComBookingId: data.calComBookingId || null,
          calComEventType: data.calComEventType || null,
          calComAttendees: data.calComAttendees || [],
          bookingMethod: data.bookingMethod || 'internal',
          isGeneratedMentor: false,
          isGeneratedMentee: false,
        } as Booking;
      });
      results.push(...firestoreBookings);

      setBookings(results);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookingsError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch availability data
  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData: MentorMenteeProfileWithId[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            usersData.push({
              ...userData,
              id: userDoc.id,
              isGenerated: false
            } as MentorMenteeProfileWithId);
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch availability data from users/{uid}/availabilities subcollections
      const availabilityPromises = usersData.map(async (user) => {
        try {
          const availabilityDoc = await getDoc(doc(firestore, 'users', user.id, 'availabilities', 'default'));
          if (availabilityDoc.exists()) {
            const availabilityData = availabilityDoc.data();
            return {
              ...availabilityData,
              mentorId: user.id
            } as MentorAvailabilityWithProfile;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching availability for user ${user.id}:`, error);
          return null;
        }
      });
      
      const availabilityResults = await Promise.all(availabilityPromises);
      const allAvailabilityData = availabilityResults.filter(Boolean) as MentorAvailabilityWithProfile[];
      
      setAvailabilityData(allAvailabilityData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailabilityError('Failed to load availability data');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
      const matchesGenerated = userGeneratedFilter === 'all' || 
        (userGeneratedFilter === 'generated' && user.isGenerated) ||
        (userGeneratedFilter === 'real' && !user.isGenerated);
      const s = userSearch.toLowerCase();
      const matchesSearch =
        s === '' ||
        (typeof user.name === 'string' ? user.name.toLowerCase() : '').includes(s) ||
        (typeof user.email === 'string' ? user.email.toLowerCase() : '').includes(s) ||
        (typeof user.profession === 'string' ? user.profession.toLowerCase() : '').includes(s);
      return matchesType && matchesGenerated && matchesSearch;
    });
  }, [users, userTypeFilter, userGeneratedFilter, userSearch]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const extendedBooking = booking as ExtendedBooking;
      
      if (bookingGeneratedFilter !== 'all') {
        const hasGeneratedProfile = extendedBooking.isGeneratedMentor || extendedBooking.isGeneratedMentee;
        if (bookingGeneratedFilter === 'generated' && !hasGeneratedProfile) return false;
        if (bookingGeneratedFilter === 'real' && hasGeneratedProfile) return false;
      }
      
      if (bookingMethodFilter !== 'all') {
        const method = extendedBooking.bookingMethod || 'internal';
        if (method !== bookingMethodFilter) return false;
      }
      
      return true;
    });
  }, [bookings, bookingGeneratedFilter, bookingMethodFilter]);

  // Filter availability
  const filteredAvailability = useMemo(() => {
    return availabilityData.filter(availability => {
      const mentorName = (typeof availability.mentorProfile?.name === 'string' ? availability.mentorProfile.name.toLowerCase() : '') || '';
      const mentorEmail = (typeof availability.mentorProfile?.email === 'string' ? availability.mentorProfile.email.toLowerCase() : '') || '';
      const searchTerm = availabilitySearch.toLowerCase();
      
      if (searchTerm && !mentorName.includes(searchTerm) && !mentorEmail.includes(searchTerm)) {
        return false;
      }
      
      if (availabilityStatusFilter !== 'all') {
        const hasMatchingStatus = availability.timeSlots.some(slot => 
          availabilityStatusFilter === 'available' ? slot.isAvailable : !slot.isAvailable
        );
        if (!hasMatchingStatus) return false;
      }
      
      if (availabilityTypeFilter !== 'all') {
        const hasMatchingType = availability.timeSlots.some(slot => slot.type === availabilityTypeFilter);
        if (!hasMatchingType) return false;
      }
      
      return true;
    });
  }, [availabilityData, availabilitySearch, availabilityStatusFilter, availabilityTypeFilter]);

  // Load data when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Load data when tabs change
  useEffect(() => {
    if (isOpen) {
      if (currentTab === 1) { // Bookings tab
        fetchBookings();
      } else if (currentTab === 2) { // Availability tab
        fetchAvailability();
      }
    }
  }, [currentTab, isOpen]);

  if (!isOpen) return null;

  const nextTab = () => {
    if (currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (currentTab === 0) {
      fetchUsers();
    } else if (currentTab === 1) {
      fetchBookings();
    } else if (currentTab === 2) {
      fetchAvailability();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Users
        return (
          <div className="mmm-section">
            <h3 className="mmm-section-title">User Management</h3>
            <div className="mmm-form-fields">
              {/* User Stats */}
              <div className="mmm-stats-grid">
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">👥</div>
                  <div className="mmm-stat-content">
                    <h4>Total Users</h4>
                    <p>{users.length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">👨‍🏫</div>
                  <div className="mmm-stat-content">
                    <h4>Mentors</h4>
                    <p>{users.filter(u => u.isMentor).length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">👨‍🎓</div>
                  <div className="mmm-stat-content">
                    <h4>Mentees</h4>
                    <p>{users.filter(u => u.isMentee).length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">🎲</div>
                  <div className="mmm-stat-content">
                    <h4>Generated</h4>
                    <p>{generatedUsers.length}</p>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mmm-input-group">
                <label htmlFor="userSearch" className="mmm-field-label">
                  Search Users
                </label>
                <div className="mmm-search-container">
                  <FaSearch className="mmm-search-icon" />
                  <input
                    id="userSearch"
                    type="text"
                    placeholder="Search by name, email, or profession..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="mmm-search-input"
                  />
                </div>
              </div>

              <div className="mmm-filter-buttons">
                <button
                  className={`mmm-filter-btn ${userTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setUserTypeFilter('all')}
                >
                  All Types
                </button>
                <button
                  className={`mmm-filter-btn ${userTypeFilter === 'mentor' ? 'active' : ''}`}
                  onClick={() => setUserTypeFilter('mentor')}
                >
                  Mentors
                </button>
                <button
                  className={`mmm-filter-btn ${userTypeFilter === 'mentee' ? 'active' : ''}`}
                  onClick={() => setUserTypeFilter('mentee')}
                >
                  Mentees
                </button>
                <button
                  className={`mmm-filter-btn ${userGeneratedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setUserGeneratedFilter('all')}
                >
                  All Profiles
                </button>
                <button
                  className={`mmm-filter-btn ${userGeneratedFilter === 'real' ? 'active' : ''}`}
                  onClick={() => setUserGeneratedFilter('real')}
                >
                  Real
                </button>
                <button
                  className={`mmm-filter-btn ${userGeneratedFilter === 'generated' ? 'active' : ''}`}
                  onClick={() => setUserGeneratedFilter('generated')}
                >
                  Generated
                </button>
              </div>

              {/* Users List */}
              <div className="mmm-users-list">
                {loading ? (
                  <div className="mmm-loading">Loading users...</div>
                ) : error ? (
                  <div className="mmm-loading" style={{ color: 'var(--error)' }}>{error}</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="mmm-user-card">
                      <div className="mmm-user-info">
                        <div className="mmm-user-name">
                          {user.name}
                          {user.isGenerated && <span className="mmm-user-badge generated">🎲</span>}
                        </div>
                        <div className="mmm-user-email">{user.email}</div>
                        <div className="mmm-user-details">
                          <span>{user.age} years old</span>
                          <span>•</span>
                          <span>{user.profession}</span>
                          <span>•</span>
                          <span>{user.county}</span>
                        </div>
                      </div>
                      <div className="mmm-user-actions">
                        <div className={`mmm-user-badge ${user.isMentor ? 'mentor' : 'mentee'}`}>
                          {user.isMentor ? 'Mentor' : 'Mentee'}
                        </div>
                        <div className="mmm-action-buttons">
                          <button
                            className="mmm-action-btn view"
                            onClick={() => {
                              setModalUser(user);
                              setModalOpen(true);
                            }}
                          >
                            <FaEye />
                            View
                          </button>
                          <button
                            className="mmm-action-btn edit"
                            onClick={() => {
                              setEditUser(user);
                              setEditModalOpen(true);
                            }}
                          >
                            <FaUserEdit />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 1: // Bookings
        return (
          <div className="mmm-section">
            <h3 className="mmm-section-title">Booking Management</h3>
            <div className="mmm-form-fields">
              {/* Booking Stats */}
              <div className="mmm-stats-grid">
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">📅</div>
                  <div className="mmm-stat-content">
                    <h4>Total Bookings</h4>
                    <p>{bookings.length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">✅</div>
                  <div className="mmm-stat-content">
                    <h4>Confirmed</h4>
                    <p>{bookings.filter(b => b.status === 'confirmed').length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">⏳</div>
                  <div className="mmm-stat-content">
                    <h4>Pending</h4>
                    <p>{bookings.filter(b => b.status === 'pending').length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">💰</div>
                  <div className="mmm-stat-content">
                    <h4>Revenue</h4>
                    <p>£{bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)}</p>
                  </div>
                </div>
              </div>

              {/* Booking Filters */}
              <div className="mmm-filter-buttons">
                <button
                  className={`mmm-filter-btn ${bookingGeneratedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBookingGeneratedFilter('all')}
                >
                  All Profiles
                </button>
                <button
                  className={`mmm-filter-btn ${bookingGeneratedFilter === 'real' ? 'active' : ''}`}
                  onClick={() => setBookingGeneratedFilter('real')}
                >
                  Real Profiles
                </button>
                <button
                  className={`mmm-filter-btn ${bookingGeneratedFilter === 'generated' ? 'active' : ''}`}
                  onClick={() => setBookingGeneratedFilter('generated')}
                >
                  Generated Profiles
                </button>
                <button
                  className={`mmm-filter-btn ${bookingMethodFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBookingMethodFilter('all')}
                >
                  All Methods
                </button>
                <button
                  className={`mmm-filter-btn ${bookingMethodFilter === 'internal' ? 'active' : ''}`}
                  onClick={() => setBookingMethodFilter('internal')}
                >
                  Internal
                </button>
                <button
                  className={`mmm-filter-btn ${bookingMethodFilter === 'calcom' ? 'active' : ''}`}
                  onClick={() => setBookingMethodFilter('calcom')}
                >
                  Cal.com
                </button>
              </div>

              {/* Bookings List */}
              <div className="mmm-users-list">
                {loadingBookings ? (
                  <div className="mmm-loading">Loading bookings...</div>
                ) : bookingsError ? (
                  <div className="mmm-loading" style={{ color: 'var(--error)' }}>{bookingsError}</div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div key={booking.id} className="mmm-user-card">
                      <div className="mmm-user-info">
                        <div className="mmm-user-name">
                          {booking.mentorName} → {booking.menteeName}
                        </div>
                        <div className="mmm-user-email">
                          {(() => {
                            try {
                              if (booking.sessionDate instanceof Date) {
                                return booking.sessionDate.toLocaleDateString();
                              } else if (booking.sessionDate && typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate) {
                                return (booking.sessionDate as { toDate: () => Date }).toDate().toLocaleDateString();
                              } else {
                                return new Date(booking.sessionDate || '').toLocaleDateString();
                              }
                            } catch {
                              return 'Invalid Date';
                            }
                          })()} at {booking.startTime}
                        </div>
                        <div className="mmm-user-details">
                          <span>Status: {booking.status}</span>
                          <span>•</span>
                          <span>Duration: {booking.duration}min</span>
                          <span>•</span>
                          <span>Revenue: £{booking.revenue || 0}</span>
                        </div>
                      </div>
                      <div className="mmm-user-actions">
                        <div className={`mmm-user-badge ${booking.isCalComBooking ? 'mentor' : 'mentee'}`}>
                          {booking.isCalComBooking ? 'Cal.com' : 'Internal'}
                        </div>
                        <div className="mmm-action-buttons">
                          <button
                            className="mmm-action-btn view"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <FaEye />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Availability
        return (
          <div className="mmm-section">
            <h3 className="mmm-section-title">Availability Management</h3>
            <div className="mmm-form-fields">
              {/* Availability Stats */}
              <div className="mmm-stats-grid">
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">👨‍🏫</div>
                  <div className="mmm-stat-content">
                    <h4>Mentors</h4>
                    <p>{availabilityData.length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">⏰</div>
                  <div className="mmm-stat-content">
                    <h4>Total Slots</h4>
                    <p>{availabilityData.reduce((total, a) => total + a.timeSlots.length, 0)}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">✅</div>
                  <div className="mmm-stat-content">
                    <h4>Available</h4>
                    <p>{availabilityData.reduce((total, a) => total + a.timeSlots.filter(s => s.isAvailable).length, 0)}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">📅</div>
                  <div className="mmm-stat-content">
                    <h4>Booked</h4>
                    <p>{availabilityData.reduce((total, a) => total + a.timeSlots.filter(s => !s.isAvailable).length, 0)}</p>
                  </div>
                </div>
              </div>

              {/* Availability Search */}
              <div className="mmm-input-group">
                <label htmlFor="availabilitySearch" className="mmm-field-label">
                  Search Mentors
                </label>
                <div className="mmm-search-container">
                  <FaSearch className="mmm-search-icon" />
                  <input
                    id="availabilitySearch"
                    type="text"
                    placeholder="Search by mentor name or email..."
                    value={availabilitySearch}
                    onChange={(e) => setAvailabilitySearch(e.target.value)}
                    className="mmm-search-input"
                  />
                </div>
              </div>

              {/* Availability Filters */}
              <div className="mmm-filter-buttons">
                <button
                  className={`mmm-filter-btn ${availabilityStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAvailabilityStatusFilter('all')}
                >
                  All Status
                </button>
                <button
                  className={`mmm-filter-btn ${availabilityStatusFilter === 'available' ? 'active' : ''}`}
                  onClick={() => setAvailabilityStatusFilter('available')}
                >
                  Available
                </button>
                <button
                  className={`mmm-filter-btn ${availabilityStatusFilter === 'booked' ? 'active' : ''}`}
                  onClick={() => setAvailabilityStatusFilter('booked')}
                >
                  Booked
                </button>
                <button
                  className={`mmm-filter-btn ${availabilityTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAvailabilityTypeFilter('all')}
                >
                  All Types
                </button>
                <button
                  className={`mmm-filter-btn ${availabilityTypeFilter === 'recurring' ? 'active' : ''}`}
                  onClick={() => setAvailabilityTypeFilter('recurring')}
                >
                  Recurring
                </button>
                <button
                  className={`mmm-filter-btn ${availabilityTypeFilter === 'specific' ? 'active' : ''}`}
                  onClick={() => setAvailabilityTypeFilter('specific')}
                >
                  One-off
                </button>
              </div>

              {/* Availability List */}
              <div className="mmm-users-list">
                {loadingAvailability ? (
                  <div className="mmm-loading">Loading availability...</div>
                ) : availabilityError ? (
                  <div className="mmm-loading" style={{ color: 'var(--error)' }}>{availabilityError}</div>
                ) : (
                  filteredAvailability.map((availability) => (
                    <div key={availability.mentorId} className="mmm-user-card">
                      <div className="mmm-user-info">
                        <div className="mmm-user-name">
                          {availability.mentorProfile?.name || `Mentor ${availability.mentorId.slice(0, 8)}`}
                        </div>
                        <div className="mmm-user-email">
                          {availability.mentorProfile?.email || 'No email'}
                        </div>
                        <div className="mmm-user-details">
                          <span>Total: {availability.timeSlots.length}</span>
                          <span>•</span>
                          <span>Available: {availability.timeSlots.filter(s => s.isAvailable).length}</span>
                          <span>•</span>
                          <span>Booked: {availability.timeSlots.filter(s => !s.isAvailable).length}</span>
                        </div>
                      </div>
                      <div className="mmm-user-actions">
                        <div className={`mmm-user-badge ${availability.hasCalComIntegration ? 'mentor' : 'mentee'}`}>
                          {availability.hasCalComIntegration ? 'Cal.com' : 'Internal'}
                        </div>
                        <div className="mmm-action-buttons">
                          <button
                            className="mmm-action-btn view"
                            onClick={() => {
                              // Handle availability details view
                              console.log('View availability details for:', availability.mentorId);
                            }}
                          >
                            <FaEye />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 3: // Analytics
        return (
          <div className="mmm-section">
            <h3 className="mmm-section-title">Analytics Dashboard</h3>
            <div className="mmm-form-fields">
              {/* Analytics Stats */}
              <div className="mmm-stats-grid">
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">📊</div>
                  <div className="mmm-stat-content">
                    <h4>Total Users</h4>
                    <p>{users.length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">📅</div>
                  <div className="mmm-stat-content">
                    <h4>Total Bookings</h4>
                    <p>{bookings.length}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">💰</div>
                  <div className="mmm-stat-content">
                    <h4>Total Revenue</h4>
                    <p>£{bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)}</p>
                  </div>
                </div>
                <div className="mmm-stat-card">
                  <div className="mmm-stat-icon">⏰</div>
                  <div className="mmm-stat-content">
                    <h4>Availability Slots</h4>
                    <p>{availabilityData.reduce((total, a) => total + a.timeSlots.length, 0)}</p>
                  </div>
                </div>
              </div>

              <div className="mmm-loading">
                <p>Analytics dashboard coming soon...</p>
                <p>This will include charts, trends, and detailed insights.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const modalContent = (
    <>
      {/* Mobile Mentor Management Modal Overlay */}
      <div 
        className="mmm-overlay"
        onClick={onClose}
      >
        <div 
          className="mmm-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mmm-header">
            <div className="mmm-header-content">
              <div className="mmm-header-left">
                <div className="mmm-title-section">
                  <h2 className="mmm-title">Mentor Management</h2>
                  <p className="mmm-progress-text">
                    Tab {currentTab + 1} of {tabs.length}
                  </p>
                </div>
              </div>
              <button
                className="mmm-refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh data"
                aria-label="Refresh data"
              >
                <FaSync className={refreshing ? 'spinning' : ''} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="mmm-navigation">
              <button
                className="mmm-nav-btn"
                onClick={prevTab}
                disabled={currentTab === 0}
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="mmm-tab-indicators">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    className={`mmm-tab-indicator ${index === currentTab ? 'active' : ''}`}
                    onClick={() => setCurrentTab(index)}
                  >
                    <span className="mmm-tab-icon">{tab.icon}</span>
                    <span className="mmm-tab-name">{tab.name}</span>
                  </button>
                ))}
              </div>

              <button
                className="mmm-nav-btn"
                onClick={nextTab}
                disabled={currentTab === tabs.length - 1}
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mmm-content">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="mmm-footer">
            <div className="mmm-footer-info">
              <p className="mmm-footer-text">
                Mentor Management Portal
              </p>
              <p className="mmm-footer-role">Administrator Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdminMentorModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        user={modalUser} 
        mode="view" 
      />
      <AdminMentorModal 
        open={editModalOpen} 
        onClose={() => { setEditModalOpen(false); setEditUser(null); }} 
        user={editUser} 
        mode="edit" 
        onSave={() => {
          // Handle save logic here
          setEditModalOpen(false);
          setEditUser(null);
          fetchUsers(); // Refresh users list
        }} 
      />
      <BookingDetailsModal 
        booking={selectedBooking} 
        open={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)} 
        onDelete={(booking) => {
          // Handle delete logic here
          setBookings(prev => prev.filter(b => b.id !== booking.id));
          setDetailsModalOpen(false);
        }} 
        onUpdateStatus={(booking, status) => {
          // Handle status update logic here
          setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
          setDetailsModalOpen(false);
        }} 
      />
    </>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(modalContent, document.body);
};
