import React, { useState, useEffect, useMemo } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { getDisplayName, getName, MentorMenteeProfile } from '../../widgets/MentorAlgorithm/algorithm/matchUsers';
import { CalComService, CalComBookingResponse, CalComAvailability, CalComTokenManager } from '../../widgets/MentorAlgorithm/CalCom/calComService';
import { Booking } from '../../../types/bookings';
import GenerateRandomProfile from './GenerateRandomProfile';
import { FaSync, FaClock, FaUser, FaCalendarAlt, FaChartBar, FaCheck, FaPoundSign } from 'react-icons/fa';
import AdminMentorModal from './AdminMentorModal';
import '../../../styles/adminStyles/MentorManagement.css';
import BookingsTable from './BookingsTable';
import BookingDetailsModal from './BookingDetailsModal';
import BookingsGrouped from './BookingsGrouped';



// Add Availability interfaces for admin view
interface TimeSlot {
  id: string;
  day?: string; // For recurring
  date?: string; // For specific date (YYYY-MM-DD)
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

type FirestoreTimestamp = { toDate: () => Date };
function isFirestoreTimestamp(val: unknown): val is FirestoreTimestamp {
  return !!val && typeof val === 'object' && typeof (val as { toDate?: unknown }).toDate === 'function';
}

// Extend the Booking interface to include generated properties
interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
  bookingMethod?: string;
}

// Inline BookingAnalytics component
const BookingAnalytics = ({ bookings }: { bookings: Booking[] }) => {
  const analytics = useMemo(() => {
    // Only count Cal.com bookings (internal booking system removed)
    const calComBookings = bookings.filter(b => b.isCalComBooking);
    const totalBookings = calComBookings.length;
    const confirmedBookings = calComBookings.filter(b => b.status === 'confirmed').length;
    const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const totalRevenue = calComBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);

    return { totalBookings, confirmedBookings, calComBookings: totalBookings, completionRate, totalRevenue };
  }, [bookings]);

  return (
    <div>
      <h2 style={{ color: '#ffb300', marginBottom: 16 }}>Booking Analytics Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaCalendarAlt style={{ fontSize: 24, color: '#ffb300', marginBottom: 8 }} />
          <h3 style={{ color: '#ffb300', fontSize: 16, marginBottom: 4 }}>Total Bookings</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{analytics.totalBookings}</p>
        </div>
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaCheck style={{ fontSize: 24, color: '#00e676', marginBottom: 8 }} />
          <h3 style={{ color: '#00e676', fontSize: 16, marginBottom: 4 }}>Completion Rate</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{analytics.completionRate.toFixed(1)}%</p>
        </div>
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaPoundSign style={{ fontSize: 24, color: '#00e676', marginBottom: 8 }} />
          <h3 style={{ color: '#00e676', fontSize: 16, marginBottom: 4 }}>Total Revenue</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>£{analytics.totalRevenue}</p>
        </div>
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaClock style={{ fontSize: 24, color: '#00eaff', marginBottom: 8 }} />
          <h3 style={{ color: '#00eaff', fontSize: 16, marginBottom: 4 }}>Cal.com Bookings</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{analytics.calComBookings}</p>
        </div>
      </div>
    </div>
  );
};

