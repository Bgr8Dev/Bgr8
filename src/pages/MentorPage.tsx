import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { firestore } from '../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FaSearch, FaStar, FaVideo, FaCalendarAlt, FaGraduationCap, FaIndustry, FaClock, FaCheckCircle, FaUserGraduate, FaChalkboardTeacher, FaEdit, FaTimes, FaUserFriends, FaMapMarkerAlt, FaCog } from 'react-icons/fa';
import { MentorMenteeProfile, UserType, MENTOR, MENTEE, getBestMatchesForUser, MatchResult } from '../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import BookingModal from '../components/widgets/MentorAlgorithm/booking/BookingModal';
import CalComModal from '../components/widgets/MentorAlgorithm/CalCom/CalComModal';
import { CalComService } from '../components/widgets/MentorAlgorithm/CalCom/calComService';
import MatchStrengthRing from '../components/widgets/MentorAlgorithm/MatchStrengthRing';
import MentorAvailability from '../components/widgets/MentorAlgorithm/MentorAvailability';
import skillsByCategory from '../constants/skillsByCategory';
import ukEducationLevels from '../constants/ukEducationLevels';
import ukCounties from '../constants/ukCounties';
import { ethnicityOptions } from '../constants/ethnicityOptions';
import { religionOptions } from '../constants/religionOptions';
import industriesList from '../constants/industries';
import Navbar from '../components/ui/Navbar';

import './MentorPage.css';

const MENTEE_MIN_AGE = 15;
const MENTEE_MAX_AGE = 19;

