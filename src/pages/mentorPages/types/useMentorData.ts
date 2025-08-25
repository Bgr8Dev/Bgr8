import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CalComService } from '../../../components/widgets/MentorAlgorithm/CalCom/calComService';
import { getBestMatchesForUser, MatchResult, calculateMatchScore } from '../../../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { 
  MentorMenteeProfile, 
  MentorAvailability,
  EnhancedAvailability,
  MentorBookings
} from './mentorTypes';

// Type for profiles with match data
type ProfileWithMatchData = MentorMenteeProfile & {
  matchData?: {
    score: number;
    percentage: number;
    reasons: string[];
  };
};

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
  const [bestMatches, setBestMatches] = useState<MatchResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Function to calculate match score for a single profile
  const calculateProfileMatch = async (profile: MentorMenteeProfile): Promise<ProfileWithMatchData> => {
    if (!currentUserProfile || !currentUser) {
      return profile as ProfileWithMatchData;
    }

    try {
      // Use the algorithm's scoring logic to calculate match
      const matchResult = await calculateMatchScore(currentUserProfile, profile);
      
      // Add match information to the profile
      return {
        ...profile,
        // Store match data in a way that doesn't conflict with the base interface
        matchData: {
          score: matchResult.score,
          percentage: matchResult.percentage,
          reasons: matchResult.reasons
        }
      };
    } catch (error) {
      console.error('Error calculating match score for profile:', profile.uid, error);
      return profile as ProfileWithMatchData;
    }
  };

  // Function to calculate match scores for all profiles
  const calculateAllProfileMatches = async (profiles: MentorMenteeProfile[]): Promise<MentorMenteeProfile[]> => {
    if (!currentUserProfile) {
      return profiles;
    }

    const profilesWithMatches: ProfileWithMatchData[] = [];
    
    for (const profile of profiles) {
      const profileWithMatch = await calculateProfileMatch(profile);
      profilesWithMatches.push(profileWithMatch);
    }

    // Sort profiles by match percentage (highest first)
    profilesWithMatches.sort((a, b) => {
      const aScore = a.matchData?.percentage || 0;
      const bScore = b.matchData?.percentage || 0;
      return bScore - aScore;
    });

    return profilesWithMatches;
  };

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
        
        // Automatically find matches when profile is first loaded
        console.log('MentorPage: Profile found, automatically finding matches...');
        setTimeout(() => findMatches(), 1000); // Small delay to ensure state is set
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

  const fetchProfiles = async (userType?: string) => {
    try {
      console.log('MentorPage: Starting to fetch profiles...');
      console.log('MentorPage: Current user type:', userType || currentUserProfile?.type);
      setError(null);
      
      if (!firestore) {
        throw new Error('Firebase database not initialized');
      }

      // Use the passed userType parameter or fall back to currentUserProfile?.type
      const targetType = userType || currentUserProfile?.type;
      
      if (!targetType) {
        console.log('MentorPage: No user type available, skipping profile fetch');
        return;
      }

      // Normalize the type to lowercase for consistent comparison
      const normalizedTargetType = typeof targetType === 'string' ? targetType.toLowerCase() : targetType.toString().toLowerCase();
      console.log('MentorPage: Normalized target type:', normalizedTargetType);

      const profilesData: MentorMenteeProfile[] = [];
      
      // Fetch from traditional user profiles
      const usersQuery = query(collection(firestore, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const mentorData = mentorProgramDoc.data() as MentorMenteeProfile;
            
            // Normalize the profile type for comparison
            const profileType = typeof mentorData.type === 'string' ? mentorData.type.toLowerCase() : '';
            
            // If current user is a mentee, show mentors to learn from
            // If current user is a mentor, show mentees to mentor
            if (normalizedTargetType === 'mentee' ? profileType === 'mentor' : profileType === 'mentee') {
              profilesData.push({
                ...mentorData,
                id: userDoc.id,
                uid: userDoc.id,
                isGenerated: false
              } as MentorMenteeProfile);
            }
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch from appropriate generated collection based on current user's role
      try {
        const collectionName = normalizedTargetType === 'mentee' ? 'Generated Mentors' : 'Generated Mentees';
        console.log('MentorPage: Fetching from collection:', collectionName);
        const generatedQuery = query(collection(firestore, collectionName));
        const generatedSnapshot = await getDocs(generatedQuery);
        
        generatedSnapshot.docs.forEach(doc => {
          const profileData = doc.data() as MentorMenteeProfile;
          profilesData.push({
            ...profileData,
            id: doc.id,
            uid: doc.id,
            isGenerated: true
          } as MentorMenteeProfile);
        });
      } catch (error) {
        console.error('Error fetching generated profiles:', error);
      }
      
      console.log('MentorPage: Found profiles:', profilesData.length, profilesData);
      
      setMentors(await calculateAllProfileMatches(profilesData));
      setFilteredMentors(await calculateAllProfileMatches(profilesData));
      
      await updateAllMentorAvailability();
      
      // Automatically find matches after profiles are loaded
      if (currentUser && currentUserProfile) {
        console.log('MentorPage: Automatically finding matches after profile fetch...');
        await findMatches();
      }
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
      console.log('Finding matches for user:', currentUser.uid);
      console.log('Current user profile:', currentUserProfile);
      
      const matches = await getBestMatchesForUser(currentUser.uid);
      console.log('Algorithm found matches:', matches);
      
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

  const createProfile = async (profileData: Partial<MentorMenteeProfile>) => {
    try {
      setLoading(true);
      const user = currentUser;
      if (!user) throw new Error('No authenticated user');

      const profileRef = doc(firestore, 'users', user.uid, 'mentorProgram', 'profile');
      const newProfile = {
        ...profileData,
        id: user.uid,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(profileRef, newProfile);
      
      // Refresh currentUserProfile from Firestore instead of setting locally
      await checkUserProfile();
      
      // Refresh the profiles list to include the new profile
      // Pass the user type to ensure we fetch the correct profiles
      if (profileData.type && typeof profileData.type === 'string') {
        await fetchProfiles(profileData.type);
      }
      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<MentorMenteeProfile>) => {
    try {
      setLoading(true);
      const user = currentUser;
      if (!user) throw new Error('No authenticated user');

      const profileRef = doc(firestore, 'users', user.uid, 'mentorProgram', 'profile');
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString(),
        // Ensure boolean fields are set based on type
        isMentor: typeof profileData.type === 'string' ? profileData.type.toLowerCase() === 'mentor' : false,
        isMentee: typeof profileData.type === 'string' ? profileData.type.toLowerCase() === 'mentee' : false
      };

      await updateDoc(profileRef, updateData);
      
      // Refresh currentUserProfile from Firestore instead of setting locally
      await checkUserProfile();
      
      // Refresh the profiles list to get updated data
      // Pass the user type to ensure we fetch the correct profiles
      if (profileData.type && typeof profileData.type === 'string') {
        await fetchProfiles(profileData.type);
      }
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      return false;
    } finally {
      setLoading(false);
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
    if (hasProfile && currentUser && currentUserProfile?.type && typeof currentUserProfile.type === 'string') {
      fetchProfiles(currentUserProfile.type);
    }
  }, [hasProfile, currentUser, currentUserProfile?.type]);

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
    fetchProfiles,
    fetchEnhancedAvailability,
    fetchMentorBookings,
    findMatches,
    createProfile,
    updateProfile,
    deleteProfile
  };
};
