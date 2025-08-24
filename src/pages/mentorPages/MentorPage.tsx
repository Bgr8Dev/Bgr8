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
import { default as BookingModal } from '../../components/widgets/MentorAlgorithm/booking/BookingModal';
import { default as CalComModal } from '../../components/widgets/MentorAlgorithm/CalCom/CalComModal';
import { default as MentorAvailability } from '../../components/widgets/MentorAlgorithm/MentorAvailability';
import Navbar from '../../components/ui/Navbar';
import './styles/MentorPage.css';

export default function MentorPage() {
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  // Modal state management
  const [showProfileViewModal, setShowProfileViewModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalComModal, setShowCalComModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorMenteeProfile | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [mentorsPerPage] = useState(12);

  // Custom hooks for data management
  const {
    mentors,
    setFilteredMentors,
    loading,
    error,
    setError,
    mentorAvailability,
    hasProfile,
    currentUserProfile,
    bestMatches,
    loadingMatches,
    fetchEnhancedAvailability,
    fetchMentorBookings,
    findMatches,
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
  } = useMentorSearch(mentors, mentorAvailability);

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
    
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!selectedRole) return;

    const profileData = {
      ...profileForm,
      type: selectedRole,
      uid: currentUser?.uid || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await createProfile(profileData);
    if (success) {
      setSelectedRole(null);
      resetForm();
    }
  };

  const handleProfileEdit = () => {
    if (currentUserProfile) {
      setFormData(currentUserProfile);
      setShowProfileEdit(true);
    }
  };

  const handleProfileSave = async (profileData: ProfileFormData) => {
    const updatedProfile = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    const success = await updateProfile(updatedProfile);
    if (success) {
      setShowProfileEdit(false);
    }
    return success;
  };

  const handleProfileDelete = async () => {
    const success = await deleteProfile();
    if (success) {
      setShowProfileEdit(false);
    }
    return success;
  };

  const handleFindMatches = async () => {
    await findMatches();
  };

  const handleAvailabilityManage = () => {
    setShowAvailabilityModal(true);
  };

  const handleProfileCardClick = (mentor: MentorMenteeProfile) => {
    setSelectedMentor(mentor);
    setShowProfileViewModal(true);
    fetchEnhancedAvailability(mentor.uid);
    fetchMentorBookings(mentor.uid);
  };

  const handleBooking = (mentor: MentorMenteeProfile) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
    console.log('Booking not yet implemented for:', mentor.firstName);
  };

  const handleCalCom = (mentor: MentorMenteeProfile) => {
    setSelectedMentor(mentor);
    setShowCalComModal(true);
    console.log('Cal.com integration not yet implemented for:', mentor.firstName);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination
  const indexOfLastMentor = currentPage * mentorsPerPage;
  const indexOfFirstMentor = indexOfLastMentor - mentorsPerPage;
  const currentMentors = searchFilteredMentors.slice(indexOfFirstMentor, indexOfLastMentor);
  const totalPages = Math.ceil(searchFilteredMentors.length / mentorsPerPage);

  // Effects
  useEffect(() => {
    if (hasProfile && currentUserProfile) {
      setFormData(currentUserProfile);
    }
  }, [hasProfile, currentUserProfile]);

  useEffect(() => {
    setFilteredMentors(searchFilteredMentors);
  }, [searchFilteredMentors, setFilteredMentors]);

  // Loading state
  if (loading) {
    return (
      <div className="mentor-page mentor-page-loading">
        <Navbar />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading mentor program...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mentor-page error-state">
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
          formProgress={calculateFormProgress()}
          sectionStatus={getSectionStatus()}
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
      {/* Hero Section */}
      <div className="mentor-header">
        <Navbar isMentorPage={true} />
        <div className="mentor-header-content">
          <h1>
            {currentUserProfile?.type === 'mentee' 
              ? 'Find Your Perfect Mentor' 
              : 'Connect with Other Mentors'
            }
          </h1>
          <p>
            {currentUserProfile?.type === 'mentee'
              ? 'Connect with experienced professionals who can guide you on your journey to success'
              : 'Network and collaborate with fellow mentors to share knowledge and best practices'
            }
          </p>
          
          {/* Generated Profiles Info */}
          <div className="generated-profiles-info">
            <p className="info-text">
              💡 <strong>Tip:</strong> This platform includes both real user profiles and generated test profiles 
              (marked with 🎲) to help you explore the matching system and test features.
            </p>
          </div>
          
          {/* User Profile Summary */}
          {currentUserProfile && (
            <div className="user-profile-summary">
              <div className="profile-info">
                <div className={`profile-role ${currentUserProfile.type === 'MENTOR' ? 'mentor' : 'mentee'}`}>
                  {currentUserProfile.type === 'MENTOR' ? 'Mentor' : 'Mentee'}
                </div>
                <div className="profile-name">
                  {currentUserProfile.firstName} {currentUserProfile.lastName}
                </div>
              </div>
              
              <div className="profile-actions">
                <button 
                  className="profile-edit-btn"
                  onClick={handleProfileEdit}
                  data-tooltip="Edit your profile information"
                >
                  Edit Profile
                </button>
                <button 
                  className="find-matches-btn"
                  onClick={handleFindMatches}
                  disabled={loadingMatches}
                  data-tooltip="Find mentors/mentees that match your profile"
                >
                  {loadingMatches ? 'Finding Matches...' : 'Find Matches'}
                </button>
                <button 
                  className="availability-manage-btn"
                  onClick={handleAvailabilityManage}
                  data-tooltip="Manage your availability schedule"
                >
                  Manage Availability
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Container */}
      <div className="search-container">
        <div className="search-bar">
          <div className="search-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder={
              currentUserProfile?.type === 'mentee'
                ? "Search for mentors by name, skills, industry, or education..."
                : "Search for other mentors by name, skills, industry, or education..."
            }
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Search Suggestions Dropdown */}
          {showSearchDropdown && searchSuggestions.length > 0 && (
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
        
        {/* Profile Type Legend */}
        {searchFilteredMentors.some(m => m.isGenerated) && (
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

      {/* Filters */}
      <MentorFilters
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        getFilterCount={getFilterCount}
        totalMentors={searchFilteredMentors.length}
      />

      {/* Matches Section */}
      {bestMatches.length > 0 && (
        <MatchesSection
          bestMatches={bestMatches}
          currentUserProfile={currentUserProfile}
          onProfileClick={handleProfileCardClick}
          onBooking={handleBooking}
          onCalCom={handleCalCom}
        />
      )}

      {/* Mentor Results */}
      <div className="mentor-results">
        <div className="results-header">
          <h2>
            {currentUserProfile?.type === 'mentee' 
              ? 'Available Mentors' 
              : 'Other Mentors'
            }
          </h2>
          <div className="results-summary">
            <p>
              Showing {searchFilteredMentors.length} {
                currentUserProfile?.type === 'mentee' ? 'mentors' : 'mentors'
              }
            </p>
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

        {currentMentors.length === 0 ? (
          <div className="no-results">
            <h3>
              {currentUserProfile?.type === 'mentee' 
                ? 'No mentors found' 
                : 'No other mentors found'
              }
            </h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <>
            <div className="mentors-grid">
              {currentMentors.map((mentor) => (
                <MentorCard
                  key={mentor.uid}
                  mentor={mentor}
                  mentorAvailability={mentorAvailability}
                  currentUserRole={currentUserProfile?.type === 'mentor' || currentUserProfile?.type === 'mentee' ? currentUserProfile.type : undefined}
                  onProfileClick={handleProfileCardClick}
                  onBooking={handleBooking}
                  onCalCom={handleCalCom}
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

      {/* Profile Edit Modal */}
      {showProfileEdit && currentUserProfile && (
        <ProfileEditModal
          isOpen={showProfileEdit}
          profile={currentUserProfile}
          onClose={() => setShowProfileEdit(false)}
          onSave={handleProfileSave}
          onDelete={handleProfileDelete}
          validationErrors={validationErrors}
          formProgress={calculateFormProgress()}
          sectionStatus={getSectionStatus()}
          onFormChange={handleFormChange}
          onArrayChange={handleArrayChange}
          onPastProfessionChange={handlePastProfessionChange}
          onAddPastProfession={addPastProfession}
          onRemovePastProfession={removePastProfession}
        />
      )}

      {/* Profile View Modal */}
      {showProfileViewModal && selectedMentor && (
        <ProfileViewModal
          isOpen={showProfileViewModal}
          profile={selectedMentor}
          onClose={() => setShowProfileViewModal(false)}
          currentUserRole={currentUserProfile?.type === 'mentor' || currentUserProfile?.type === 'mentee' ? currentUserProfile.type : undefined}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedMentor && (
        <BookingModal
          open={showBookingModal}
          mentor={selectedMentor}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* Cal.com Modal */}
      {showCalComModal && selectedMentor && (
        <CalComModal
          open={showCalComModal}
          mentor={selectedMentor}
          onClose={() => setShowCalComModal(false)}
        />
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
    </div>
  );
}
