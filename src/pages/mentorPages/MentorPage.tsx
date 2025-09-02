import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

import { 
  RoleSelection,
  MentorFilters,
  MentorCard,
  ProfileRegistrationForm,
  MatchesSection,
  ProfileEditModal,
  useMentorData,
  useMentorSearch,
  useProfileForm,
  UserType,
  ProfileFormData,
  MentorMenteeProfile
} from './types';

import { ProfileViewModal } from './components/ProfileViewModal';
import { ViewBookingsModal } from './components/ViewBookingsModal';
import { MentorDashboard } from './components/MentorDashboard';
import { MenteeDashboard } from './components/MenteeDashboard';
import { default as BookingModal } from '../../components/widgets/MentorAlgorithm/booking/BookingModal';
import { default as CalComModal } from '../../components/widgets/MentorAlgorithm/CalCom/CalComModal';
import { default as MentorAvailability } from '../../components/widgets/MentorAlgorithm/MentorAvailability';
import Navbar from '../../components/ui/Navbar';

// Import all CSS files to ensure styles are loaded
import './styles/MentorPage.css';
import './styles/MentorSidebar.css';
import './styles/MentorForms.css';
import './styles/MentorModals.css';
import './styles/MentorAnimations.css';
import './styles/MentorResponsive.css';
import './styles/MentorCard.css';
import './styles/MatchesSection.css';
import './styles/ProfileViewModal.css';
import './styles/ViewBookingsModal.css';
import './styles/RoleSelection.css';
import './styles/ProfileRegistrationForm.css';
import './styles/ProfileEditModal.css';
import { useButtonEmergeModal } from '../../hooks/useButtonEmergeModal';
import './styles/MentorFilters.css';

