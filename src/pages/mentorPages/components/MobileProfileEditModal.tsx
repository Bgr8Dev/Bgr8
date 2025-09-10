import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaEdit, FaTrash, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import { MentorMenteeProfile, ProfileFormData, ValidationErrors, FormProgress } from '../types/mentorTypes';
import { degreePlaceholders } from '../types/mentorConstants';
import skillsByCategory from '../../../constants/skillsByCategory';
import industriesList from '../../../constants/industries';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import '../styles/MobileProfileEditModal.css';

interface MobileProfileEditModalProps {
  isOpen: boolean;
  profile: MentorMenteeProfile;
  onClose: () => void;
  onSave: (profileData: ProfileFormData) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  validationErrors: ValidationErrors;
  formProgress: FormProgress;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onArrayChange: (field: keyof ProfileFormData, value: string[]) => void;
  onPastProfessionChange: (index: number, value: string) => void;
  onAddPastProfession: () => void;
  onRemovePastProfession: (index: number) => void;
}

export const MobileProfileEditModal: React.FC<MobileProfileEditModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  onDelete,
  validationErrors,
  formProgress,
  onFormChange,
  onArrayChange,
  onPastProfessionChange,
  onAddPastProfession,
  onRemovePastProfession
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [devMode, setDevMode] = useState(false);
  
  // Local form state for editing
  const [localFormData, setLocalFormData] = useState<ProfileFormData>(profile);

  // Sync local form data with profile prop when it changes
  useEffect(() => {
    setLocalFormData(profile);
  }, [profile]);

  if (!isOpen) return null;

  // Define sections for mobile navigation
  const sections = [
    { id: 'personal', name: 'Personal', icon: '👤' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'skills', name: 'Skills', icon: '💼' },
    { id: 'additional', name: 'Additional', icon: 'ℹ️' }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const success = await onSave(localFormData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const success = await onDelete();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFieldTooltip = (fieldName: string) => {
    const tooltips: { [key: string]: string } = {
      firstName: 'Enter your legal first name as it appears on official documents',
      lastName: 'Enter your legal last name as it appears on official documents',
      email: 'We\'ll use this to send you important updates and match notifications',
      phone: 'Your phone number helps mentors/mentees contact you for sessions',
      age: 'Your age helps us ensure appropriate matches',
      degree: (profile.isMentor ? 'Tell us about your highest qualification or what you\'re currently studying'
        : 'Tell us about your current education level and what you\'re studying'),
      educationLevel: (profile.isMentor ? 'Select the highest level of education you\'ve completed'
        : 'Select your current education level'),
      county: 'Your location helps match you with nearby mentors/mentees',
      profession: (profile.isMentor ? 'What do you currently do for work? This helps mentees understand your expertise'
        : 'What career path are you interested in pursuing? This helps mentors provide relevant guidance'),
      pastProfessions: 'List your previous work experience to show your background and expertise',
      linkedin: (profile.isMentor ? 'Your LinkedIn profile helps verify your professional experience'
        : 'Your LinkedIn profile helps verify your professional experience (optional for mentees)'),
      calCom: 'Connect your Cal.com account to enable video call scheduling',
      skills: 'Select the skills you can teach (mentors) or want to learn (mentees)',
      industries: 'Choose the industries you work in or are interested in',
      hobbies: 'Your interests help create better matches and conversation starters',
      ethnicity: 'This helps us create diverse and inclusive mentoring relationships',
      religion: 'This helps us respect your beliefs when making matches',
      lookingFor: 'What specific skills or knowledge are you looking to gain?'
    };
    return tooltips[fieldName] || '';
  };

  const handleLocalArrayChange = (field: keyof ProfileFormData, value: string[]) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
    onArrayChange(field, value);
  };

  const renderSkillsSelection = () => (
    <div className="mpem-skills-selection-container">
      <label className="mpem-field-label">
        Skills {profile.isMentor ? 'you can teach' : 'you want to learn'} *
        <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('skills')} />
      </label>
      <div className="mpem-skills-tags-container">
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <div key={category} className="mpem-skill-category-section">
            <h5 className="mpem-category-title">{category}</h5>
            <div className="mpem-tags-grid">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`mpem-skill-tag-selectable ${
                    localFormData.skills?.includes(skill) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentSkills = localFormData.skills || [];
                    const newSkills = currentSkills.includes(skill)
                      ? currentSkills.filter(s => s !== skill)
                      : [...currentSkills, skill];
                    handleLocalArrayChange('skills', newSkills);
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {localFormData.skills && localFormData.skills.length > 0 && (
        <div className="mpem-selected-skills-summary">
          <span className="mpem-summary-label">Selected skills:</span>
          <div className="mpem-selected-tags">
            {localFormData.skills.map((skill, index) => (
              <span key={index} className="mpem-selected-tag">
                {skill}
                <button
                  type="button"
                  className="mpem-remove-tag"
                  onClick={() => {
                    const newSkills = localFormData.skills?.filter((_, i) => i !== index) || [];
                    handleLocalArrayChange('skills', newSkills);
                  }}
                  title="Remove skill"
                  aria-label="Remove skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.skills && (
        <div className="mpem-validation-error">{validationErrors.skills}</div>
      )}
    </div>
  );

  const renderIndustriesSelection = () => (
    <div className="mpem-skills-selection-container">
      <label className="mpem-field-label">
        Industries {profile.isMentor ? 'you work in' : 'you\'re interested in'} *
        <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('industries')} />
      </label>
      <div className="mpem-skills-tags-container">
        <div className="mpem-tags-grid">
          {industriesList.map((industry) => (
            <button
              key={industry}
              type="button"
              className={`mpem-skill-tag-selectable ${
                localFormData.industries?.includes(industry) ? 'selected' : ''
              }`}
              onClick={() => {
                const currentIndustries = localFormData.industries || [];
                const newIndustries = currentIndustries.includes(industry)
                  ? currentIndustries.filter(i => i !== industry)
                  : [...currentIndustries, industry];
                handleLocalArrayChange('industries', newIndustries);
              }}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>
      {localFormData.industries && localFormData.industries.length > 0 && (
        <div className="mpem-selected-skills-summary">
          <span className="mpem-summary-label">Selected industries:</span>
          <div className="mpem-selected-tags">
            {localFormData.industries.map((industry, index) => (
              <span key={index} className="mpem-selected-tag">
                {industry}
                <button
                  type="button"
                  className="mpem-remove-tag"
                  onClick={() => {
                    const newIndustries = localFormData.industries?.filter((_, i) => i !== index) || [];
                    handleLocalArrayChange('industries', newIndustries);
                  }}
                  title="Remove industry"
                  aria-label="Remove industry"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.industries && (
        <div className="mpem-validation-error">{validationErrors.industries}</div>
      )}
    </div>
  );

  const renderHobbiesSelection = () => (
    <div className="mpem-hobbies-selection-container">
      <label className="mpem-field-label">
        Hobbies & Interests *
        <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('hobbies')} />
      </label>
      <div className="mpem-hobbies-tags-container">
        {Object.entries(hobbiesByCategory).map(([category, hobbies]) => (
          <div key={category} className="mpem-hobby-category-section">
            <h5 className="mpem-category-title">{category}</h5>
            <div className="mpem-tags-grid">
              {hobbies.map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  className={`mpem-hobby-tag-selectable ${
                    localFormData.hobbies?.includes(hobby) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentHobbies = localFormData.hobbies || [];
                    const newHobbies = currentHobbies.includes(hobby)
                      ? currentHobbies.filter(h => h !== hobby)
                      : [...currentHobbies, hobby];
                    handleLocalArrayChange('hobbies', newHobbies);
                  }}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {localFormData.hobbies && localFormData.hobbies.length > 0 && (
        <div className="mpem-selected-hobbies-summary">
          <span className="mpem-summary-label">Selected hobbies:</span>
          <div className="mpem-selected-tags">
            {localFormData.hobbies.map((hobby, index) => (
              <span key={index} className="mpem-selected-tag">
                {hobby}
                <button
                  type="button"
                  className="mpem-remove-tag"
                  onClick={() => {
                    const newHobbies = localFormData.hobbies?.filter((_, i) => i !== index) || [];
                    handleLocalArrayChange('hobbies', newHobbies);
                  }}
                  title="Remove hobby"
                  aria-label="Remove hobby"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.hobbies && (
        <div className="mpem-validation-error">{validationErrors.hobbies}</div>
      )}
    </div>
  );

  const renderLookingForSelection = () => {
    if (!profile.isMentee) return null;

    return (
      <div className="mpem-looking-for-container">
        <label className="mpem-field-label">
          What are you looking to learn? *
          <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('lookingFor')} />
        </label>
        <div className="mpem-looking-for-tags-container">
          <div className="mpem-tags-grid">
            {Object.values(skillsByCategory).flat().map((skill) => (
              <button
                key={skill}
                type="button"
                className={`mpem-skill-tag-selectable ${
                  profile.lookingFor?.includes(skill) ? 'selected' : ''
                }`}
                onClick={() => {
                  const currentLookingFor = profile.lookingFor || [];
                  const newLookingFor = currentLookingFor.includes(skill)
                    ? currentLookingFor.filter(s => s !== skill)
                    : [...currentLookingFor, skill];
                  onArrayChange('lookingFor', newLookingFor);
                }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <div className="mpem-selected-looking-for-summary">
            <span className="mpem-summary-label">Learning goals:</span>
            <div className="mpem-selected-tags">
              {profile.lookingFor.map((goal, index) => (
                <span key={index} className="mpem-selected-tag">
                  {goal}
                  <button
                    type="button"
                    className="mpem-remove-tag"
                    onClick={() => {
                      const newLookingFor = profile.lookingFor?.filter((_, i) => i !== index) || [];
                      onArrayChange('lookingFor', newLookingFor);
                    }}
                    title="Remove learning goal"
                    aria-label="Remove learning goal"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        {validationErrors.lookingFor && (
          <div className="mpem-validation-error">{validationErrors.lookingFor}</div>
        )}
      </div>
    );
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Personal Information
        return (
          <div className="mpem-section">
            <h3 className="mpem-section-title">Personal Information</h3>
            <div className="mpem-form-fields">
              <div className="mpem-input-group">
                <label htmlFor="firstName" className="mpem-field-label">
                  First Name *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('firstName')} />
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={profile.firstName || ''}
                  onChange={onFormChange}
                  placeholder="Enter your first name"
                  className={validationErrors.firstName ? 'error' : ''}
                />
                {validationErrors.firstName && (
                  <p className="mpem-validation-error">{validationErrors.firstName}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="lastName" className="mpem-field-label">
                  Last Name *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('lastName')} />
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={profile.lastName || ''}
                  onChange={onFormChange}
                  placeholder="Enter your last name"
                  className={validationErrors.lastName ? 'error' : ''}
                />
                {validationErrors.lastName && (
                  <p className="mpem-validation-error">{validationErrors.lastName}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="email" className="mpem-field-label">
                  Email Address *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('email')} />
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={onFormChange}
                  placeholder="your.email@example.com"
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && (
                  <p className="mpem-validation-error">{validationErrors.email}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="phone" className="mpem-field-label">
                  Phone Number *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('phone')} />
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={onFormChange}
                  placeholder="+44 123 456 7890"
                  className={validationErrors.phone ? 'error' : ''}
                />
                {validationErrors.phone && (
                  <p className="mpem-validation-error">{validationErrors.phone}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="age" className="mpem-field-label">
                  Age *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('age')} />
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  value={profile.age || ''}
                  onChange={onFormChange}
                  placeholder="Enter your age"
                  className={validationErrors.age ? 'error' : ''}
                />
                {validationErrors.age && (
                  <p className="mpem-validation-error">{validationErrors.age}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="county" className="mpem-field-label">
                  County/Location *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('county')} />
                </label>
                <select
                  id="county"
                  name="county"
                  value={profile.county || ''}
                  onChange={onFormChange}
                  className={validationErrors.county ? 'error' : ''}
                >
                  <option value="">Select your county</option>
                  {ukCounties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                {validationErrors.county && (
                  <p className="mpem-validation-error">{validationErrors.county}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1: // Education & Career
        return (
          <div className="mpem-section">
            <h3 className="mpem-section-title">Education & Career</h3>
            <div className="mpem-form-fields">
              <div className="mpem-input-group">
                <label htmlFor="degree" className="mpem-field-label">
                  {profile.isMentor ? 'Degree/Qualification' : 'Education/Studies'} *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('degree')} />
                </label>
                <input
                  id="degree"
                  name="degree"
                  value={profile.degree || ''}
                  onChange={onFormChange}
                  placeholder={profile.isMentor 
                    ? (degreePlaceholders[profile.educationLevel || ''] || "e.g., BSc Computer Science")
                    : "e.g., A-Levels, GCSEs, or what you're currently studying"
                  }
                  className={validationErrors.degree ? 'error' : ''}
                />
                {validationErrors.degree && (
                  <p className="mpem-validation-error">{validationErrors.degree}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="educationLevel" className="mpem-field-label">
                  {profile.isMentor ? 'Education Level' : 'Current Education Level'} *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('educationLevel')} />
                </label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={profile.educationLevel || ''}
                  onChange={onFormChange}
                  className={validationErrors.educationLevel ? 'error' : ''}
                >
                  <option value="">Select education level</option>
                  {ukEducationLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {validationErrors.educationLevel && (
                  <p className="mpem-validation-error">{validationErrors.educationLevel}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="profession" className="mpem-field-label">
                  {profile.isMentor ? 'Current Profession' : 'Desired Profession'} *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('profession')} />
                </label>
                <input
                  id="profession"
                  name="profession"
                  value={profile.profession || ''}
                  onChange={onFormChange}
                  placeholder={profile.isMentor 
                    ? "e.g., Software Developer, Teacher" 
                    : "e.g., Software Developer, Doctor, Engineer"
                  }
                  className={validationErrors.profession ? 'error' : ''}
                />
                {validationErrors.profession && (
                  <p className="mpem-validation-error">{validationErrors.profession}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="linkedin" className="mpem-field-label">
                  LinkedIn Profile
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('linkedin')} />
                </label>
                <input
                  id="linkedin"
                  type="url"
                  name="linkedin"
                  value={profile.linkedin || ''}
                  onChange={onFormChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              {/* Cal.com field - Only for mentors */}
              {profile.isMentor && (
                <div className="mpem-input-group">
                  <label htmlFor="calCom" className="mpem-field-label">
                    Cal.com Public Page Link
                    <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('calCom')} />
                  </label>
                  <input
                    id="calCom"
                    type="url"
                    name="calCom"
                    value={profile.calCom || ''}
                    onChange={onFormChange}
                    placeholder="https://cal.com/yourusername"
                  />
                </div>
              )}

              {/* Past Professions - Only for mentors */}
              {profile.isMentor && (
                <div className="mpem-past-professions-container">
                  <label className="mpem-field-label">
                    Past Professions *
                    <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('pastProfessions')} />
                  </label>
                  {(profile.pastProfessions || ['']).map((profession, index) => (
                    <div key={index} className="mpem-profession-input-row">
                      <input
                        type="text"
                        value={profession}
                        onChange={(e) => onPastProfessionChange(index, e.target.value)}
                        placeholder={`Past profession ${index + 1}`}
                      />
                      {(profile.pastProfessions || []).length > 1 && (
                        <button
                          type="button"
                          className="mpem-remove-profession-btn"
                          onClick={() => onRemovePastProfession(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mpem-add-profession-btn"
                    onClick={onAddPastProfession}
                  >
                    + Add Another Profession
                  </button>
                  {validationErrors.pastProfessions && (
                    <div className="mpem-validation-error">{validationErrors.pastProfessions}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Skills & Interests
        return (
          <div className="mpem-section">
            <h3 className="mpem-section-title">Skills & Interests</h3>
            <div className="mpem-form-fields">
              {renderSkillsSelection()}
              {renderIndustriesSelection()}
              {renderHobbiesSelection()}
            </div>
          </div>
        );

      case 3: // Additional Information
        return (
          <div className="mpem-section">
            <h3 className="mpem-section-title">Additional Information</h3>
            <div className="mpem-form-fields">
              <div className="mpem-input-group">
                <label htmlFor="ethnicity" className="mpem-field-label">
                  Ethnicity *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('ethnicity')} />
                </label>
                <select
                  id="ethnicity"
                  name="ethnicity"
                  value={profile.ethnicity || ''}
                  onChange={onFormChange}
                  className={validationErrors.ethnicity ? 'error' : ''}
                >
                  <option value="">Select ethnicity</option>
                  {ethnicityOptions.map(ethnicity => (
                    <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                  ))}
                </select>
                {validationErrors.ethnicity && (
                  <p className="mpem-validation-error">{validationErrors.ethnicity}</p>
                )}
              </div>

              <div className="mpem-input-group">
                <label htmlFor="religion" className="mpem-field-label">
                  Religion *
                  <FaInfoCircle className="mpem-info-icon" data-tooltip={getFieldTooltip('religion')} />
                </label>
                <select
                  id="religion"
                  name="religion"
                  value={profile.religion || ''}
                  onChange={onFormChange}
                  className={validationErrors.religion ? 'error' : ''}
                >
                  <option value="">Select religion</option>
                  {religionOptions.map(religion => (
                    <option key={religion} value={religion}>{religion}</option>
                  ))}
                </select>
                {validationErrors.religion && (
                  <p className="mpem-validation-error">{validationErrors.religion}</p>
                )}
              </div>

              {/* Looking For - Only for mentees */}
              {renderLookingForSelection()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const modalContent = (
    <>
      {/* Mobile Modal Overlay */}
      <div 
        className="mpem-overlay"
        onClick={onClose}
      >
        <div 
          className="mpem-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mpem-header">
            <div className="mpem-header-content">
              <div className="mpem-header-left">
                <button
                  className="mpem-close-btn"
                  onClick={onClose}
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
                <div className="mpem-title-section">
                  <h2 className="mpem-title">Edit Profile</h2>
                  <p className="mpem-progress-text">
                    {formProgress.completedFields} of {formProgress.totalFields} fields completed
                  </p>
                </div>
              </div>
              <button
                className={`mpem-dev-toggle ${devMode ? 'active' : ''}`}
                onClick={() => setDevMode(!devMode)}
              >
                <FaEdit />
                {devMode ? 'Dev ON' : 'Dev'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mpem-progress-container">
              <div className="mpem-progress-bar">
                <div 
                  className="mpem-progress-fill" 
                  style={{ width: `${(formProgress.completedFields / formProgress.totalFields) * 100}%` }}
                />
              </div>
            </div>

            {/* Section Navigation */}
            <div className="mpem-navigation">
              <button
                className="mpem-nav-btn"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="mpem-section-indicators">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    className={`mpem-section-indicator ${index === currentSection ? 'active' : ''}`}
                    onClick={() => setCurrentSection(index)}
                  >
                    <span className="mpem-section-icon">{section.icon}</span>
                    <span className="mpem-section-name">{section.name}</span>
                  </button>
                ))}
              </div>

              <button
                className="mpem-nav-btn"
                onClick={nextSection}
                disabled={currentSection === sections.length - 1}
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mpem-content">
            <form onSubmit={handleSave} className="mpem-form">
              {renderSection()}
            </form>
          </div>

          {/* Footer */}
          <div className="mpem-footer">
            <div className="mpem-footer-actions">
              <button
                type="button"
                className="mpem-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mpem-save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Developer Mode Section */}
            {devMode && (
              <div className="mpem-dev-section">
                <div className="mpem-dev-header">
                  <FaExclamationTriangle />
                  <span>Developer Mode</span>
                </div>
                <button
                  type="button"
                  className="mpem-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <FaTrash />
                  {isDeleting ? 'Deleting...' : 'Delete Profile'}
                </button>
                <div className="mpem-dev-info">
                  <p><strong>Profile ID:</strong> {profile.uid || 'Not assigned'}</p>
                  <p><strong>User Type:</strong> {profile.isMentor ? 'Mentor' : 'Mentee'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="mpem-delete-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mpem-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mpem-delete-content">
              <FaExclamationTriangle className="mpem-delete-icon" />
              <h3 className="mpem-delete-title">Delete Profile?</h3>
              <p className="mpem-delete-message">
                This action cannot be undone. All your profile information will be permanently deleted.
              </p>
              <div className="mpem-delete-actions">
                <button
                  className="mpem-delete-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="mpem-delete-confirm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(modalContent, document.body);
};