export default function MentorPage() {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState<MentorMenteeProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorMenteeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorMenteeProfile | null>(null);
  const [calComModalOpen, setCalComModalOpen] = useState(false);
  const [calComMentor, setCalComMentor] = useState<MentorMenteeProfile | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfileMentor, setSelectedProfileMentor] = useState<MentorMenteeProfile | null>(null);
  const [mentorAvailability, setMentorAvailability] = useState<{[key: string]: {available: boolean, nextSlot?: string}}>({});
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  
  // Enhanced availability data structure
  const [enhancedAvailability, setEnhancedAvailability] = useState<{[key: string]: {
    timeSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  }}>({});
  
  // Mentor booking history
  const [mentorBookings, setMentorBookings] = useState<{[key: string]: Array<{
    id: string;
    menteeName: string;
    sessionDate: string;
    startTime: string;
    status: string;
  }>}>({});

  // Registration and Profile States
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<MentorMenteeProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    degree: '',
    educationLevel: '',
    county: '',
    profession: '',
    pastProfessions: [''],
    linkedin: '',
    calCom: '',
    hobbies: [] as string[],
    ethnicity: '',
    religion: '',
    skills: [] as string[],
    lookingFor: [] as string[],
    industries: [] as string[],
    type: MENTOR as UserType
  });

  // Matchmaking States
  const [bestMatches, setBestMatches] = useState<MatchResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(6);

  // UI States
  const [industriesDropdownOpen, setIndustriesDropdownOpen] = useState(false);
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);



  // Mock insurance/coverage types
  const filterTypes = [
    'Available now', 'Experienced mentors', 'Video calls', 'In-person', 'Free sessions'
  ];

  const degreePlaceholders: { [key: string]: string } = {
    'GCSEs': 'GCSEs (e.g., Maths, English, Science)',
    'A-Levels': 'A-Levels (e.g., Maths, Physics, Chemistry)',
    'BTEC': 'BTEC (e.g., Business, Engineering, IT)',
    'Foundation Degree': 'Foundation Degree (e.g., Computing, Business)',
    "Bachelor's Degree": "Bachelor's Degree (e.g., BSc Computer Science)",
    "Master's Degree": "Master's Degree (e.g., MSc Data Science)",
    'Doctorate/PhD': 'Doctorate/PhD (e.g., PhD in Computer Science)',
    'NVQ/SVQ': 'NVQ/SVQ (e.g., Level 3 Business Administration)',
    'Apprenticeship': 'Apprenticeship (e.g., Software Development)',
    'Other': 'Other Qualification'
  };

  useEffect(() => {
    console.log('MentorPage: Component mounted, checking profile...');
    checkUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (hasProfile && currentUser) {
      fetchMentors();
    }
  }, [hasProfile, currentUser]);

  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm, selectedFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkUserProfile = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', currentUser.uid));
      setHasProfile(mentorDoc.exists());
      
      if (mentorDoc.exists()) {
        const profileData = mentorDoc.data() as MentorMenteeProfile;
        setCurrentUserProfile(profileData);
        setProfileForm({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          age: profileData.age || '',
          degree: profileData.degree || '',
          educationLevel: profileData.educationLevel || '',
          county: profileData.county || '',
          profession: profileData.profession || '',
          pastProfessions: profileData.pastProfessions || [''],
          linkedin: profileData.linkedin || '',
          calCom: profileData.calCom || '',
          hobbies: profileData.hobbies || [],
          ethnicity: profileData.ethnicity || '',
          religion: profileData.religion || '',
          skills: profileData.skills || [],
          lookingFor: profileData.lookingFor || [],
          industries: profileData.industries || [],
          type: profileData.type || ''
        });
      }
    } catch (err) {
      console.error('Error checking profile:', err);
      setError('Failed to check profile');
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

      const mentorsQuery = query(
        collection(firestore, 'mentorProgram'),
        where('type', '==', 'mentor')
      );
      
      console.log('MentorPage: Query created, executing...');
      const querySnapshot = await getDocs(mentorsQuery);
      
      console.log('MentorPage: Query executed, processing results...');
      const mentorsData = querySnapshot.docs.map(doc => {
        const mentorData = doc.data();
        return {
          ...mentorData,
          id: doc.id
        };
      }) as unknown as MentorMenteeProfile[];
      
      console.log('MentorPage: Found mentors:', mentorsData.length, mentorsData);
      
      setMentors(mentorsData);
      setFilteredMentors(mentorsData);
      
      // Update availability for all mentors
      await updateAllMentorAvailability();
    } catch (error) {
      console.error('MentorPage: Error fetching mentors:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch mentors');
    }
  };

  const filterMentors = () => {
    let filtered = mentors;

    if (searchTerm) {
      filtered = filtered.filter(mentor =>
        // Search across all relevant fields
        String(mentor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.profession || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.pastProfessions || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.degree || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.educationLevel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.county || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.ethnicity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.religion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.linkedin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Search in array fields
        (Array.isArray(mentor.skills) && mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.hobbies) && mentor.hobbies.some(hobby => hobby.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.industries) && mentor.industries.some(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.lookingFor) && mentor.lookingFor.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply additional filters
    if (selectedFilter) {
      switch (selectedFilter) {
        case 'Available now':
          filtered = filtered.filter(mentor => {
            const availability = mentorAvailability[mentor.uid];
            return availability?.available || false;
          });
          break;
        case 'Experienced mentors':
          filtered = filtered.filter(mentor => {
            const educationLevel = String(mentor.educationLevel || '');
            return ['Master\'s Degree', 'Doctorate/PhD'].includes(educationLevel) ||
                   (Array.isArray(mentor.pastProfessions) && mentor.pastProfessions.length > 1);
          });
          break;
        case 'Video calls':
          filtered = filtered.filter(mentor => mentor.calCom);
          break;
        case 'In-person':
          filtered = filtered.filter(mentor => String(mentor.county || '').trim() !== '');
          break;
        case 'Free sessions':
          // This would need to be implemented based on actual pricing data
          // For now, we'll show all mentors
          break;
        default:
          break;
      }
    }

    setFilteredMentors(filtered);
  };

  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add mentor names
    mentors.forEach(mentor => {
      if (String(mentor.name || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Name: ${mentor.name}`);
      }
      if (String(mentor.profession || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Profession: ${mentor.profession}`);
      }
      if (String(mentor.county || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Location: ${mentor.county}`);
      }
      if (String(mentor.educationLevel || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Education: ${mentor.educationLevel}`);
      }
    });

    // Add skills
    Object.values(skillsByCategory).flat().forEach(skill => {
      if (skill.toLowerCase().includes(queryLower)) {
        suggestions.add(`Skill: ${skill}`);
      }
    });

    // Add industries
    industriesList.forEach(industry => {
      if (industry.toLowerCase().includes(queryLower)) {
        suggestions.add(`Industry: ${industry}`);
      }
    });

    // Add education levels
    ukEducationLevels.forEach(level => {
      if (level.toLowerCase().includes(queryLower)) {
        suggestions.add(`Education: ${level}`);
      }
    });

    // Add counties
    ukCounties.forEach(county => {
      if (county.toLowerCase().includes(queryLower)) {
        suggestions.add(`Location: ${county}`);
      }
    });

    const suggestionsArray = Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
    setSearchSuggestions(suggestionsArray);
    setShowSearchDropdown(suggestionsArray.length > 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSearchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Extract the actual value from the suggestion (remove prefix like "Skill: ", "Location: ", etc.)
    const value = suggestion.split(': ')[1] || suggestion;
    setSearchTerm(value);
    setShowSearchDropdown(false);
  };

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setProfileForm(prev => ({ ...prev, type: role }));
    setShowRegistration(true);
  };

  const handleBack = () => {
    if (showRegistration) {
      setShowRegistration(false);
      setSelectedRole(null);
      setProfileForm({
        name: '',
        email: '',
        phone: '',
        age: '',
        degree: '',
        educationLevel: '',
        county: '',
        profession: '',
        pastProfessions: [''],
        linkedin: '',
        calCom: '',
        hobbies: [],
        ethnicity: '',
        religion: '',
        skills: [],
        lookingFor: [],
        industries: [],
        type: MENTOR
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: keyof MentorMenteeProfile, value: string[]) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const profileData = {
        uid: currentUser.uid,
        ...profileForm,
        email: currentUser.email || profileForm.email
      };

      await setDoc(doc(firestore, 'mentorProgram', currentUser.uid), profileData);
      setHasProfile(true);
      setCurrentUserProfile(profileData);
      setShowRegistration(false);
      setSelectedRole(null);
      await fetchMentors();
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = async () => {
    if (!currentUser || !currentUserProfile) return;

    try {
      setLoading(true);
      const profileData = {
        ...profileForm,
        uid: currentUser.uid,
        email: currentUser.email || profileForm.email
      };

      await updateDoc(doc(firestore, 'mentorProgram', currentUser.uid), profileData);
      setCurrentUserProfile(profileData);
      setIsEditingProfile(false);
      await fetchMentors();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    if (currentUserProfile) {
      setProfileForm({
        name: currentUserProfile.name || '',
        email: currentUserProfile.email || '',
        phone: currentUserProfile.phone || '',
        age: currentUserProfile.age || '',
        degree: currentUserProfile.degree || '',
        educationLevel: currentUserProfile.educationLevel || '',
        county: currentUserProfile.county || '',
        profession: currentUserProfile.profession || '',
        pastProfessions: currentUserProfile.pastProfessions || [''],
        linkedin: currentUserProfile.linkedin || '',
        calCom: currentUserProfile.calCom || '',
        hobbies: currentUserProfile.hobbies || [],
        ethnicity: currentUserProfile.ethnicity || '',
        religion: currentUserProfile.religion || '',
        skills: currentUserProfile.skills || [],
        lookingFor: currentUserProfile.lookingFor || [],
        industries: currentUserProfile.industries || [],
        type: currentUserProfile.type || ''
      });
    }
  };

  const findMatches = async () => {
    if (!currentUser || !currentUserProfile) return;

    try {
      setLoadingMatches(true);
      const matches = await getBestMatchesForUser(currentUser.uid);
      setBestMatches(matches);
      setShowMatches(true);
      setCurrentPage(1); // Reset to first page when finding new matches
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('Failed to find matches');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Pagination functions
  const getCurrentMatches = () => {
    const startIndex = (currentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    return bestMatches.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(bestMatches.length / matchesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of matches section
    const matchesSection = document.querySelector('.matches-section');
    if (matchesSection) {
      matchesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBooking = (mentor: MentorMenteeProfile) => {
    setSelectedMentor(mentor);
    setBookingModalOpen(true);
  };

  const handleCalCom = (mentor: MentorMenteeProfile) => {
    setCalComMentor(mentor);
    setCalComModalOpen(true);
  };

  const handleProfileCardClick = (mentor: MentorMenteeProfile) => {
    setSelectedProfileMentor(mentor);
    setProfileModalOpen(true);
    
    // Fetch enhanced data when modal opens
    if (mentor.uid) {
      fetchEnhancedAvailability(mentor.uid);
      fetchMentorBookings(mentor.uid);
    }
  };

  const getFilterCount = (filterType: string) => {
    if (!filterType) return mentors.length;
    
    switch (filterType) {
      case 'Available now':
        return mentors.filter(mentor => {
          const availability = mentorAvailability[mentor.uid];
          return availability?.available || false;
        }).length;
      case 'Experienced mentors':
        return mentors.filter(mentor => {
          const educationLevel = String(mentor.educationLevel || '');
          return ['Master\'s Degree', 'Doctorate/PhD'].includes(educationLevel) ||
                 (Array.isArray(mentor.pastProfessions) && mentor.pastProfessions.length > 1);
        }).length;
      case 'Video calls':
        return mentors.filter(mentor => mentor.calCom).length;
      case 'In-person':
        return mentors.filter(mentor => String(mentor.county || '').trim() !== '').length;
      case 'Free sessions':
        return mentors.length; // Placeholder for future pricing logic
      default:
        return 0;
    }
  };

  const checkMentorAvailability = async (mentor: MentorMenteeProfile) => {
    if (!mentor.calCom) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const availability = await CalComService.getAvailability(mentor.uid, today, tomorrow);
      
      // Check if mentor has any available slots today
      const hasAvailabilityToday = availability.some(day => 
        day.date === today && day.slots.some(slot => slot.available)
      );
      
      // Get next available slot
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

  const fetchEnhancedAvailability = async (mentorId: string) => {
    try {
      // Fetch from mentorAvailability collection
      const availabilityDoc = await getDoc(doc(firestore, 'mentorAvailability', mentorId));
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
      // Fetch from bookings collection
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

  const updateAllMentorAvailability = async () => {
    const availabilityPromises = mentors.map(async (mentor) => {
      const availability = await checkMentorAvailability(mentor);
      return { [mentor.uid]: availability };
    });
    
    const results = await Promise.all(availabilityPromises);
    const newAvailability = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    setMentorAvailability(newAvailability as {[key: string]: {available: boolean, nextSlot?: string}});
  };

  // Show error state
  if (error) {
    return (
      <div className="mentor-page">
        <div className="mentor-header">
          <div className="mentor-header-content">
            <h1>Find mentors who can guide your journey</h1>
            <p>Connect with experienced professionals who share your interests and goals</p>
          </div>
        </div>
        
        <div className="mentor-results">
          <div className="error-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="action-button primary"
              style={{ margin: '20px auto', display: 'block' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mentor-page-loading">
        <div className="loading-spinner"></div>
        <p>Finding the best mentors for you...</p>
        <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginTop: '10px' }}>
          This may take a few moments...
        </p>
      </div>
    );
  }

  // Show registration flow
  if (!hasProfile) {
    return (
      <div className="mentor-page">
        <div className="mentor-header">
          <div className="mentor-header-content">
            <h1>Join Our Mentorship Network</h1>
            <p>Choose your role and create your profile to get started</p>
          </div>
        </div>

        {!selectedRole && !showRegistration ? (
          <div className="mentor-role-selection">
            <div className="role-cards">
              <div className="role-card mentor" onClick={() => handleRoleSelect(MENTOR)}>
                <FaChalkboardTeacher size={48} />
                <h3>Become a Mentor</h3>
                <p>Share your expertise and help guide the next generation. List your skills and get matched with mentees looking for your knowledge.</p>
              </div>
              <div className="role-card mentee" onClick={() => handleRoleSelect(MENTEE)}>
                <FaUserGraduate size={48} />
                <h3>Become a Mentee</h3>
                <p>Find a mentor to help you grow. Tell us what skills you're looking for and get matched with the right mentor for you.</p>
              </div>
            </div>
          </div>
        ) : null}

        {showRegistration && (
          <div className="mentor-registration">
            <div className="registration-header">
              <button className="back-button" onClick={handleBack}>
                <FaTimes /> Back
              </button>
              <h2>Create Your {selectedRole === MENTOR ? 'Mentor' : 'Mentee'} Profile</h2>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <input
                    name="name"
                    value={profileForm.name}
                    onChange={handleFormChange}
                    placeholder="Full Name"
                    required
                  />
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleFormChange}
                    placeholder="Phone Number"
                    type="tel"
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    name="age"
                    value={profileForm.age}
                    onChange={handleFormChange}
                    placeholder="Age"
                    type="number"
                    min={selectedRole === MENTEE ? MENTEE_MIN_AGE : 18}
                    max={selectedRole === MENTEE ? MENTEE_MAX_AGE : 100}
                    required
                  />
                  <select
                    name="county"
                    value={profileForm.county}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select County</option>
                    {ukCounties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Education & Career</h3>
                <div className="form-row">
                  <input
                    name="degree"
                    value={profileForm.degree}
                    onChange={handleFormChange}
                    placeholder={degreePlaceholders[profileForm.educationLevel] || "Degree/Qualification"}
                  />
                  <select
                    name="educationLevel"
                    value={profileForm.educationLevel}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Education Level</option>
                    {ukEducationLevels
                      .filter(level => {
                        if (selectedRole === MENTEE) {
                          const menteeLevels = [
                            'GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree"
                          ];
                          return menteeLevels.includes(level);
                        }
                        return true;
                      })
                      .map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                  </select>
                </div>
                <div className="form-row">
                  <input
                    name="profession"
                    value={profileForm.profession}
                    onChange={handleFormChange}
                    placeholder="Current Profession"
                    required
                  />
                  <input
                    name="linkedin"
                    value={profileForm.linkedin}
                    onChange={handleFormChange}
                    placeholder="LinkedIn Profile (optional)"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Skills & Interests</h3>
                <div className="form-row">
                  <div className="multiselect-container">
                    <label>Skills {selectedRole === MENTOR ? '(What you can teach)' : '(What you want to learn)'}</label>
                    <div className="multiselect-dropdown">
                      <div className="multiselect-control" onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}>
                        <span>{profileForm.skills.length === 0 ? 'Select skills...' : `${profileForm.skills.length} selected`}</span>
                        <span>▼</span>
                      </div>
                      {skillsDropdownOpen && (
                        <div className="multiselect-options">
                          {Object.entries(skillsByCategory).map(([category, skills]) => (
                            <div key={category} className="skill-category">
                              <div className="category-header">{category}</div>
                              {skills.map(skill => (
                                <label key={skill} className="skill-option">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.skills.includes(skill)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleArrayChange('skills', [...profileForm.skills, skill]);
                                      } else {
                                        handleArrayChange('skills', profileForm.skills.filter(s => s !== skill));
                                      }
                                    }}
                                  />
                                  {skill}
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="multiselect-container">
                    <label>Industries {selectedRole === MENTOR ? '(Current/Previous)' : '(Desired)'}</label>
                    <div className="multiselect-dropdown">
                      <div className="multiselect-control" onClick={() => setIndustriesDropdownOpen(!industriesDropdownOpen)}>
                        <span>{profileForm.industries.length === 0 ? 'Select industries...' : `${profileForm.industries.length} selected`}</span>
                        <span>▼</span>
                      </div>
                      {industriesDropdownOpen && (
                        <div className="multiselect-options">
                          {industriesList.map(industry => (
                            <label key={industry} className="industry-option">
                              <input
                                type="checkbox"
                                checked={profileForm.industries.includes(industry)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleArrayChange('industries', [...profileForm.industries, industry]);
                                  } else {
                                    handleArrayChange('industries', profileForm.industries.filter(i => i !== industry));
                                  }
                                }}
                              />
                              {industry}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-row">
                  <select
                    name="ethnicity"
                    value={profileForm.ethnicity}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Ethnicity (optional)</option>
                    {ethnicityOptions.map(ethnicity => (
                      <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                    ))}
                  </select>
                  <select
                    name="religion"
                    value={profileForm.religion}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Religion (optional)</option>
                    {religionOptions.map(religion => (
                      <option key={religion} value={religion}>{religion}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Show main mentor discovery page
  return (
    <div className="mentor-page">
      <Navbar />
      {/* Header Section */}
      <div className="mentor-header">
        <div className="mentor-header-content">
          <h1>Find mentors who can guide your journey</h1>
          <p>Connect with experienced professionals who share your interests and goals</p>
          
          {/* User Profile Summary */}
          {currentUserProfile && (
            <div className="user-profile-summary">
              <div className="profile-info">
                <span className={`profile-role ${currentUserProfile.type === MENTOR ? 'mentor' : 'mentee'}`}>
                  {currentUserProfile.type === MENTOR ? 'Mentor' : 'Mentee'}
                </span>
                <span className="profile-name">{currentUserProfile.name}</span>
              </div>
              <div className="profile-actions">
                <button onClick={handleProfileEdit} className="profile-edit-btn">
                  <FaEdit /> Edit Profile
                </button>
                <button onClick={findMatches} className="find-matches-btn" disabled={loadingMatches}>
                  <FaUserFriends /> {loadingMatches ? 'Finding Matches...' : 'Find Matches'}
                </button>
                {currentUserProfile.type === MENTOR && (
                  <button onClick={() => setAvailabilityModalOpen(true)} className="availability-manage-btn">
                    <FaCog /> Manage Availability
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="What are you looking to learn?"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => generateSearchSuggestions(searchTerm)}
              />
              {showSearchDropdown && (
                <div className="search-suggestions-dropdown">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matches Section */}
      {showMatches && bestMatches.length > 0 && (
        <div className="matches-section">
          <div className="matches-header">
            <h2>Your Best Matches</h2>
            <p>Based on your profile and preferences</p>
            <div className="matches-summary">
              Showing {getCurrentMatches().length} of {bestMatches.length} matches
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
          </div>
          <div className="matches-grid">
            {getCurrentMatches().map((match) => (
              <div key={match.user.uid} className="match-card">
                <div className="match-header">
                  <div className="match-avatar">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${String(match.user.name || 'User')}&background=random`} 
                      alt={String(match.user.name || 'User')}
                    />
                  </div>
                  <div className="match-info">
                    <h3>{String(match.user.name || 'User')}</h3>
                    <p>{String(match.user.profession || 'Professional')}</p>
                    <div className="match-score">
                      <MatchStrengthRing score={match.score} />
                      <span>Match Score: {match.score}</span>
                    </div>
                  </div>
                </div>
                <div className="match-reasons">
                  <h4>Why this match:</h4>
                  <ul>
                    {match.reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="match-actions">
                  <button className="action-button primary" onClick={() => handleBooking(match.user)}>
                    <FaCalendarAlt /> Book Session
                  </button>
                  {match.user.calCom && (
                    <button className="action-button secondary" onClick={() => handleCalCom(match.user)}>
                      <FaVideo /> Schedule Call
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-btn prev"
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="page-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-btn next"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-container">
          <button 
            className={`filter-pill ${!selectedFilter ? 'active' : ''}`}
            onClick={() => setSelectedFilter('')}
          >
            All mentors
            <span className="filter-count">{mentors.length}</span>
          </button>
          {filterTypes.map(type => (
            <button
              key={type}
              className={`filter-pill ${selectedFilter === type ? 'active' : ''}`}
              onClick={() => setSelectedFilter(type)}
            >
              {type}
              <span className="filter-count">{getFilterCount(type)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="mentor-results">
        <div className="results-header">
          <h2>{filteredMentors.length} mentors available</h2>
          <p>Showing mentors for your search criteria</p>
        </div>

        <div className="mentors-grid">
          {filteredMentors.map((mentor) => (
            <div 
              key={String(mentor.id || mentor.uid)} 
              className="mentor-card"
              onClick={() => handleProfileCardClick(mentor)}
            >
              <div className="mentor-card-header">
                <div className="mentor-avatar">
                  <img 
                    src={Array.isArray(mentor.profilePicture) ? mentor.profilePicture[0] || `https://ui-avatars.com/api/?name=${String(mentor.name || 'Mentor')}&background=random` : mentor.profilePicture || `https://ui-avatars.com/api/?name=${String(mentor.name || 'Mentor')}&background=random`} 
                    alt={String(mentor.name || 'Mentor')}
                  />
                </div>
                
                <div className="mentor-info">
                  <h3 className="mentor-name">{String(mentor.name || 'Mentor')}</h3>
                  <p className="mentor-title">{String(mentor.profession || 'Professional')}</p>
                  <div className="mentor-rating">
                    <FaStar className="star-icon" />
                    <span>4.8</span>
                    <span className="review-count">(24 reviews)</span>
                  </div>
                </div>

                <div className="mentor-badges">
                  {mentor.calCom && (
                    <div className="badge video-badge">
                      <FaVideo />
                      Video calls
                    </div>
                  )}
                  <div className="badge verified-badge">
                    <FaCheckCircle />
                    Verified
                  </div>
                </div>
              </div>

              <div className="mentor-details">
                <div className="detail-item">
                  <FaGraduationCap />
                  <span>{String(mentor.educationLevel || 'Not specified')}</span>
                </div>
                <div className="detail-item">
                  <FaIndustry />
                  <span>{Array.isArray(mentor.industries) ? mentor.industries.join(', ') : 'Various industries'}</span>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt />
                  <span>{String(mentor.county || 'Location not specified')}</span>
                </div>
              </div>

              <div className="mentor-skills">
                <h4>Expertise</h4>
                <div className="skills-tags">
                  {Array.isArray(mentor.skills) && mentor.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                  {Array.isArray(mentor.skills) && mentor.skills.length > 3 && (
                    <span className="skill-tag more">+{mentor.skills.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="mentor-availability">
                <div className="availability-status">
                  <FaClock className="clock-icon" />
                  <span className={mentorAvailability[mentor.uid]?.available ? 'available' : 'unavailable'}>
                    {mentorAvailability[mentor.uid]?.available ? 'Available now' : 'No availability'}
                  </span>
                </div>
                
                {mentorAvailability[mentor.uid]?.available && mentorAvailability[mentor.uid]?.nextSlot && (
                  <div className="next-slot">
                    Next: {mentorAvailability[mentor.uid]?.nextSlot}
                  </div>
                )}

                {/* Cal.com Integration Indicator */}
                {mentor.calCom && (
                  <div className="calcom-indicator">
                    <FaVideo className="video-icon" />
                    <span>Cal.com Connected</span>
                  </div>
                )}
              </div>

              <div className="mentor-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="action-button primary"
                  onClick={() => handleBooking(mentor)}
                >
                  <FaCalendarAlt />
                  Book Session
                </button>
                
                {mentor.calCom && (
                  <button 
                    className="action-button secondary"
                    onClick={() => handleCalCom(mentor)}
                  >
                    <FaVideo />
                    Schedule Call
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="no-results">
            <h3>No mentors found</h3>
            <p>Try adjusting your search criteria or expanding your location</p>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginTop: '10px' }}>
              If you're expecting to see mentors, they may need to be added to the system first.
            </p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="profile-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button onClick={handleProfileCancel} className="close-button" title="Close modal">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }} className="profile-edit-form">
              {/* Similar form fields as registration but with current values */}
              <div className="form-section">
                <h4>Personal Information</h4>
                <div className="form-row">
                  <input
                    name="name"
                    value={profileForm.name}
                    onChange={handleFormChange}
                    placeholder="Full Name"
                    required
                  />
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleFormChange}
                    placeholder="Phone Number"
                    type="tel"
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    name="age"
                    value={profileForm.age}
                    onChange={handleFormChange}
                    placeholder="Age"
                    type="number"
                    min={currentUserProfile?.type === MENTEE ? MENTEE_MIN_AGE : 18}
                    max={currentUserProfile?.type === MENTEE ? MENTEE_MAX_AGE : 100}
                    required
                  />
                  <select
                    name="county"
                    value={profileForm.county}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select County</option>
                    {ukCounties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Education & Career</h4>
                <div className="form-row">
                  <input
                    name="degree"
                    value={profileForm.degree}
                    onChange={handleFormChange}
                    placeholder="Degree/Qualification"
                  />
                  <select
                    name="educationLevel"
                    value={profileForm.educationLevel}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Education Level</option>
                    {ukEducationLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <input
                    name="profession"
                    value={profileForm.profession}
                    onChange={handleFormChange}
                    placeholder="Current Profession"
                    required
                  />
                  <input
                    name="linkedin"
                    value={profileForm.linkedin}
                    onChange={handleFormChange}
                    placeholder="LinkedIn Profile (optional)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleProfileCancel} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && selectedMentor && (
        <BookingModal
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentor={selectedMentor}
        />
      )}

      {/* CalCom Modal */}
      {calComModalOpen && calComMentor && (
        <CalComModal
          open={calComModalOpen}
          onClose={() => setCalComModalOpen(false)}
          mentor={calComMentor}
        />
      )}

      {/* Profile Modal */}
      {profileModalOpen && selectedProfileMentor && (
        <div className="profile-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Mentor Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="close-button" title="Close modal">
                <FaTimes />
              </button>
            </div>
            <div className="profile-modal-content">
              <div className="profile-header">
                <div className="profile-avatar">
                  <img 
                    src={Array.isArray(selectedProfileMentor.profilePicture) ? selectedProfileMentor.profilePicture[0] || `https://ui-avatars.com/api/?name=${String(selectedProfileMentor.name || 'Mentor')}&background=random` : selectedProfileMentor.profilePicture || `https://ui-avatars.com/api/?name=${String(selectedProfileMentor.name || 'Mentor')}&background=random`} 
                    alt={String(selectedProfileMentor.name || 'Mentor')}
                  />
                </div>
                <div className="profile-info">
                  <h2>{String(selectedProfileMentor.name || 'Mentor')}</h2>
                  <p className="profile-profession">{String(selectedProfileMentor.profession || 'Professional')}</p>
                  <div className="profile-rating">
                    <FaStar className="star-icon" />
                    <span>4.8</span>
                    <span className="review-count">(24 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="profile-sections">
                <div className="profile-section">
                  <h4>Education & Background</h4>
                  <div className="profile-details">
                    <div className="detail-item">
                      <FaGraduationCap />
                      <span><strong>Education Level:</strong> {String(selectedProfileMentor.educationLevel || 'Not specified')}</span>
                    </div>
                    <div className="detail-item">
                      <span><strong>Degree:</strong> {String(selectedProfileMentor.degree || 'Not specified')}</span>
                    </div>
                    <div className="detail-item">
                      <FaIndustry />
                      <span><strong>Industries:</strong> {Array.isArray(selectedProfileMentor.industries) ? selectedProfileMentor.industries.join(', ') : 'Various industries'}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span><strong>Location:</strong> {String(selectedProfileMentor.county || 'Location not specified')}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>Skills & Expertise</h4>
                  <div className="skills-grid">
                    {Array.isArray(selectedProfileMentor.skills) && selectedProfileMentor.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                {Array.isArray(selectedProfileMentor.hobbies) && selectedProfileMentor.hobbies.length > 0 && (
                  <div className="profile-section">
                    <h4>Interests & Hobbies</h4>
                    <div className="hobbies-grid">
                      {selectedProfileMentor.hobbies.map((hobby, index) => (
                        <span key={index} className="hobby-tag">{hobby}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profile-section">
                  <h4>Availability & Contact</h4>
                  <div className="availability-info">
                    <div className="availability-status">
                      <FaClock className="clock-icon" />
                      <span className={mentorAvailability[selectedProfileMentor.uid]?.available ? 'available' : 'unavailable'}>
                        {mentorAvailability[selectedProfileMentor.uid]?.available ? 'Available now' : 'No availability'}
                      </span>
                    </div>
                    {mentorAvailability[selectedProfileMentor.uid]?.available && mentorAvailability[selectedProfileMentor.uid]?.nextSlot && (
                      <div className="next-slot">
                        Next available: {mentorAvailability[selectedProfileMentor.uid]?.nextSlot}
                      </div>
                    )}
                    
                    {/* Enhanced Availability Display */}
                    {enhancedAvailability[selectedProfileMentor.uid]?.timeSlots && enhancedAvailability[selectedProfileMentor.uid].timeSlots.length > 0 && (
                      <div className="detailed-availability">
                        <h5>Upcoming Time Slots</h5>
                        <div className="time-slots-grid">
                          {enhancedAvailability[selectedProfileMentor.uid].timeSlots.slice(0, 6).map((slot, index) => (
                            <div key={index} className={`time-slot ${slot.isAvailable ? 'available' : 'booked'}`}>
                              <div className="slot-date">{slot.date}</div>
                              <div className="slot-time">{slot.startTime} - {slot.endTime}</div>
                              <div className="slot-status">{slot.isAvailable ? 'Available' : 'Booked'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Cal.com Integration Status */}
                    {selectedProfileMentor.calCom && (
                      <div className="calcom-integration">
                        <FaVideo className="video-icon" />
                        <span className="integration-status">
                          <strong>Cal.com Integration:</strong> ✅ Connected
                        </span>
                        <a 
                          href={selectedProfileMentor.calCom} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="calcom-link"
                        >
                          View Calendar
                        </a>
                      </div>
                    )}
                    
                    {/* Contact Information */}
                    <div className="contact-info">
                      <div className="contact-item">
                        <strong>Email:</strong> {selectedProfileMentor.email || 'Not provided'}
                      </div>
                      {selectedProfileMentor.phone && (
                        <div className="contact-item">
                          <strong>Phone:</strong> {selectedProfileMentor.phone}
                        </div>
                      )}
                      {selectedProfileMentor.linkedin && (
                        <div className="contact-item">
                          <strong>LinkedIn:</strong> 
                          <a 
                            href={selectedProfileMentor.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="linkedin-link"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking History Section */}
                {mentorBookings[selectedProfileMentor.uid] && mentorBookings[selectedProfileMentor.uid].length > 0 && (
                  <div className="profile-section">
                    <h4>Recent Bookings</h4>
                    <div className="bookings-list">
                      {mentorBookings[selectedProfileMentor.uid].slice(0, 5).map((booking, index) => (
                        <div key={index} className="booking-item">
                          <div className="booking-header">
                            <span className="mentee-name">{booking.menteeName}</span>
                            <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                          </div>
                          <div className="booking-details">
                            <span className="booking-date">{booking.sessionDate}</span>
                            <span className="booking-time">{booking.startTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button 
                  className="action-button primary"
                  onClick={() => {
                    setProfileModalOpen(false);
                    handleBooking(selectedProfileMentor);
                  }}
                >
                  <FaCalendarAlt />
                  Book Session
                </button>
                
                {selectedProfileMentor.calCom && (
                  <button 
                    className="action-button secondary"
                    onClick={() => {
                      setProfileModalOpen(false);
                      handleCalCom(selectedProfileMentor);
                    }}
                  >
                    <FaVideo />
                    Schedule Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Availability Management Modal */}
      {availabilityModalOpen && (
        <div className="availability-modal-overlay">
          <div className="availability-modal">
            <div className="availability-modal-header">
              <h3>Manage Your Availability</h3>
              <button onClick={() => setAvailabilityModalOpen(false)} className="close-button" title="Close modal">
                <FaTimes />
              </button>
            </div>
            <div className="availability-modal-content">
              <MentorAvailability />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}