export default function MentorManagement() {
  const [users, setUsers] = useState<MentorMenteeProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<'users' | 'bookings' | 'availability' | 'analytics'>('users');
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  // Bookings view mode
  const [bookingsView, setBookingsView] = useState<'table' | 'grouped'>('table');
  const [groupBy, setGroupBy] = useState<'mentor' | 'mentee'>('mentor');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<MentorAvailabilityWithProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Add new state for booking filters
  const [bookingGeneratedFilter, setBookingGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');
  const [bookingMethodFilter, setBookingMethodFilter] = useState<'all' | 'calcom'>('all');
  // Availability state
  const [availabilityData, setAvailabilityData] = useState<MentorAvailabilityWithProfile[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [availabilityStatusFilter, setAvailabilityStatusFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [availabilityTypeFilter, setAvailabilityTypeFilter] = useState<'all' | 'recurring' | 'specific'>('all');

  // Add state for sorting and searching
  const [userSortField, setUserSortField] = useState<'name' | 'type' | 'email' | 'profession' | 'education' | 'county'>('name');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('asc');
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [userGeneratedFilter, setUserGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');

  // Stat tile hover state
  const [hoveredTile, setHoveredTile] = useState<'total' | 'mentors' | 'mentees' | null>(null);

  // Calculate counts
  const realUsers = users.filter(u => !u.isGenerated);
  const generatedUsers = users.filter(u => u.isGenerated);
  const realMentors = realUsers.filter(u => u.isMentor);
  const generatedMentors = generatedUsers.filter(u => u.isMentor);
  const realMentees = realUsers.filter(u => u.isMentee);
  const generatedMentees = generatedUsers.filter(u => u.isMentee);

  // Fetch users from mentorProgram subcollections and generated collections
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers: MentorMenteeProfileWithId[] = [];
      
      // Get all users and check their mentorProgram subcollections (original profiles)
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      console.log(`Found ${usersSnapshot.docs.length} users in users collection`);
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            // Check if this profile has the isGenerated flag set to true
            const isGenerated = userData.isGenerated === true;
            
            // Determine the user type - check both isMentor/isMentee and type fields
            let userType = 'unknown';
            if (userData.isMentor === true) {
              userType = 'MENTOR';
            } else if (userData.isMentee === true) {
              userType = 'MENTEE';
            } else if (userData.type) {
              userType = userData.type.toUpperCase();
            }
            
            console.log(`User ${userDoc.id} (${userData.name}): isGenerated = ${isGenerated}, isMentor = ${userData.isMentor}, isMentee = ${userData.isMentee}, type = ${userData.type}, resolved type = ${userType}`);
            
            allUsers.push({
              ...userData,
              id: userDoc.id,
              isGenerated: isGenerated, // Use the actual flag from the profile data
              type: userType // Ensure we have the correct type
            } as unknown as MentorMenteeProfileWithId);
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch generated mentors from "Generated Mentors" collection
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        console.log(`Found ${generatedMentorsSnapshot.docs.length} generated mentors`);
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          // Ensure generated mentors have the correct type
          const userType = mentorData.isMentor === true ? 'MENTOR' : 
                          mentorData.isMentee === true ? 'MENTEE' : 
                          mentorData.type ? mentorData.type.toUpperCase() : 'MENTOR';
          
          console.log(`Generated Mentor ${doc.id}: ${mentorData.name}, type = ${userType}`);
          allUsers.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true, // Mark as generated profile
            type: userType // Ensure correct type
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees from "Generated Mentees" collection
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        console.log(`Found ${generatedMenteesSnapshot.docs.length} generated mentees`);
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          // Ensure generated mentees have the correct type
          const userType = menteeData.isMentor === true ? 'MENTOR' : 
                          menteeData.isMentee === true ? 'MENTEE' : 
                          menteeData.type ? menteeData.type.toUpperCase() : 'MENTEE';
          
          console.log(`Generated Mentee ${doc.id}: ${menteeData.name}, type = ${userType}`);
          allUsers.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true, // Mark as generated profile
            type: userType // Ensure correct type
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
      }
      
      console.log(`Total users loaded: ${allUsers.length}`);
      console.log(`Real users: ${allUsers.filter(u => !u.isGenerated).length}`);
      console.log(`Generated users: ${allUsers.filter(u => u.isGenerated).length}`);
      console.log(`Real mentors: ${allUsers.filter(u => !u.isGenerated && u.isMentor).length}`);
      console.log(`Generated mentors: ${allUsers.filter(u => u.isGenerated && u.isMentor).length}`);
      console.log(`Real mentees: ${allUsers.filter(u => !u.isGenerated && u.isMentee).length}`);
      console.log(`Generated mentees: ${allUsers.filter(u => u.isGenerated && u.isMentee).length}`);
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetchBookings function that includes Cal.com bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const results: Booking[] = [];
      
      // Fetch Firestore bookings (only Cal.com bookings - internal system removed)
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('isCalComBooking', '==', true)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
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
          // Add new fields for enhanced booking data
          day: data.day || '',
          calComBookingId: data.calComBookingId || null,
          calComEventType: data.calComEventType || null,
          calComAttendees: data.calComAttendees || [],
          bookingMethod: data.bookingMethod || 'internal',
          // Add generated profile detection
          isGeneratedMentor: false, // Will be set below
          isGeneratedMentee: false, // Will be set below
        } as Booking;
      });
      results.push(...firestoreBookings);

      // Fetch Cal.com bookings from all mentors
      try {
        // Get all users and check their mentorProgram subcollections for mentors
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const mentorPromises: Promise<Booking[]>[] = [];
        
        for (const userDoc of usersSnapshot.docs) {
          try {
            const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
            if (mentorProgramDoc.exists()) {
              const mentorData = mentorProgramDoc.data();
              if (mentorData.isMentor) {
                const mentorPromise = (async () => {
                  try {
                    const calComBookings = await CalComService.getBookings(userDoc.id);
                    return calComBookings.map((calBooking: CalComBookingResponse) => {
                      const startDate = new Date(calBooking.startTime);
                      const endDate = new Date(calBooking.endTime);
                      
                      // Find mentor and mentee from attendees
                      const mentor = calBooking.attendees.find(attendee => 
                        attendee.email === mentorData.email
                      );
                      const mentee = calBooking.attendees.find(attendee => 
                        attendee.email !== mentorData.email
                      );
                      
                      return {
                        id: `calcom-${calBooking.id}`,
                        mentorId: userDoc.id,
                        menteeId: mentee?.email || 'unknown',
                        mentorName: mentor?.name || mentorData.name || 'Unknown Mentor',
                        menteeName: mentee?.name || 'Unknown Mentee',
                        mentorEmail: mentor?.email || mentorData.email || '',
                        menteeEmail: mentee?.email || '',
                        sessionDate: Timestamp.fromDate(startDate),
                        startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        status: calBooking.status === 'ACCEPTED' ? 'confirmed' : 
                                calBooking.status === 'PENDING' ? 'pending' : 'cancelled',
                        createdAt: Timestamp.fromDate(new Date()), // Cal.com bookings do not have Firestore Timestamp, set to null or undefined
                        duration: (calBooking.eventType as { length?: number; price?: number })?.length || 60,
                        revenue: (calBooking.eventType as { length?: number; price?: number })?.price || 0,
                        isCalComBooking: true,
                        calComBookingId: calBooking.id,
                        calComEventType: calBooking.eventType,
                        calComAttendees: calBooking.attendees,
                        // Add new fields for enhanced booking data
                        day: '', // Cal.com doesn't have day field
                        meetLink: '',
                        eventId: calBooking.id,
                        bookingMethod: 'calcom',
                        // Add generated profile detection
                        isGeneratedMentor: false, // Will be set below
                        isGeneratedMentee: false, // Will be set below
                      } as Booking;
                    });
                  } catch (error) {
                    console.error(`Error fetching Cal.com bookings for mentor ${userDoc.id}:`, error);
                    return [];
                  }
                })();
                mentorPromises.push(mentorPromise);
              }
            }
          } catch (error) {
            console.error(`Error checking mentor program for user ${userDoc.id}:`, error);
          }
        }
        
        const calComResults = await Promise.all(mentorPromises);
        const allCalComBookings = calComResults.flat();
        results.push(...allCalComBookings);
      } catch (error) {
        console.error('Error fetching Cal.com bookings:', error);
        // Continue with Firestore bookings only
      }

      // Now enrich all bookings with generated profile information
      const enrichedBookings = await Promise.all(
        results.map(async (booking) => {
          try {
            // Check if mentor is generated by looking at the actual profile data
            let isGeneratedMentor = false;
            try {
              // First check if it's a generated mentor by looking in the Generated Mentors collection
              const generatedMentorDoc = await getDoc(doc(firestore, 'Generated Mentors', booking.mentorId));
              if (generatedMentorDoc.exists()) {
                console.log(`Mentor ${booking.mentorId} found in Generated Mentors collection`);
                isGeneratedMentor = true;
              } else {
                // If not in generated collection, check if it's a real user profile
                const mentorProfileDoc = await getDoc(doc(firestore, 'users', booking.mentorId, 'mentorProgram', 'profile'));
                if (mentorProfileDoc.exists()) {
                  const mentorData = mentorProfileDoc.data();
                  // Check if the profile has the isGenerated flag set to true
                  isGeneratedMentor = mentorData.isGenerated === true;
                  console.log(`Mentor ${booking.mentorId} profile data:`, { 
                    isGenerated: mentorData.isGenerated, 
                    name: mentorData.name,
                    type: mentorData.type 
                  });
                } else {
                  console.log(`Mentor ${booking.mentorId} not found in any collection`);
                }
              }
            } catch (error) {
              console.error(`Error checking mentor profile for ${booking.mentorId}:`, error);
              isGeneratedMentor = false;
            }

            // Check if mentee is generated by looking at the actual profile data
            let isGeneratedMentee = false;
            try {
              // First check if it's a generated mentee by looking in the Generated Mentees collection
              const generatedMenteeDoc = await getDoc(doc(firestore, 'Generated Mentees', booking.menteeId));
              if (generatedMenteeDoc.exists()) {
                console.log(`Mentee ${booking.menteeId} found in Generated Mentees collection`);
                isGeneratedMentee = true;
              } else {
                // If not in generated collection, check if it's a real user profile
                const menteeProfileDoc = await getDoc(doc(firestore, 'users', booking.menteeId, 'mentorProgram', 'profile'));
                if (menteeProfileDoc.exists()) {
                  const menteeData = menteeProfileDoc.data();
                  // Check if the profile has the isGenerated flag set to true
                  isGeneratedMentee = menteeData.isGenerated === true;
                  console.log(`Mentee ${booking.menteeId} profile data:`, { 
                    isGenerated: menteeData.isGenerated, 
                    name: menteeData.name,
                    type: menteeData.type 
                  });
                } else {
                  console.log(`Mentee ${booking.menteeId} not found in any collection`);
                }
              }
            } catch (error) {
              console.error(`Error checking mentee profile for ${booking.menteeId}:`, error);
              isGeneratedMentee = false;
            }

            console.log(`Booking ${booking.id} enriched:`, { 
              mentorId: booking.mentorId, 
              menteeId: booking.menteeId,
              isGeneratedMentor, 
              isGeneratedMentee 
            });

            return {
              ...booking,
              isGeneratedMentor,
              isGeneratedMentee,
            };
          } catch (error) {
            console.error(`Error enriching booking ${booking.id}:`, error);
            return {
              ...booking,
              isGeneratedMentor: false,
              isGeneratedMentee: false,
            };
          }
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookingsError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch availability data when tab is switched to 'availability'
  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      // Get all users and check their mentorProgram subcollections (new structure)
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
      
      // Fetch generated mentors from "Generated Mentors" collection
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          usersData.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees from "Generated Mentees" collection
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          usersData.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
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
       
       // Also fetch availability data from Generated Availability collection
       try {
         const generatedAvailabilitySnapshot = await getDocs(collection(firestore, 'Generated Availability'));
         generatedAvailabilitySnapshot.docs.forEach(doc => {
           const generatedAvailabilityData = doc.data();
           const generatedAvailability: MentorAvailabilityWithProfile = {
             ...generatedAvailabilityData,
             mentorId: doc.id,
             mentorProfile: usersData.find(user => user.id === doc.id) || undefined,
             timeSlots: generatedAvailabilityData.timeSlots || [],
             lastUpdated: generatedAvailabilityData.lastUpdated
               ? (isFirestoreTimestamp(generatedAvailabilityData.lastUpdated)
                   ? generatedAvailabilityData.lastUpdated.toDate()
                   : new Date(generatedAvailabilityData.lastUpdated))
               : new Date()
           };
           allAvailabilityData.push(generatedAvailability);
         });
       } catch (error) {
         console.error('Error fetching generated availability:', error);
       }
       
       // Fetch mentor profiles and Cal.com availability to enrich the data
       const enrichedData = await Promise.all(
         allAvailabilityData.map(async (availability) => {
          try {
            // Fetch mentor profile from the new structure
            let mentorProfile: MentorMenteeProfile | undefined;
            
            // Try to get from users/{uid}/mentorProgram/profile first
            try {
              const mentorDoc = await getDoc(doc(firestore, 'users', availability.mentorId, 'mentorProgram', 'profile'));
              if (mentorDoc.exists()) {
                mentorProfile = mentorDoc.data() as MentorMenteeProfile;
              }
            } catch {
              // If that fails, try the old structure
              try {
                const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', availability.mentorId));
                if (mentorDoc.exists()) {
                  mentorProfile = mentorDoc.data() as MentorMenteeProfile;
                }
              } catch (oldError) {
                console.error(`Error fetching mentor profile for ${availability.mentorId}:`, oldError);
              }
            }
            
            if (mentorProfile) {
              availability.mentorProfile = mentorProfile;
            }
            
            // Check if mentor has Cal.com integration
            const hasCalComApiKey = await CalComTokenManager.hasApiKey(availability.mentorId);
            availability.hasCalComIntegration = hasCalComApiKey;
            
            // Fetch Cal.com availability if mentor has integration
            if (hasCalComApiKey) {
              try {
                // Get availability for next 7 days
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                
                const dateFrom = today.toISOString().split('T')[0];
                const dateTo = nextWeek.toISOString().split('T')[0];
                
                const calComAvailability = await CalComService.getAvailability(
                  availability.mentorId,
                  dateFrom,
                  dateTo
                );
                
                availability.calComAvailability = calComAvailability;
              } catch (calComError) {
                console.error(`Error fetching Cal.com availability for mentor ${availability.mentorId}:`, calComError);
                // Don't fail the entire request if Cal.com fails
              }
            }
          } catch (err) {
            console.error(`Error fetching mentor profile for ${availability.mentorId}:`, err);
          }
          return availability;
        })
      );
      
      setAvailabilityData(enrichedData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailabilityError('Failed to load availability data');
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Only fetch bookings when tab is switched to 'bookings'
  useEffect(() => {
    if (tab === 'bookings') {
      fetchBookings();
    }
  }, [tab]);

  // Only fetch availability when tab is switched to 'availability'
  useEffect(() => {
    if (tab === 'availability') {
      fetchAvailability();
    }
  }, [tab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = async (user: MentorMenteeProfileWithId) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${user.name} (${user.type})? This will also remove all their availability data and bookings. This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      // Delete the user profile - check if it's generated or real
      if (user.isGenerated) {
        // Delete from Generated Mentors or Generated Mentees collection
        const collectionName = user.isMentor ? 'Generated Mentors' : 'Generated Mentees';
        await deleteDoc(doc(firestore, collectionName, user.id));
        
        // Delete from Generated Availability collection if it exists
        try {
          await deleteDoc(doc(firestore, 'Generated Availability', user.id));
        } catch (error) {
          // Ignore if it doesn't exist
          console.log(`No availability data found for generated profile ${user.id}`);
        }
      } else {
        // Delete from users collection subcollection
        await deleteDoc(doc(firestore, 'users', user.id, 'mentorProgram', 'profile'));
        
        // Delete all availability data for this user from subcollections
        try {
          await deleteDoc(doc(firestore, 'users', user.id, 'availabilities', 'default'));
        } catch (error) {
          // Ignore if it doesn't exist
          console.log(`No availability data found for user ${user.id}`);
        }
      }
      
      // Delete all bookings for this user (as mentor or mentee)
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', user.id)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingDeletions = bookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(bookingDeletions);
      
      // Also check if they're a mentee in any bookings
      const menteeBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('menteeId', '==', user.id)
      );
      const menteeBookingsSnapshot = await getDocs(menteeBookingsQuery);
      const menteeBookingDeletions = menteeBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(menteeBookingDeletions);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteStatus(`Deleted ${user.name} and all related data successfully.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteStatus('Failed to delete user and related data.');
    }
  };

  const handleEditUser = (user: MentorMenteeProfileWithId) => {
    setEditUser(user);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedUser: MentorMenteeProfile) => {
    if (!editUser) return;
    setDeleteStatus(null);
    try {
      // Update Firestore
      await setDoc(doc(firestore, 'users', editUser.id, 'mentorProgram', 'profile'), updatedUser);
      // Update local state
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...updatedUser, id: editUser.id } : u));
      setEditModalOpen(false);
      setEditUser(null);
      setDeleteStatus(`Updated ${updatedUser.name} successfully.`);
    } catch {
      setDeleteStatus('Failed to update user.');
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected user(s)? This will also remove all their availability data and bookings. This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      // Get the user objects to check if they're generated
      const selectedUsers = users.filter(u => selectedIds.includes(u.id));
      
      // Separate generated and real users
      const generatedUsers = selectedUsers.filter(u => u.isGenerated);
      const realUsers = selectedUsers.filter(u => !u.isGenerated);
      
      // Delete generated profiles from their respective collections
      const generatedProfileDeletions = generatedUsers.map(user => {
        const collectionName = user.isMentor ? 'Generated Mentors' : 'Generated Mentees';
        return deleteDoc(doc(firestore, collectionName, user.id));
      });
      await Promise.all(generatedProfileDeletions);
      
      // Delete generated availability data
      const generatedAvailabilityDeletions = generatedUsers.map(user => 
        deleteDoc(doc(firestore, 'Generated Availability', user.id)).catch(error => {
          // Ignore if it doesn't exist
          console.log(`No availability data found for generated profile ${user.id}`);
        })
      );
      await Promise.all(generatedAvailabilityDeletions);
      
      // Delete real user profiles from users collection
      const realProfileDeletions = realUsers.map(user => 
        deleteDoc(doc(firestore, 'users', user.id, 'mentorProgram', 'profile'))
      );
      await Promise.all(realProfileDeletions);
      
      // Delete all availability data for real users from subcollections
      const realAvailabilityDeletions = realUsers.map(user => 
        deleteDoc(doc(firestore, 'users', user.id, 'availabilities', 'default')).catch(error => {
          // Ignore if it doesn't exist
          console.log(`No availability data found for user ${user.id}`);
        })
      );
      await Promise.all(realAvailabilityDeletions);
      
      // Delete all bookings for these users (as mentors or mentees)
      // Firebase 'in' queries are limited to 10 items, so we need to batch them
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Delete mentor bookings in batches
      for (const batch of batches) {
        const mentorBookingsQuery = query(
          collection(firestore, 'bookings'),
          where('mentorId', 'in', batch)
        );
        const mentorBookingsSnapshot = await getDocs(mentorBookingsQuery);
        const mentorBookingDeletions = mentorBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(mentorBookingDeletions);
      }
      
      // Delete mentee bookings in batches
      for (const batch of batches) {
        const menteeBookingsQuery = query(
          collection(firestore, 'bookings'),
          where('menteeId', 'in', batch)
        );
        const menteeBookingsSnapshot = await getDocs(menteeBookingsQuery);
        const menteeBookingDeletions = menteeBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(menteeBookingDeletions);
      }
      
      // Save count before clearing
      const deletedCount = selectedIds.length;
      
      // Update local state
      setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      setDeleteStatus(`Deleted ${deletedCount} user(s) and all related data successfully.`);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      setDeleteStatus('Failed to delete selected users and related data.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
      const matchesGenerated = userGeneratedFilter === 'all' || 
        (userGeneratedFilter === 'generated' && user.isGenerated) ||
        (userGeneratedFilter === 'real' && !user.isGenerated);
      const s = userSearch.toLowerCase();
      const matchesSearch =
        s === '' ||
        (getName(user).toLowerCase() ?? '').includes(s) ||
        (user.email?.toLowerCase() ?? '').includes(s) ||
        (user.profession?.toLowerCase() ?? '').includes(s);
      return matchesType && matchesGenerated && matchesSearch;
    });
  }, [users, userTypeFilter, userGeneratedFilter, userSearch]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let vA: string | undefined, vB: string | undefined;
      if (userSortField === 'name') {
        vA = getName(a).toLowerCase(); vB = getName(b).toLowerCase();
      } else if (userSortField === 'type') {
        vA = a.type as string; vB = b.type as string;
      } else if (userSortField === 'email') {
        vA = a.email?.toLowerCase(); vB = b.email?.toLowerCase();
      } else if (userSortField === 'profession') {
        vA = a.profession?.toLowerCase(); vB = b.profession?.toLowerCase();
      } else if (userSortField === 'education') {
        vA = a.educationLevel; vB = b.educationLevel;
      } else if (userSortField === 'county') {
        vA = a.county; vB = b.county;
      }
      if (vA === undefined || vB === undefined) return 0;
      return userSortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });
  }, [filteredUsers, userSortField, userSortDir]);

  // Filter and sort availability data
  const filteredAvailability = useMemo(() => {
    return availabilityData.filter(availability => {
      const mentorName = availability.mentorProfile ? getName(availability.mentorProfile).toLowerCase() : ''
      const mentorEmail = availability.mentorProfile?.email?.toLowerCase() || '';
      const searchTerm = availabilitySearch.toLowerCase();
      
      // Filter by search term
      if (searchTerm && !mentorName.includes(searchTerm) && !mentorEmail.includes(searchTerm)) {
        return false;
      }
      
      // Filter by status
      if (availabilityStatusFilter !== 'all') {
        const hasMatchingStatus = availability.timeSlots.some(slot => 
          availabilityStatusFilter === 'available' ? slot.isAvailable : !slot.isAvailable
        );
        if (!hasMatchingStatus) return false;
      }
      
      // Filter by type
      if (availabilityTypeFilter !== 'all') {
        const hasMatchingType = availability.timeSlots.some(slot => slot.type === availabilityTypeFilter);
        if (!hasMatchingType) return false;
      }
      
      return true;
    });
  }, [availabilityData, availabilitySearch, availabilityStatusFilter, availabilityTypeFilter]);

  // Filter and sort bookings data
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const extendedBooking = booking as ExtendedBooking;
      
      // Filter by generated profile status
      if (bookingGeneratedFilter !== 'all') {
        const hasGeneratedProfile = extendedBooking.isGeneratedMentor || extendedBooking.isGeneratedMentee;
        if (bookingGeneratedFilter === 'generated' && !hasGeneratedProfile) return false;
        if (bookingGeneratedFilter === 'real' && hasGeneratedProfile) return false;
      }
      
      // Filter by booking method (only Cal.com bookings now - internal system removed)
      // Only show Cal.com bookings
      if (!extendedBooking.isCalComBooking) return false;
      
      if (bookingMethodFilter !== 'all') {
        const method = extendedBooking.bookingMethod || 'calcom';
        if (method !== bookingMethodFilter) return false;
      }
      
      return true;
    });
  }, [bookings, bookingGeneratedFilter, bookingMethodFilter]);

  // Admin action handlers
  const handleDeleteBooking = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(firestore, 'bookings', booking.id));
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateBookingStatus = async (booking: Booking, status: 'confirmed' | 'cancelled') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), { status });
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions for availability display
  const getMentorName = (availability: MentorAvailabilityWithProfile) => {
    return getDisplayName(availability.mentorProfile, availability.mentorId)
  };

  const getMentorEmail = (availability: MentorAvailabilityWithProfile) => {
    return availability.mentorProfile?.email || 'No email';
  };

  const getTotalSlots = (availability: MentorAvailabilityWithProfile) => {
    return availability.timeSlots.length;
  };

  const getAvailableSlots = (availability: MentorAvailabilityWithProfile) => {
    return availability.timeSlots.filter(slot => slot.isAvailable).length;
  };

  const getBookedSlots = (availability: MentorAvailabilityWithProfile) => {
    return availability.timeSlots.filter(slot => !slot.isAvailable).length;
  };

  // Cal.com availability helper functions
  const getCalComTotalSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => total + day.slots.length, 0);
  };

  const getCalComAvailableSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => 
      total + day.slots.filter(slot => slot.available).length, 0);
  };

  const getCalComBookedSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => 
      total + day.slots.filter(slot => !slot.available).length, 0);
  };

  // Function to wipe all availability data from the database
  const handleWipeAllAvailability = async () => {
    const confirmed = window.confirm(
      'DANGER: WIPE ALL AVAILABILITY DATA\n\n' +
      'This will permanently delete ALL availability data from the database!\n\n' +
      'This includes:\n' +
      '• All mentor time slots\n' +
      '• All recurring availability patterns\n' +
      '• All specific date availability\n' +
      '• All availability history\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to proceed?\n\n' +
      'Type "WIPE" to confirm:'
    );
    
    if (!confirmed) return;
    
    // Additional confirmation - user must type "WIPE"
    const userInput = prompt('To confirm deletion, please type "WIPE" (case-sensitive):');
    if (userInput !== 'WIPE') {
      alert('Deletion cancelled. You did not type "WIPE" correctly.');
      return;
    }
    
    try {
      // Get all users and check their mentorProgram subcollections to find mentors
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      let deletedCount = 0;
      
      // Delete availability from each mentor's subcollection
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            if (userData.isMentor) {
              try {
                await deleteDoc(doc(firestore, 'users', userDoc.id, 'availabilities', 'default'));
                deletedCount++;
              } catch (error) {
                console.error(`Error deleting availability for user ${userDoc.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error checking mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Refresh the availability data
      await fetchAvailability();
      
      alert(`SUCCESS: Wiped availability data for ${deletedCount} mentors from the database!\n\nAll mentor availability data has been permanently removed.`);
    } catch (error) {
      console.error('Error wiping availability data:', error);
      alert('Error deleting availability data. Please check the console for details.');
    }
  };

  // Function to generate availability for generated profiles only
  const generateAvailabilityForGeneratedProfiles = async () => {
    try {
      setActionLoading(true);
      
      // Get all generated profiles
      const generatedProfiles: MentorMenteeProfileWithId[] = [];
      
      // Fetch generated mentors
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          generatedProfiles.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          generatedProfiles.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
      }
      
      // Filter only generated mentors (since only mentors need availability)
      const generatedMentors = generatedProfiles.filter(profile => profile.isMentor);
      
      if (generatedMentors.length === 0) {
        alert('No generated mentor profiles found to generate availability for.');
        return;
      }
      
      let generatedCount = 0;
      
      // Generate availability for each generated mentor
      for (const mentor of generatedMentors) {
        try {
          // Create a unique ID for the generated profile
          const mentorId = mentor.id || `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Generate random availability data
          const availabilityData = {
            mentorId: mentorId,
            timeSlots: generateRandomTimeSlots(mentorId),
            lastUpdated: new Date()
          };
          
          // Store availability in the generated profile's subcollection
          // Since these are generated profiles, we'll store them in a special collection
          await setDoc(doc(firestore, 'Generated Availability', mentorId), availabilityData);
          
          generatedCount++;
        } catch (error) {
          console.error(`Error generating availability for generated mentor ${mentor.id}:`, error);
        }
      }
      
      // Refresh availability data
      await fetchAvailability();
      
      alert(`SUCCESS: Generated availability data for ${generatedCount} generated mentor profiles!`);
    } catch (error) {
      console.error('Error generating availability for generated profiles:', error);
      alert('Error generating availability data. Please check the console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to generate random time slots
  const generateRandomTimeSlots = (mentorId: string) => {
    const timeSlots: TimeSlot[] = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Generate recurring availability for weekdays
    for (let i = 0; i < 5; i++) {
      const day = days[i];
      const startHour = 9 + Math.floor(Math.random() * 4); // 9 AM to 1 PM
      const endHour = startHour + 2 + Math.floor(Math.random() * 4); // 2-6 hour slots
      
      timeSlots.push({
        id: `${mentorId}-${day}-recurring`,
        day: day,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        isAvailable: Math.random() > 0.3, // 70% chance of being available
        type: 'recurring'
      });
    }
    
    // Generate some specific date availability for the next 2 weeks
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        const startHour = 10 + Math.floor(Math.random() * 6); // 10 AM to 4 PM
        const endHour = startHour + 1 + Math.floor(Math.random() * 3); // 1-4 hour slots
        
        timeSlots.push({
          id: `${mentorId}-${date.toISOString().split('T')[0]}-specific`,
          date: date.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          isAvailable: Math.random() > 0.4, // 60% chance of being available
          type: 'specific'
        });
      }
    }
    
    return timeSlots;
  };

  // Function to clear availability for generated profiles only
  const clearGeneratedProfileAvailability = async () => {
    const confirmed = window.confirm(
      'Clear Availability for Generated Profiles\n\n' +
      'This will delete availability data for ALL generated profiles only.\n\n' +
      'Real user profiles will not be affected.\n\n' +
      'Are you sure you want to proceed?'
    );
    
    if (!confirmed) return;
    
    try {
      setActionLoading(true);
      
      // Delete all documents from the Generated Availability collection
      const generatedAvailabilitySnapshot = await getDocs(collection(firestore, 'Generated Availability'));
      const deletePromises = generatedAvailabilitySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Refresh availability data
      await fetchAvailability();
      
      alert(`SUCCESS: Cleared availability data for ${generatedAvailabilitySnapshot.docs.length} generated profiles!`);
    } catch (error) {
      console.error('Error clearing generated profile availability:', error);
      alert('Error clearing availability data. Please check the console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Booking statistics helper functions
  const getBookingStats = () => {
    // Only count Cal.com bookings (internal booking system removed)
    const calComBookings = bookings.filter(b => b.isCalComBooking);
    const totalBookings = calComBookings.length;
    const confirmedBookings = calComBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = calComBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = calComBookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = calComBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);
    const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    
    // Get unique mentors and mentees
    const uniqueMentors = new Set(bookings.map(b => b.mentorId)).size;
    const uniqueMentees = new Set(bookings.map(b => b.menteeId)).size;
    
    // Get today's bookings
    const today = new Date();
    const todayBookings = bookings.filter(b => {
      const bookingDate =
        b.sessionDate instanceof Date
          ? b.sessionDate
          : isFirestoreTimestamp(b.sessionDate)
          ? b.sessionDate.toDate()
          : b.sessionDate
          ? new Date(b.sessionDate)
          : new Date('');
      return bookingDate.toDateString() === today.toDateString();
    }).length;
    
    // Get this week's bookings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const thisWeekBookings = bookings.filter(b => {
      const bookingDate =
        b.sessionDate instanceof Date
          ? b.sessionDate
          : isFirestoreTimestamp(b.sessionDate)
          ? b.sessionDate.toDate()
          : b.sessionDate
          ? new Date(b.sessionDate)
          : new Date('');
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      calComBookings: totalBookings, // All bookings are Cal.com now
      totalRevenue,
      completionRate,
      uniqueMentors,
      uniqueMentees,
      todayBookings,
      thisWeekBookings
    };
  };

  if (loading) {
    return <div className="mentor-management-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="mentor-management-error">{error}</div>;
  }

  return (
    <div className="mentor-management">
      {/* Tab Switcher */}
      <div className="mentor-management-tabs">
        <button className={`tab-button ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <FaUser className="tab-icon" />
          Users
        </button>
        <button className={`tab-button ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>
          <FaCalendarAlt className="tab-icon" />
          Bookings
        </button>
        <button className={`tab-button ${tab === 'availability' ? 'active' : ''}`} onClick={() => setTab('availability')}>
          <FaClock className="tab-icon" />
          Availability
        </button>
        <button className={`tab-button ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
          <FaChartBar className="tab-icon" />
          Analytics
        </button>
      </div>
      
      {/* USERS TAB */}
      {tab === 'users' && (
        <>
          <div className="mentor-management-header">
            <h2>Mentor Program Management</h2>
            <div className="mentor-management-controls">
              {/* In the users tab, add search and filter controls above the table */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name, email, or profession..." style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} />
                <select value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value as 'all' | 'mentor' | 'mentee')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Types</option>
                  <option value="mentor">Mentor</option>
                  <option value="mentee">Mentee</option>
                </select>
                <select value={userGeneratedFilter} onChange={e => setUserGeneratedFilter(e.target.value as 'all' | 'generated' | 'real')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Profiles</option>
                  <option value="real">Real Profiles</option>
                  <option value="generated">Generated Profiles</option>
                </select>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  🎲 = Generated Profile
                </div>
              </div>
              <div className="mentor-management-filters">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={filter === 'mentor' ? 'active' : ''}
                  onClick={() => setFilter('mentor')}
                >
                  Mentors
                </button>
                <button
                  className={filter === 'mentee' ? 'active' : ''}
                  onClick={() => setFilter('mentee')}
                >
                  Mentees
                </button>
                <button
                  className="refresh-button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <FaSync className={refreshing ? 'spinning' : ''} /> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="mentor-management-stats">
            <div className="stat-card" onMouseEnter={() => setHoveredTile('total')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Total Users</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'total' ? ' stat-hidden' : ''}`}>
                  <p>{users.length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'total' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realUsers.length}</span>
                  <span className="stat-generated">Generated: {generatedUsers.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentors')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentors</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentors' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.isMentor).length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentors' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentors.length}</span>
                  <span className="stat-generated">Generated: {generatedMentors.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentees')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentees</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentees' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.isMentee).length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentees' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentees.length}</span>
                  <span className="stat-generated">Generated: {generatedMentees.length}</span>
                </div>
              </div>
            </div>
          </div>

          <GenerateRandomProfile />

          {/* Profile Source Summary */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '1px solid #2a2a3e'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px' }}>📊 Profile Source Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ 
                background: 'rgba(0, 200, 255, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(0, 200, 255, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Real Profiles</div>
                <div style={{ color: '#00c8ff', fontSize: '24px', fontWeight: 'bold' }}>{realUsers.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {realMentors.length} mentors, {realMentees.length} mentees
                </div>
              </div>
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎲</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Generated Profiles</div>
                <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>{generatedUsers.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {generatedMentors.length} mentors, {generatedMentees.length} mentees
                </div>
              </div>
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Total</div>
                <div style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}>{users.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {users.filter(u => u.isMentor).length} mentors, {users.filter(u => u.isMentee).length} mentees
                </div>
              </div>
            </div>
          </div>

          {deleteStatus && (
            <div className={deleteStatus.startsWith('Deleted') ? 'mentor-management-success' : 'mentor-management-error'} style={{ marginBottom: '1rem' }}>
              {deleteStatus}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#ff2a2a', fontWeight: 600 }}>{selectedIds.length} selected</span>
              <button className="delete-profile" onClick={handleBulkDelete} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a', fontWeight: 600 }}>
                Delete Selected
              </button>
            </div>
          )}

          <div className="mentor-management-table">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} /></th>
                  <th onClick={() => { setUserSortField('name'); setUserSortDir(userSortField === 'name' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Name {userSortField === 'name' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('type'); setUserSortDir(userSortField === 'type' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Type {userSortField === 'type' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('email'); setUserSortDir(userSortField === 'email' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Email {userSortField === 'email' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('profession'); setUserSortDir(userSortField === 'profession' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Profession {userSortField === 'profession' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('education'); setUserSortDir(userSortField === 'education' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Education {userSortField === 'education' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('county'); setUserSortDir(userSortField === 'county' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>County {userSortField === 'county' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th>Skills</th>
                  <th>Looking For</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}
                    style={user.isGenerated ? { background: 'rgba(0, 200, 255, 0.10)' } : {}}
                  >
                    <td><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectRow(user.id)} /></td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">
                          {getName(user)}
                          {user.isGenerated && (
                            <span className="generated-badge" title="Generated Profile">
                              🎲
                            </span>
                          )}
                        </span>
                        <span className="user-age">{user.age} years</span>
                      </div>
                    </td>
                    <td>
                      <span className={`user-type ${user.isMentor ? 'mentor' : 'mentee'}`}>
                        {user.isMentor ? 'Mentor' : 'Mentee'}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <div className="profession-info">
                        <span className="profession">{user.profession}</span>
                        {user.pastProfessions.length > 0 && (
                          <span className="past-professions">
                            {user.pastProfessions.length} past roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="education-info">
                        <span className="degree">{user.degree}</span>
                        <span className="education-level">{user.educationLevel}</span>
                      </div>
                    </td>
                    <td>{user.county}</td>
                    <td>
                      <div className="skills-list">
                        {user.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="more-skills">+{user.skills.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="looking-for-list">
                        {user.lookingFor.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.lookingFor.length > 3 && (
                          <span className="more-skills">+{user.lookingFor.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-profile" onClick={() => { setModalUser(user); setModalOpen(true); }}>View Profile</button>
                        <button className="edit-profile" onClick={() => handleEditUser(user)}>Edit</button>
                        <button className="delete-profile" onClick={() => handleDeleteUser(user)} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminMentorModal open={modalOpen} onClose={() => setModalOpen(false)} user={modalUser} mode="view" />
          <AdminMentorModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditUser(null); }} user={editUser} mode="edit" onSave={handleSaveEdit} />
        </>
      )}
      
      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div>
          {/* Booking Statistics Tiles */}
          {!loadingBookings && !bookingsError && (
            <div className="mentor-management-stats" style={{ marginBottom: 24 }}>
              {(() => {
                const stats = getBookingStats();
                return (
                  <>
                    <div className="stat-card">
                      <h3>Total Bookings</h3>
                      <p>{stats.totalBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Confirmed</h3>
                      <p style={{ color: '#00e676' }}>{stats.confirmedBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Pending</h3>
                      <p style={{ color: '#ffb300' }}>{stats.pendingBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Cancelled</h3>
                      <p style={{ color: '#ff4444' }}>{stats.cancelledBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Completion Rate</h3>
                      <p style={{ color: '#00e676' }}>{stats.completionRate.toFixed(1)}%</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Revenue</h3>
                      <p style={{ color: '#00e676' }}>£{stats.totalRevenue}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Cal.com Bookings</h3>
                      <p style={{ color: '#00eaff' }}>{stats.calComBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active Mentors</h3>
                      <p style={{ color: '#ffb300' }}>{stats.uniqueMentors}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active Mentees</h3>
                      <p style={{ color: '#00e676' }}>{stats.uniqueMentees}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Today's Bookings</h3>
                      <p style={{ color: '#00eaff' }}>{stats.todayBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>This Week</h3>
                      <p style={{ color: '#ffb300' }}>{stats.thisWeekBookings}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          {/* Bookings View Mode Switch */}
          <div className="view-toggle-buttons">
            <button className={bookingsView === 'table' ? 'active' : ''} onClick={() => setBookingsView('table')}>Table View</button>
            <button className={bookingsView === 'grouped' ? 'active' : ''} onClick={() => setBookingsView('grouped')}>Grouped View</button>
            {bookingsView === 'grouped' && (
              <select value={groupBy} onChange={e => setGroupBy(e.target.value as 'mentor' | 'mentee')} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8 }}>
                <option value="mentor">Group by Mentor</option>
                <option value="mentee">Group by Mentee</option>
              </select>
            )}
          </div>
          
          {/* New Booking Filters */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <select 
              value={bookingGeneratedFilter} 
              onChange={e => setBookingGeneratedFilter(e.target.value as 'all' | 'generated' | 'real')} 
              style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
            >
              <option value="all">All Profiles</option>
              <option value="real">Real Profiles Only</option>
              <option value="generated">Generated Profiles Only</option>
            </select>
            <select 
              value={bookingMethodFilter} 
              onChange={e => setBookingMethodFilter(e.target.value as 'all' | 'calcom')} 
              style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
            >
              <option value="all">All Bookings</option>
              <option value="calcom">Cal.com Bookings Only</option>
            </select>
            <div style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
              🎲 = Generated Profile | 📅 = Cal.com
            </div>
          </div>
          
          {/* Bookings Content */}
          {loadingBookings ? (
            <div className="mentor-management-loading">Loading bookings...</div>
          ) : bookingsError ? (
            <div className="mentor-management-error">{bookingsError}</div>
          ) : bookingsView === 'table' ? (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsTable bookings={filteredBookings} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          ) : (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsGrouped bookings={filteredBookings} groupBy={groupBy} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          )}
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {tab === 'availability' && (
        <div>
          <div className="mentor-management-header">
            <h2>Mentor Availability Management</h2>
            <div className="mentor-management-controls">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <input 
                  value={availabilitySearch} 
                  onChange={e => setAvailabilitySearch(e.target.value)} 
                  placeholder="Search mentor name or email..." 
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} 
                />
                <select 
                  value={availabilityStatusFilter} 
                  onChange={e => setAvailabilityStatusFilter(e.target.value as 'all' | 'available' | 'booked')} 
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                </select>
                <select 
                  value={availabilityTypeFilter} 
                  onChange={e => setAvailabilityTypeFilter(e.target.value as 'all' | 'recurring' | 'specific')} 
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
                >
                  <option value="all">All Types</option>
                  <option value="recurring">Recurring</option>
                  <option value="specific">One-off</option>
                </select>
                <button
                  className="refresh-button"
                  onClick={fetchAvailability}
                  disabled={loadingAvailability}
                >
                  <FaSync className={loadingAvailability ? 'spinning' : ''} /> Refresh
                </button>
                                 <button
                   className="refresh-button"
                   onClick={handleWipeAllAvailability}
                   disabled={loadingAvailability}
                   style={{ background: '#ff2a2a', color: '#fff', border: '1.5px solid #ff2a2a' }}
                 >
                   🗑️ Wipe All Availability
                 </button>
                 <button
                   className="refresh-button"
                   onClick={generateAvailabilityForGeneratedProfiles}
                   disabled={loadingAvailability || actionLoading}
                   style={{ background: '#00e676', color: '#181818', border: '1.5px solid #00e676' }}
                 >
                   🎲 Generate Generated Profile Availability
                 </button>
                 <button
                   className="refresh-button"
                   onClick={clearGeneratedProfileAvailability}
                   disabled={loadingAvailability || actionLoading}
                   style={{ background: '#ff6b35', color: '#fff', border: '1.5px solid #ff6b35' }}
                 >
                   🧹 Clear Generated Profile Availability
                 </button>
              </div>
            </div>
          </div>

          {/* Availability Stats */}
          <div className="mentor-management-stats">
            <div className="stat-card">
              <h3>Total Mentors with Availability</h3>
              <p>{filteredAvailability.length}</p>
            </div>
            <div className="stat-card">
              <h3>Internal Time Slots</h3>
              <p>{filteredAvailability.reduce((total, availability) => total + getTotalSlots(availability), 0)}</p>
            </div>
            <div className="stat-card">
              <h3>Cal.com Time Slots</h3>
              <p>{filteredAvailability.reduce((total, availability) => total + getCalComTotalSlots(availability), 0)}</p>
            </div>
            <div className="stat-card">
              <h3>Cal.com Integration</h3>
              <p>{filteredAvailability.filter(availability => availability.hasCalComIntegration).length}</p>
            </div>
          </div>

          {/* Availability Content */}
          {loadingAvailability ? (
            <div className="mentor-management-loading">Loading availability data...</div>
          ) : availabilityError ? (
            <div className="mentor-management-error">{availabilityError}</div>
          ) : (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <table className="admin-bookings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Email</th>
                    <th>Internal Slots</th>
                    <th>Internal Available</th>
                    <th>Internal Booked</th>
                    <th>Cal.com Integration</th>
                    <th>Cal.com Slots</th>
                    <th>Cal.com Available</th>
                    <th>Cal.com Booked</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvailability.map((availability) => (
                    <tr key={availability.mentorId} style={{ transition: 'background 0.18s', cursor: 'pointer' }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td>
                        <div className="user-info">
                          <span className="user-name">{getMentorName(availability)}</span>
                          {availability.mentorProfile?.profession && (
                            <span className="user-age">{availability.mentorProfile.profession}</span>
                          )}
                        </div>
                      </td>
                      <td>{getMentorEmail(availability)}</td>
                      <td>
                        <span style={{ background: '#ffb300', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getTotalSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#00e676', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getAvailableSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#ff4444', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getBookedSlots(availability)}
                        </span>
                      </td>
                      <td>
                        {availability.hasCalComIntegration ? (
                          <span style={{ background: '#00eaff', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                            ✅ Connected
                          </span>
                        ) : (
                          <span style={{ background: '#666', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                            ❌ Not Connected
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ background: '#00eaff', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComTotalSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#00e676', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComAvailableSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#ff4444', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComBookedSlots(availability)}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const val = availability.lastUpdated;
                          if (!val) return '-';
                          if (isFirestoreTimestamp(val)) {
                            return val.toDate().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          if (val instanceof Date) {
                            return val.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          // Try to parse as string/number
                          const parsed = new Date(val);
                          if (!isNaN(parsed.getTime())) {
                            return parsed.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          return '-';
                        })()}
                      </td>
                      <td>
                        <button 
                          onClick={() => {
                            setSelectedAvailability(availability);
                            setDetailsModalOpen(true);
                          }} 
                          style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAvailability.length === 0 && (
                <div style={{ marginTop: 24, color: '#ffb300', textAlign: 'center' }}>
                  {availabilitySearch || availabilityStatusFilter !== 'all' || availabilityTypeFilter !== 'all' 
                    ? 'No availability data matches your filters.' 
                    : 'No availability data found.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {detailsModalOpen && selectedAvailability && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#181818', color: '#fff', borderRadius: 12, padding: '2.5rem 2.5rem', minWidth: 420, maxWidth: 700, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setDetailsModalOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 1rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Close</button>
            <h2 style={{ marginBottom: 8 }}>Availability Details</h2>
            <div><b>Mentor:</b> {getMentorName(selectedAvailability)} ({getMentorEmail(selectedAvailability)})</div>
            <div style={{ margin: '1rem 0 1.5rem 0', color: '#ffb300' }}>
              <b>Internal Slots:</b> {getTotalSlots(selectedAvailability)} | <b>Available:</b> {getAvailableSlots(selectedAvailability)} | <b>Booked:</b> {getBookedSlots(selectedAvailability)}
            </div>
            {selectedAvailability.hasCalComIntegration && (
              <div style={{ margin: '0 0 1.5rem 0', color: '#00eaff' }}>
                <b>Cal.com Integration:</b> ✅ Connected | <b>Cal.com Slots:</b> {getCalComTotalSlots(selectedAvailability)} | <b>Available:</b> {getCalComAvailableSlots(selectedAvailability)} | <b>Booked:</b> {getCalComBookedSlots(selectedAvailability)}
              </div>
            )}
            <table style={{ width: '100%', background: 'rgba(24,24,24,0.95)', borderRadius: 8, marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedAvailability.timeSlots.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 24 }}>No internal slots found.</td></tr>
                ) : selectedAvailability.timeSlots.map(slot => (
                  <tr key={slot.id} style={{ background: !slot.isAvailable ? 'rgba(255,68,68,0.07)' : undefined }}>
                    <td><span style={{ background: slot.type === 'recurring' ? '#00eaff' : '#ff6b35', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{slot.type === 'recurring' ? 'Recurring' : 'One-off'}</span></td>
                    <td>{slot.day || '-'}</td>
                    <td>{slot.date || '-'}</td>
                    <td>{slot.startTime} - {slot.endTime}</td>
                    <td><span style={{ background: slot.isAvailable ? '#00e676' : '#ff4444', color: slot.isAvailable ? '#181818' : '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{slot.isAvailable ? 'Available' : 'Booked'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Cal.com Availability Section */}
            {selectedAvailability.hasCalComIntegration && selectedAvailability.calComAvailability && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 12, color: '#00eaff' }}>Cal.com Availability (Next 7 Days)</h3>
                <table style={{ width: '100%', background: 'rgba(0,234,255,0.05)', borderRadius: 8, border: '1px solid #00eaff' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Event Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAvailability.calComAvailability.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>No Cal.com availability found.</td></tr>
                    ) : selectedAvailability.calComAvailability.map(day => 
                      day.slots.map(slot => (
                        <tr key={`${day.date}-${slot.time}`} style={{ background: !slot.available ? 'rgba(255,68,68,0.07)' : undefined }}>
                          <td>{new Date(day.date).toLocaleDateString('en-GB')}</td>
                          <td>{slot.time}</td>
                          <td>{slot.eventTypeTitle || 'General'}</td>
                          <td><span style={{ background: slot.available ? '#00e676' : '#ff4444', color: slot.available ? '#181818' : '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{slot.available ? 'Available' : 'Booked'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div>
          {loadingBookings ? (
            <div className="mentor-management-loading">Loading analytics data...</div>
          ) : bookingsError ? (
            <div className="mentor-management-error">{bookingsError}</div>
          ) : (
            <BookingAnalytics bookings={filteredBookings} />
          )}
        </div>
      )}
    </div>
  );
} 