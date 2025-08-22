import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CalComService } from '../../../components/widgets/MentorAlgorithm/CalCom/calComService';
import { getBestMatchesForUser } from '../../../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { 
  MentorMenteeProfile, 
  UserType, 
  MENTOR, 
  MENTEE,
  ProfileFormData,
  MentorAvailability,
  EnhancedAvailability,
  MentorBookings,
  ValidationErrors
} from './mentorTypes';

export const useMentorData = () => {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState<MentorMenteeProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorMenteeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentorAvailability, setMentorAvailability] = useState<MentorAvailability>({});
  const [enhancedAvailability, setEnhancedAvailability] = useState<EnhancedAvailability>({});
  const [mentorBookings, setMentorBookings] = useState<MentorBookings>({});
  const [hasProfile, setHasProfile] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<MentorMenteeProfile | null>(null);
  const [bestMatches, setBestMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const checkUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      const mentorDoc = await getDoc(doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile'));
      if (mentorDoc.exists()) {
        const profileData = mentorDoc.data() as MentorMenteeProfile;
        setCurrentUserProfile(profileData);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      setError('Failed to check user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      console.log('MentorPage: Starting to fetch mentors...');
      setError(null);
      
      if (!firestore) {
        throw new Error('Firebase database not initialized');
      }

      const usersQuery = query(collection(firestore, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const mentorsData: MentorMenteeProfile[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const mentorData = mentorProgramDoc.data() as MentorMenteeProfile;
            if (mentorData.type === 'mentor') {
              mentorsData.push({
                ...mentorData,
                id: userDoc.id
              } as MentorMenteeProfile);
            }
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      console.log('MentorPage: Found mentors:', mentorsData.length, mentorsData);
      
      setMentors(mentorsData);
      setFilteredMentors(mentorsData);
      
      await updateAllMentorAvailability();
    } catch (error) {
      console.error('MentorPage: Error fetching mentors:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch mentors');
    }
  };

  const checkMentorAvailability = async (mentor: MentorMenteeProfile) => {
    if (!mentor.calCom) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const availability = await CalComService.getAvailability(mentor.uid, today, tomorrow);
      
      const hasAvailabilityToday = availability.some(day => 
        day.date === today && day.slots.some(slot => slot.available)
      );
      
      let nextSlot = 'No availability';
      for (const day of availability) {
        const availableSlot = day.slots.find(slot => slot.available);
        if (availableSlot) {
          if (day.date === today) {
            nextSlot = 'Today';
          } else if (day.date === tomorrow) {
            nextSlot = 'Tomorrow';
          } else {
            nextSlot = 'This week';
          }
          break;
        }
      }
      
      return { available: hasAvailabilityToday, nextSlot };
    } catch (error) {
      console.error('Error checking availability for mentor:', mentor.uid, error);
      return { available: false, nextSlot: 'Unable to check' };
    }
  };

  const updateAllMentorAvailability = async () => {
    const availabilityPromises = mentors.map(async (mentor) => {
      const availability = await checkMentorAvailability(mentor);
      return { [mentor.uid]: availability };
    });
    
    const results = await Promise.all(availabilityPromises);
    const newAvailability = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    setMentorAvailability(newAvailability as MentorAvailability);
  };

  const fetchEnhancedAvailability = async (mentorId: string) => {
    try {
      const availabilityDoc = await getDoc(doc(firestore, 'users', mentorId, 'availabilities', 'default'));
      if (availabilityDoc.exists()) {
        const data = availabilityDoc.data();
        setEnhancedAvailability(prev => ({
          ...prev,
          [mentorId]: {
            timeSlots: data.timeSlots || []
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching enhanced availability:', error);
    }
  };

  const fetchMentorBookings = async (mentorId: string) => {
    try {
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', mentorId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          menteeName: data.menteeName || 'Unknown',
          sessionDate: data.sessionDate || '',
          startTime: data.startTime || '',
          status: data.status || 'unknown'
        };
      });
      
      setMentorBookings(prev => ({
        ...prev,
        [mentorId]: bookings
      }));
    } catch (error) {
      console.error('Error fetching mentor bookings:', error);
    }
  };

  const findMatches = async () => {
    if (!currentUser || !currentUserProfile) return;

    try {
      setLoadingMatches(true);
      const matches = await getBestMatchesForUser(currentUser.uid);
      setBestMatches(matches);
      setLoadingMatches(false);
      return matches;
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('Failed to find matches');
      setLoadingMatches(false);
      return [];
    }
  };

  const createProfile = async (profileData: any) => {
    if (!currentUser) return false;

    try {
      await setDoc(doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile'), profileData);
      setHasProfile(true);
      setCurrentUserProfile(profileData);
      await fetchMentors();
      return true;
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
      return false;
    }
  };

  const updateProfile = async (profileData: any) => {
    if (!currentUser) return false;

    try {
      await updateDoc(doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile'), profileData);
      setCurrentUserProfile(profileData);
      await fetchMentors();
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return false;
    }
  };

  const deleteProfile = async () => {
    if (!currentUser) return false;

    try {
      await deleteDoc(doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile'));
      setCurrentUserProfile(null);
      setHasProfile(false);
      setBestMatches([]);
      return true;
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
      return false;
    }
  };

  useEffect(() => {
    console.log('useMentorData: Component mounted, checking profile...');
    checkUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (hasProfile && currentUser) {
      fetchMentors();
    }
  }, [hasProfile, currentUser]);

  return {
    mentors,
    filteredMentors,
    setFilteredMentors,
    loading,
    error,
    setError,
    mentorAvailability,
    enhancedAvailability,
    mentorBookings,
    hasProfile,
    setHasProfile,
    currentUserProfile,
    setCurrentUserProfile,
    bestMatches,
    loadingMatches,
    checkUserProfile,
    fetchMentors,
    fetchEnhancedAvailability,
    fetchMentorBookings,
    findMatches,
    createProfile,
    updateProfile,
    deleteProfile
  };
};