export default function MentorPage() {
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Use button-emerge modal hook for profile edit
  const { 
    isModalOpen: showProfileEdit, 
    openModalWithAnimation: openProfileEditModal, 
    closeModal: closeProfileEditModal 
  } = useButtonEmergeModal({ 
    modalSelector: '.pem-profile-edit-modal' 
  });
  
  // Modal state management
  const [showProfileViewModal, setShowProfileViewModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalComModal, setShowCalComModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showViewBookingsModal, setShowViewBookingsModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorMenteeProfile | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [profilesPerPage] = useState(12);
  const [isMenteesSectionMinimized, setIsMenteesSectionMinimized] = useState(false);

  // Custom hooks for data management
  const {
    mentors: availableProfiles,
    setFilteredMentors,
    loading,
    error,
    setError,
    mentorAvailability,
    mentorBookings,
    hasProfile,
    currentUserProfile,
    bestMatches,
    fetchEnhancedAvailability,
    fetchMentorBookings,
    createProfile,
    updateProfile,
    deleteProfile
  } = useMentorData();

  // Custom hooks for search and form management
  const {
    searchTerm,
    selectedFilter,
    setSelectedFilter,
    showSearchDropdown,
    searchSuggestions,
    filteredMentors: searchFilteredMentors,
    handleSearchChange,
    handleSuggestionClick,
    getFilterCount
  } = useMentorSearch(availableProfiles, mentorAvailability);

  const {
    profileForm,
    validationErrors,
    setValidationErrors,
    handleFormChange,
    handleArrayChange,
    handlePastProfessionChange,
    addPastProfession,
    removePastProfession,
    calculateFormProgress,
    getSectionStatus,
    validateProfileForm,
    resetForm,
    setFormData
  } = useProfileForm(selectedRole);

  // Event handlers
  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setFormData({ type: role });
  };

  const handleBack = () => {
    setSelectedRole(null);
    resetForm();
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('MentorPage handleSubmit called');
    console.log('Profile form data:', profileForm);
    console.log('Selected role:', selectedRole);
    
    const errors = validateProfileForm();
    console.log('Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation failed, setting errors');
      setValidationErrors(errors);
      return;
    }

    if (!selectedRole) {
      console.log('No selected role, returning');
      return;
    }

    console.log('Creating profile with data:', {
      ...profileForm,
      type: selectedRole,
      uid: currentUser?.uid || '',
      userRef: currentUser?.uid || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isMentor: selectedRole.toLowerCase() === 'mentor',
      isMentee: selectedRole.toLowerCase() === 'mentee'
    });

    const profileData = {
      ...profileForm,
      type: selectedRole,
      uid: currentUser?.uid || '',
      userRef: currentUser?.uid || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isMentor: selectedRole.toLowerCase() === 'mentor',
      isMentee: selectedRole.toLowerCase() === 'mentee'
    };

    console.log('Calling createProfile...');
    const success = await createProfile(profileData);
    console.log('createProfile result:', success);
    
    if (success) {
      console.log('Profile created successfully, resetting form');
      setSelectedRole(null);
      resetForm();
    } else {
      console.log('Profile creation failed');
    }
  };

  const handleProfileEdit = (event?: React.MouseEvent<HTMLElement>) => {
    console.log('handleProfileEdit called');
    console.log('currentUserProfile:', currentUserProfile);
    if (currentUserProfile) {
      setFormData(currentUserProfile);
      if (event) {
        openProfileEditModal(event);
      } else {
        // Fallback for programmatic calls
        const fakeEvent = {
          currentTarget: document.createElement('button'),
          preventDefault: () => {},
          stopPropagation: () => {}
        } as unknown as React.MouseEvent<HTMLElement>;
        openProfileEditModal(fakeEvent);
      }
      console.log('showProfileEdit set to true');
    }
  };

  const handleProfileSave = async (profileData: ProfileFormData) => {
    const updatedProfile = {
      ...profileData,
      updatedAt: new Date().toISOString(),
      isMentor: profileData.type?.toLowerCase() === 'mentor',
      isMentee: profileData.type?.toLowerCase() === 'mentee'
    };
    
    const success = await updateProfile(updatedProfile);
    if (success) {
      closeProfileEditModal();
    }
    return success;
  };

  const handleProfileDelete = async () => {
    const success = await deleteProfile();
    if (success) {
      closeProfileEditModal();
    }
    return success;
  };

  const handleAvailabilityManage = () => {
    // Only mentors can manage availability
    if (typeof currentUserProfile?.type !== 'string' || currentUserProfile.type.toLowerCase() !== 'mentor') {
      console.warn('Only mentors can manage availability');
      return;
    }
    setShowAvailabilityModal(true);
  };

  const handleViewAllBookings = () => {
    setShowViewBookingsModal(true);
  };

  const toggleMenteesSection = () => {
    setIsMenteesSectionMinimized(!isMenteesSectionMinimized);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleAcceptBooking = (bookingId: string) => {
    console.log('Accepting booking:', bookingId);
    // TODO: Implement booking acceptance logic
  };

  const handleRejectBooking = (bookingId: string) => {
    console.log('Rejecting booking:', bookingId);
    // TODO: Implement booking rejection logic
  };

  const handleCancelBooking = (bookingId: string) => {
    console.log('Cancelling booking:', bookingId);
    // TODO: Implement booking cancellation logic
  };

  // Helper function to close profile view modal
  const handleCloseProfileViewModal = () => {
    console.log('Closing profile view modal');
    setShowProfileViewModal(false);
    setSelectedMentor(null);
  };

  // Helper function to close booking modal
  const handleCloseBookingModal = () => {
    console.log('Closing booking modal');
    setShowBookingModal(false);
    setSelectedMentor(null);
  };

  // Helper function to close Cal.com modal
  const handleCloseCalComModal = () => {
    console.log('Closing Cal.com modal');
    setShowCalComModal(false);
    setSelectedMentor(null);
  };

  const handleProfileCardClick = (mentor: MentorMenteeProfile) => {
    console.log('=== PROFILE CARD CLICKED ===');
    console.log('Mentor:', mentor.firstName, mentor.lastName, mentor.uid);
    console.log('Current modal states:', {
      showProfileViewModal,
      showBookingModal,
      showCalComModal
    });
    console.log('Stack trace:', new Error().stack);
    console.log('==========================');
    
    // Close any other open modals first
    if (showProfileViewModal || showBookingModal || showCalComModal) {
      console.log('Closing other modals before opening profile view modal');
      setShowProfileViewModal(false);
      setShowBookingModal(false);
      setShowCalComModal(false);
      // Small delay to ensure state updates before opening new modal
      setTimeout(() => {
        setSelectedMentor(mentor);
        setShowProfileViewModal(true);
        fetchEnhancedAvailability(mentor.uid);
        fetchMentorBookings(mentor.uid);
      }, 100);
      return;
    }
    
    setSelectedMentor(mentor);
    setShowProfileViewModal(true);
    fetchEnhancedAvailability(mentor.uid);
    fetchMentorBookings(mentor.uid);
  };

  const handleBooking = (mentor: MentorMenteeProfile) => {
    console.log('Booking clicked for:', mentor.firstName, mentor.lastName);
    
    // Close any other open modals first
    if (showProfileViewModal || showBookingModal || showCalComModal) {
      console.log('Closing other modals before opening booking modal');
      setShowProfileViewModal(false);
      setShowBookingModal(false);
      setShowCalComModal(false);
      // Small delay to ensure state updates before opening new modal
      setTimeout(() => {
        setSelectedMentor(mentor);
        setShowBookingModal(true);
      }, 100);
      return;
    }
    
    setSelectedMentor(mentor);
    setShowBookingModal(true);
    console.log('Booking not yet implemented for:', mentor.firstName);
  };

  const handleCalCom = (mentor: MentorMenteeProfile) => {
    console.log('Cal.com clicked for:', mentor.firstName, mentor.lastName);
    
    // Close any other open modals first
    if (showProfileViewModal || showBookingModal || showCalComModal) {
      console.log('Closing other modals before opening Cal.com modal');
      setShowProfileViewModal(false);
      setShowBookingModal(false);
      setShowCalComModal(false);
      // Small delay to ensure state updates before opening new modal
      setTimeout(() => {
        setSelectedMentor(mentor);
        setShowCalComModal(true);
      }, 100);
      return;
    }
    
    setSelectedMentor(mentor);
    setShowCalComModal(true);
    console.log('Cal.com integration not yet implemented for:', mentor.firstName);
  };

  // Helper function to extract match score from profile
  const getMatchScore = (profile: MentorMenteeProfile): number | undefined => {
    const profileWithMatch = profile as MentorMenteeProfile & { matchData?: { percentage: number } };
    return profileWithMatch.matchData?.percentage;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination
  const indexOfLastProfile = currentPage * profilesPerPage;
  const indexOfFirstProfile = indexOfLastProfile - profilesPerPage;
  const currentProfiles = searchFilteredMentors.slice(indexOfFirstProfile, indexOfLastProfile);
  const totalPages = Math.ceil(searchFilteredMentors.length / profilesPerPage);

  // Effects
  useEffect(() => {
    if (hasProfile && currentUserProfile) {
      setFormData(currentUserProfile);
    }
  }, [hasProfile, currentUserProfile, setFormData]);

  useEffect(() => {
    setFilteredMentors(searchFilteredMentors);
  }, [searchFilteredMentors, setFilteredMentors]);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed - showProfileViewModal:', showProfileViewModal);
    if (showProfileViewModal && selectedMentor) {
      console.log('Opening profile view modal for:', selectedMentor.firstName, selectedMentor.lastName);
    }
  }, [showProfileViewModal, selectedMentor]);

  useEffect(() => {
    console.log('Modal state changed - showBookingModal:', showBookingModal);
    if (showBookingModal && selectedMentor) {
      console.log('Opening booking modal for:', selectedMentor.firstName, selectedMentor.lastName);
    }
  }, [showBookingModal, selectedMentor]);

  useEffect(() => {
    console.log('Modal state changed - showCalComModal:', showCalComModal);
    if (showCalComModal && selectedMentor) {
      console.log('Opening Cal.com modal for:', selectedMentor.firstName, selectedMentor.lastName);
    }
  }, [showCalComModal, selectedMentor]);

  // Ensure only one modal is open at a time
  useEffect(() => {
    const openModals = [showProfileViewModal, showBookingModal, showCalComModal, showProfileEdit, showAvailabilityModal, showViewBookingsModal].filter(Boolean);
    if (openModals.length > 1) {
      console.warn('Multiple modals detected as open, closing all except the last one');
      // Keep only the last opened modal
      if (showViewBookingsModal) {
        setShowProfileViewModal(false);
        setShowBookingModal(false);
        setShowCalComModal(false);
        closeProfileEditModal();
        setShowAvailabilityModal(false);
      } else if (showAvailabilityModal) {
        setShowProfileViewModal(false);
        setShowBookingModal(false);
        setShowCalComModal(false);
        closeProfileEditModal();
        setShowViewBookingsModal(false);
      } else if (showProfileEdit) {
        setShowProfileViewModal(false);
        setShowBookingModal(false);
        setShowCalComModal(false);
        setShowAvailabilityModal(false);
        setShowViewBookingsModal(false);
      } else if (showCalComModal) {
        setShowProfileViewModal(false);
        setShowBookingModal(false);
        closeProfileEditModal();
        setShowAvailabilityModal(false);
        setShowViewBookingsModal(false);
      } else if (showBookingModal) {
        setShowProfileViewModal(false);
        setShowCalComModal(false);
        closeProfileEditModal();
        setShowAvailabilityModal(false);
        setShowViewBookingsModal(false);
      } else if (showProfileViewModal) {
        setShowBookingModal(false);
        setShowCalComModal(false);
        closeProfileEditModal();
        setShowAvailabilityModal(false);
        setShowViewBookingsModal(false);
      }
    }
  }, [showProfileViewModal, showBookingModal, showCalComModal, showProfileEdit, showAvailabilityModal, showViewBookingsModal, closeProfileEditModal]);

  // Debug: Check for duplicate mentors between arrays
  useEffect(() => {
    if (bestMatches.length > 0 && searchFilteredMentors.length > 0) {
      const bestMatchUids = bestMatches.map(match => match.user.uid);
      const searchUids = searchFilteredMentors.map(mentor => mentor.uid);
      
      const duplicates = bestMatchUids.filter(uid => searchUids.includes(uid));
      
      if (duplicates.length > 0) {
        console.warn('🚨 DUPLICATE MENTORS DETECTED! 🚨');
        console.warn('These mentors appear in BOTH bestMatches AND searchFilteredMentors:');
        duplicates.forEach(uid => {
          const bestMatch = bestMatches.find(match => match.user.uid === uid);
          const searchMentor = searchFilteredMentors.find(mentor => mentor.uid === uid);
          console.warn(`- ${bestMatch?.user.firstName} ${bestMatch?.user.lastName} (${uid})`);
          console.warn('  BestMatch score:', bestMatch?.score);
          console.warn('  SearchMentor generated:', searchMentor?.isGenerated);
        });
        console.warn('This could cause double modal opening!');
      }
    }
  }, [bestMatches, searchFilteredMentors]);

  // Debug: Track ProfileViewModal rendering
  useEffect(() => {
    if (showProfileViewModal && selectedMentor) {
      console.log('🎭 ProfileViewModal RENDERED for:', selectedMentor.firstName, selectedMentor.lastName);
      console.log('🎭 Modal state:', { showProfileViewModal, selectedMentor: selectedMentor.uid });
      
      // Check DOM for multiple modal overlays
      setTimeout(() => {
        const modalOverlays = document.querySelectorAll('.profile-view-modal-overlay');
        const modalContent = document.querySelectorAll('.profile-view-modal');
        console.log('🔍 DOM Check - Modal overlays found:', modalOverlays.length);
        console.log('🔍 DOM Check - Modal content found:', modalContent.length);
        
        if (modalOverlays.length > 1) {
          console.error('🚨 MULTIPLE MODAL OVERLAYS IN DOM! 🚨');
          modalOverlays.forEach((overlay, index) => {
            console.error(`Overlay ${index}:`, overlay);
          });
        }
        
        if (modalContent.length > 1) {
          console.error('🚨 MULTIPLE MODAL CONTENT IN DOM! 🚨');
          modalContent.forEach((content, index) => {
            console.error(`Content ${index}:`, content);
          });
        }
      }, 100);
      
      return () => {
        console.log('🎭 ProfileViewModal UNMOUNTED for:', selectedMentor.firstName, selectedMentor.lastName);
      };
    }
  }, [showProfileViewModal, selectedMentor]);

  // Debug: Track ProfileEditModal rendering
  useEffect(() => {
    console.log('🔧 ProfileEditModal state changed:', { 
      showProfileEdit, 
      hasProfile, 
      currentUserProfile: currentUserProfile ? 'exists' : 'null' 
    });
    
    if (showProfileEdit && currentUserProfile) {
      console.log('🔧 ProfileEditModal should be visible');
      console.log('🔧 currentUserProfile type:', currentUserProfile.type);
    }
  }, [showProfileEdit, hasProfile, currentUserProfile]);

  // Loading state
  if (loading) {
    return (
      <div className="mentor-page mentor-page-loading">
        <Navbar />
        <div className="loading-spinner">
          <div className="pl">
            <svg className="pl__ring" viewBox="0 0 128 128" width="128" height="128">
              <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"></circle>
            </svg>
            <svg className="pl__worm" viewBox="0 0 128 128" width="128" height="128">
              <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"></circle>
            </svg>
          </div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mentor-page error-state">
        <Navbar />
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  // Role selection
  if (!selectedRole && !hasProfile) {
    return (
      <div className="mentor-page">
        <Navbar />
        <RoleSelection onRoleSelect={handleRoleSelect} />
      </div>
    );
  }

  // Profile registration
  if (selectedRole && !hasProfile) {
    return (
      <div className="mentor-page">
        <Navbar />
        <ProfileRegistrationForm
          selectedRole={selectedRole}
          profileForm={profileForm}
          validationErrors={validationErrors}
          formProgress={calculateFormProgress}
          sectionStatus={getSectionStatus}
          onBack={handleBack}
          onFormChange={handleFormChange}
          onArrayChange={handleArrayChange}
          onPastProfessionChange={handlePastProfessionChange}
          onAddPastProfession={addPastProfession}
          onRemovePastProfession={removePastProfession}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Main mentor page
  return (
    <div className="mentor-page">
      <Navbar />
      
             {/* Main Content with Sidebar Layout */}
       <div className="mentor-page-content">
         {/* Sidebar Toggle Button */}
         <button 
           className="sidebar-toggle-btn"
           onClick={toggleSidebar}
           title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
         >
           {isSidebarCollapsed ? '▶' : '◀'}
         </button>
         
         {/* Left Sidebar */}
         <div className={`mentor-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Search Container - Only show for mentees */}
          {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && (
            <div className="search-container">
              <div className="search-bar">
               <div 
                 className="search-icon"
                 style={{
                   display: typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentor' ? 'none' : 'block'
                 }}
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </div>
                             <input
                 type="text"
                 placeholder={
                   typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee'
                     ? "Search for mentors by name, skills, industry, or education..."
                     : "Search for mentees by name, skills, industry, or education..."
                 }
                 value={searchTerm}
                 onChange={handleSearchChange}
                 onClick={(e) => e.stopPropagation()}
                 style={{
                   display: typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentor' ? 'none' : 'block'
                 }}
               />
              
                             {/* Search Suggestions Dropdown - Only show for mentees */}
               {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && showSearchDropdown && searchSuggestions.length > 0 && (
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
            
                         {/* Profile Type Legend - Only show for mentees */}
             {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && searchFilteredMentors.some(m => m.isGenerated) && (
               <div className="profile-legend">
                 <span className="legend-item">
                   <span className="legend-icon real">👥</span>
                   <span className="legend-text">Real Profiles</span>
                 </span>
                 <span className="legend-item">
                   <span className="legend-icon generated">🎲</span>
                   <span className="legend-text">Generated Profiles</span>
                 </span>
               </div>
             )}
            </div>
          )}

          {/* Filters - Only show for mentees */}
           {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && (
             <MentorFilters
               selectedFilter={selectedFilter}
               onFilterChange={setSelectedFilter}
               getFilterCount={getFilterCount}
               totalMentors={availableProfiles.length}
             />
           )}
        </div>

        {/* Right Main Content */}
        <div className="mentor-main-content">
          {/* Render appropriate dashboard based on user type */}
          {currentUserProfile && (
            typeof currentUserProfile.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentor' ? (
              <MentorDashboard
                currentUserProfile={currentUserProfile}
                mentorAvailability={mentorAvailability}
                mentorBookings={mentorBookings}
                onProfileEdit={handleProfileEdit}
                onAvailabilityManage={handleAvailabilityManage}
                onViewAllBookings={handleViewAllBookings}
                onAcceptBooking={handleAcceptBooking}
                onRejectBooking={handleRejectBooking}
                onCancelBooking={handleCancelBooking}
              />
            ) : (
              <MenteeDashboard
                currentUserProfile={currentUserProfile}
                onProfileEdit={handleProfileEdit}
              />
            )
          )}

          {/* Matches Section - Only show for mentees */}
          {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && bestMatches.length > 0 && (
            <div className="main-matches-section">
              <MatchesSection
                bestMatches={bestMatches}
                currentUserProfile={currentUserProfile}
                onProfileClick={handleProfileCardClick}
                onBooking={handleBooking}
                onCalCom={handleCalCom}
              />
            </div>
          )}

          {/* Mentor Results - Only show for mentees */}
          {typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' && (
            <div className={`mentor-results ${isMenteesSectionMinimized ? 'minimized' : ''}`}>
              <div className="results-header" onClick={toggleMenteesSection}>
                <div className="results-header-content">
                  <h2>Available Mentors</h2>
                  <div className="results-summary">
                    <p>Showing {searchFilteredMentors.length} mentors</p>
                    {searchFilteredMentors.length > 0 && (
                      <div className="profile-breakdown">
                        <span className="breakdown-item">
                          <span className="breakdown-label">Real Profiles:</span>
                          <span className="breakdown-count">{searchFilteredMentors.filter(m => !m.isGenerated).length}</span>
                        </span>
                        <span className="breakdown-item">
                          <span className="breakdown-label">Generated:</span>
                          <span className="breakdown-count generated">{searchFilteredMentors.filter(m => m.isGenerated).length}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  className="minimize-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenteesSection();
                  }}
                  aria-label={isMenteesSectionMinimized ? 'Expand section' : 'Minimize section'}
                >
                  {isMenteesSectionMinimized ? '▼' : '▲'}
                </button>
              </div>

              <div className="results-content">
                {currentProfiles.length === 0 ? (
                  <div className="no-results">
                    <h3>No mentors found</h3>
                    <p>Try adjusting your search criteria or filters</p>
                  </div>
                ) : (
                  <>
                    <div className="profiles-grid">
                      {currentProfiles.map((profile) => (
                        <MentorCard
                          key={profile.uid}
                          mentor={profile}
                          mentorAvailability={mentorAvailability}
                          currentUserRole="mentee"
                          onProfileClick={handleProfileCardClick}
                          onBooking={handleBooking}
                          onCalCom={handleCalCom}
                          matchScore={getMatchScore(profile)}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <button
                          className="pagination-btn prev"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        
                        <div className="page-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`page-number ${page === currentPage ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          className="pagination-btn next"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && currentUserProfile && (
        <div className="profile-edit-modal-overlay">
          <div className="profile-edit-modal">
            <ProfileEditModal
              isOpen={showProfileEdit}
              profile={currentUserProfile}
              onClose={closeProfileEditModal}
              onSave={handleProfileSave}
              onDelete={handleProfileDelete}
              validationErrors={validationErrors}
              formProgress={calculateFormProgress}
              sectionStatus={getSectionStatus}
              onFormChange={handleFormChange}
              onArrayChange={handleArrayChange}
              onPastProfessionChange={handlePastProfessionChange}
              onAddPastProfession={addPastProfession}
              onRemovePastProfession={removePastProfession}
            />
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileViewModal && selectedMentor && (
        <div className="profile-view-modal-overlay">
          <div className="profile-view-modal">
            <ProfileViewModal
              isOpen={showProfileViewModal}
              profile={selectedMentor}
              onClose={handleCloseProfileViewModal}
              currentUserRole={typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentor' ? 'mentor' : typeof currentUserProfile?.type === 'string' && currentUserProfile.type.toLowerCase() === 'mentee' ? 'mentee' : undefined}
            />
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedMentor && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <BookingModal
              open={showBookingModal}
              mentor={selectedMentor}
              onClose={handleCloseBookingModal}
            />
          </div>
        </div>
      )}

      {/* Cal.com Modal */}
      {showCalComModal && selectedMentor && (
        <div className="calcom-modal-overlay">
          <div className="calcom-modal">
            <CalComModal
              open={showCalComModal}
              mentor={selectedMentor}
              onClose={handleCloseCalComModal}
            />
          </div>
        </div>
      )}

      {/* Availability Management Modal */}
      {showAvailabilityModal && (
        <div className="availability-modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
          <div className="availability-modal" onClick={(e) => e.stopPropagation()}>
            <div className="availability-modal-header">
              <h3>Manage Your Availability</h3>
              <button 
                className="availability-modal-close" 
                onClick={() => setShowAvailabilityModal(false)}
                title="Close availability management"
              >
                ×
              </button>
            </div>
            <div className="availability-modal-content">
              <MentorAvailability />
            </div>
          </div>
        </div>
      )}

      {/* View Bookings Modal */}
      {showViewBookingsModal && (
        <ViewBookingsModal
          isOpen={showViewBookingsModal}
          onClose={() => setShowViewBookingsModal(false)}
          bookings={Object.values(mentorBookings).flat()}
          onAcceptBooking={handleAcceptBooking}
          onRejectBooking={handleRejectBooking}
          onCancelBooking={handleCancelBooking}
        />
      )}
    </div>
  );
}
