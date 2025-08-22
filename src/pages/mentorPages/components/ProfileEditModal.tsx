import React, { useState } from 'react';
import { FaTimes, FaEdit, FaTrash, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { MentorMenteeProfile, ProfileFormData, ValidationErrors, FormProgress, SectionStatus } from '../types/mentorTypes';
import { degreePlaceholders } from '../types/mentorConstants';
import skillsByCategory from '../../../constants/skillsByCategory';
import industriesList from '../../../constants/industries';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
  import '../styles/ProfileEditModal.css';

interface ProfileEditModalProps {
  isOpen: boolean;
  profile: MentorMenteeProfile;
  onClose: () => void;
  onSave: (profileData: ProfileFormData) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  validationErrors: ValidationErrors;
  formProgress: FormProgress;
  sectionStatus: SectionStatus;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onArrayChange: (field: keyof ProfileFormData, value: string[]) => void;
  onPastProfessionChange: (index: number, value: string) => void;
  onAddPastProfession: () => void;
  onRemovePastProfession: (index: number) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  onDelete,
  validationErrors,
  formProgress,
  sectionStatus,
  onFormChange,
  onArrayChange,
  onPastProfessionChange,
  onAddPastProfession,
  onRemovePastProfession
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [devMode, setDevMode] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const success = await onSave(profile as ProfileFormData);
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

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const getFieldTooltip = (fieldName: string) => {
    const tooltips: { [key: string]: string } = {
      firstName: 'Enter your legal first name as it appears on official documents',
      lastName: 'Enter your legal last name as it appears on official documents',
      email: 'We\'ll use this to send you important updates and match notifications',
      phone: 'Your phone number helps mentors/mentees contact you for sessions',
      age: 'Your age helps us ensure appropriate matches',
      degree: 'Tell us about your highest qualification or what you\'re currently studying',
      educationLevel: 'Select the highest level of education you\'ve completed',
      county: 'Your location helps match you with nearby mentors/mentees',
      profession: 'What do you currently do for work or study?',
      pastProfessions: 'List your previous work experience to show your background',
      linkedin: 'Your LinkedIn profile helps verify your professional experience',
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

  const renderSkillsSelection = () => (
    <div className="skills-selection-container">
      <label className="field-label">
        Skills {profile.type === 'mentor' ? 'you can teach' : 'you want to learn'} *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('skills')} />
      </label>
      <div className="skills-tags-container">
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <div key={category} className="skill-category-section">
            <h5 className="category-title">{category}</h5>
            <div className="tags-grid">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`skill-tag-selectable ${
                    profile.skills?.includes(skill) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentSkills = profile.skills || [];
                    const newSkills = currentSkills.includes(skill)
                      ? currentSkills.filter(s => s !== skill)
                      : [...currentSkills, skill];
                    onArrayChange('skills', newSkills);
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {profile.skills && profile.skills.length > 0 && (
        <div className="selected-skills-summary">
          <span className="summary-label">Selected skills:</span>
          <div className="selected-tags">
            {profile.skills.map((skill, index) => (
              <span key={index} className="selected-tag">
                {skill}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newSkills = profile.skills?.filter((_, i) => i !== index) || [];
                    onArrayChange('skills', newSkills);
                  }}
                  title="Remove skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.skills && (
        <div className="validation-error">{validationErrors.skills}</div>
      )}
    </div>
  );

  const renderIndustriesSelection = () => (
    <div className="skills-selection-container">
      <label className="field-label">
        Industries {profile.type === 'mentor' ? 'you work in' : 'you\'re interested in'} *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('industries')} />
      </label>
      <div className="skills-tags-container">
        <div className="tags-grid">
          {industriesList.map((industry) => (
            <button
              key={industry}
              type="button"
              className={`skill-tag-selectable ${
                profile.industries?.includes(industry) ? 'selected' : ''
              }`}
              onClick={() => {
                const currentIndustries = profile.industries || [];
                const newIndustries = currentIndustries.includes(industry)
                  ? currentIndustries.filter(i => i !== industry)
                  : [...currentIndustries, industry];
                onArrayChange('industries', newIndustries);
              }}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>
      {profile.industries && profile.industries.length > 0 && (
        <div className="selected-skills-summary">
          <span className="summary-label">Selected industries:</span>
          <div className="selected-tags">
            {profile.industries.map((industry, index) => (
              <span key={index} className="selected-tag">
                {industry}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newIndustries = profile.industries?.filter((_, i) => i !== index) || [];
                    onArrayChange('industries', newIndustries);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.industries && (
        <div className="validation-error">{validationErrors.industries}</div>
      )}
    </div>
  );

  const renderHobbiesSelection = () => (
    <div className="hobbies-selection-container">
      <label className="field-label">
        Hobbies & Interests *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('hobbies')} />
      </label>
      <div className="hobbies-tags-container">
        {Object.entries(hobbiesByCategory).map(([category, hobbies]) => (
          <div key={category} className="hobby-category-section">
            <h5 className="category-title">{category}</h5>
            <div className="tags-grid">
              {hobbies.map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  className={`hobby-tag-selectable ${
                    profile.hobbies?.includes(hobby) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentHobbies = profile.hobbies || [];
                    const newHobbies = currentHobbies.includes(hobby)
                      ? currentHobbies.filter(h => h !== hobby)
                      : [...currentHobbies, hobby];
                    onArrayChange('hobbies', newHobbies);
                  }}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {profile.hobbies && profile.hobbies.length > 0 && (
        <div className="selected-hobbies-summary">
          <span className="summary-label">Selected hobbies:</span>
          <div className="selected-tags">
            {profile.hobbies.map((hobby, index) => (
              <span key={index} className="selected-tag">
                {hobby}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newHobbies = profile.hobbies?.filter((_, i) => i !== index) || [];
                    onArrayChange('hobbies', newHobbies);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {validationErrors.hobbies && (
        <div className="validation-error">{validationErrors.hobbies}</div>
      )}
    </div>
  );

  return (
    <>
      <div className="profile-edit-modal-overlay" onClick={onClose}>
        <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-content">
              <h3>Edit Your Profile</h3>
              <p>Update your information to improve your matches</p>
            </div>
            <div className="modal-header-actions">
              <button
                className="dev-mode-toggle"
                onClick={() => setDevMode(!devMode)}
                title="Toggle developer mode"
              >
                <FaEdit className="dev-icon" />
                {devMode ? 'Dev Mode ON' : 'Dev Mode'}
              </button>
              <button className="close-button" onClick={onClose} title="Close">
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Form Progress */}
          <div className="form-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(formProgress.completedFields / formProgress.totalFields) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              {formProgress.completedFields} of {formProgress.totalFields} fields completed
            </div>
          </div>

          {/* Section Status */}
          <div className="section-status">
            {Object.entries(sectionStatus).map(([sectionName, status]) => (
              <div key={sectionName} className="status-indicator">
                <span className={`status-dot ${status.completed ? 'completed' : 'incomplete'}`} />
                <span className="status-text">{sectionName}</span>
                <span className="status-count">({status.completed}/{status.total})</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSave} className="profile-edit-form">
            {/* Personal Information Section */}
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-firstName" className="field-label">
                    First Name *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('firstName')} />
                  </label>
                  <input
                    type="text"
                    id="edit-firstName"
                    name="firstName"
                    value={profile.firstName || ''}
                    onChange={onFormChange}
                    className={validationErrors.firstName ? 'error' : ''}
                    placeholder="Enter your first name"
                    data-tooltip={getFieldTooltip('firstName')}
                  />
                  {validationErrors.firstName && (
                    <div className="validation-error">{validationErrors.firstName}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-lastName" className="field-label">
                    Last Name *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('lastName')} />
                  </label>
                  <input
                    type="text"
                    id="edit-lastName"
                    name="lastName"
                    value={profile.lastName || ''}
                    onChange={onFormChange}
                    className={validationErrors.lastName ? 'error' : ''}
                    placeholder="Enter your last name"
                    data-tooltip={getFieldTooltip('lastName')}
                  />
                  {validationErrors.lastName && (
                    <div className="validation-error">{validationErrors.lastName}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-email" className="field-label">
                    Email Address *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('email')} />
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={profile.email || ''}
                    onChange={onFormChange}
                    className={validationErrors.email ? 'error' : ''}
                    placeholder="your.email@example.com"
                    data-tooltip={getFieldTooltip('email')}
                  />
                  {validationErrors.email && (
                    <div className="validation-error">{validationErrors.email}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-phone" className="field-label">
                    Phone Number *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('phone')} />
                  </label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={onFormChange}
                    className={validationErrors.phone ? 'error' : ''}
                    placeholder="+44 123 456 7890"
                    data-tooltip={getFieldTooltip('phone')}
                  />
                  {validationErrors.phone && (
                    <div className="validation-error">{validationErrors.phone}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-age" className="field-label">
                    Age *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('age')} />
                  </label>
                  <input
                    type="number"
                    id="edit-age"
                    name="age"
                    value={profile.age || ''}
                    onChange={onFormChange}
                    className={validationErrors.age ? 'error' : ''}
                    placeholder="Enter your age"
                    data-tooltip={getFieldTooltip('age')}
                  />
                  {validationErrors.age && (
                    <div className="validation-error">{validationErrors.age}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-county" className="field-label">
                    County/Location *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('county')} />
                  </label>
                  <select
                    id="edit-county"
                    name="county"
                    value={profile.county || ''}
                    onChange={onFormChange}
                    className={validationErrors.county ? 'error' : ''}
                    data-tooltip={getFieldTooltip('county')}
                  >
                    <option value="">Select your county</option>
                    {ukCounties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                  {validationErrors.county && (
                    <div className="validation-error">{validationErrors.county}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Education & Career Section */}
            <div className="form-section">
              <h4>Education & Career</h4>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-degree" className="field-label">
                    Degree/Qualification *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('degree')} />
                  </label>
                  <input
                    type="text"
                    id="edit-degree"
                    name="degree"
                    value={profile.degree || ''}
                    onChange={onFormChange}
                    className={validationErrors.degree ? 'error' : ''}
                    placeholder={degreePlaceholders[profile.educationLevel || ''] || "e.g., BSc Computer Science"}
                    data-tooltip={getFieldTooltip('degree')}
                  />
                  {validationErrors.degree && (
                    <div className="validation-error">{validationErrors.degree}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-educationLevel" className="field-label">
                    Education Level *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('educationLevel')} />
                  </label>
                  <select
                    id="edit-educationLevel"
                    name="educationLevel"
                    value={profile.educationLevel || ''}
                    onChange={onFormChange}
                    className={validationErrors.educationLevel ? 'error' : ''}
                    data-tooltip={getFieldTooltip('educationLevel')}
                  >
                    <option value="">Select education level</option>
                    {ukEducationLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  {validationErrors.educationLevel && (
                    <div className="validation-error">{validationErrors.educationLevel}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-profession" className="field-label">
                    Current Profession *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('profession')} />
                  </label>
                  <input
                    type="text"
                    id="edit-profession"
                    name="profession"
                    value={profile.profession || ''}
                    onChange={onFormChange}
                    className={validationErrors.profession ? 'error' : ''}
                    placeholder="e.g., Software Developer, Student, Teacher"
                    data-tooltip={getFieldTooltip('profession')}
                  />
                  {validationErrors.profession && (
                    <div className="validation-error">{validationErrors.profession}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-linkedin" className="field-label">
                    LinkedIn Profile *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('linkedin')} />
                  </label>
                  <input
                    type="url"
                    id="edit-linkedin"
                    name="linkedin"
                    value={profile.linkedin || ''}
                    onChange={onFormChange}
                    className={validationErrors.linkedin ? 'error' : ''}
                    placeholder="https://linkedin.com/in/yourprofile"
                    data-tooltip={getFieldTooltip('linkedin')}
                  />
                  {validationErrors.linkedin && (
                    <div className="validation-error">{validationErrors.linkedin}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-calCom" className="field-label">
                    Cal.com Username
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('calCom')} />
                  </label>
                  <input
                    type="text"
                    id="edit-calCom"
                    name="calCom"
                    value={profile.calCom || ''}
                    onChange={onFormChange}
                    placeholder="yourusername"
                    data-tooltip={getFieldTooltip('calCom')}
                  />
                </div>
              </div>

              {/* Past Professions */}
              <div className="past-professions-container">
                <label className="field-label">
                  Past Professions *
                  <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('pastProfessions')} />
                </label>
                {(profile.pastProfessions || ['']).map((profession, index) => (
                  <div key={index} className="profession-input-row">
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => onPastProfessionChange(index, e.target.value)}
                      placeholder={`Past profession ${index + 1}`}
                      data-tooltip={getFieldTooltip('pastProfessions')}
                    />
                    {(profile.pastProfessions || []).length > 1 && (
                      <button
                        type="button"
                        className="remove-profession-btn"
                        onClick={() => onRemovePastProfession(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-profession-btn"
                  onClick={onAddPastProfession}
                >
                  + Add Another Profession
                </button>
                {validationErrors.pastProfessions && (
                  <div className="validation-error">{validationErrors.pastProfessions}</div>
                )}
              </div>
            </div>

            {/* Skills & Interests Section */}
            <div className="form-section">
              <h4>Skills & Interests</h4>
              {renderSkillsSelection()}
              {renderIndustriesSelection()}
              {renderHobbiesSelection()}
            </div>

            {/* Additional Information Section */}
            <div className="form-section">
              <h4>Additional Information</h4>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="edit-ethnicity" className="field-label">
                    Ethnicity *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('ethnicity')} />
                  </label>
                  <select
                    id="edit-ethnicity"
                    name="ethnicity"
                    value={profile.ethnicity || ''}
                    onChange={onFormChange}
                    className={validationErrors.ethnicity ? 'error' : ''}
                    data-tooltip={getFieldTooltip('ethnicity')}
                  >
                    <option value="">Select ethnicity</option>
                    {ethnicityOptions.map(ethnicity => (
                      <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                    ))}
                  </select>
                  {validationErrors.ethnicity && (
                    <div className="validation-error">{validationErrors.ethnicity}</div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="edit-religion" className="field-label">
                    Religion *
                    <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('religion')} />
                  </label>
                  <select
                    id="edit-religion"
                    name="religion"
                    value={profile.religion || ''}
                    onChange={onFormChange}
                    className={validationErrors.religion ? 'error' : ''}
                    data-tooltip={getFieldTooltip('religion')}
                  >
                    <option value="">Select religion</option>
                    {religionOptions.map(religion => (
                      <option key={religion} value={religion}>{religion}</option>
                    ))}
                  </select>
                  {validationErrors.religion && (
                    <div className="validation-error">{validationErrors.religion}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Developer Mode Section */}
            {devMode && (
              <div className="developer-mode-section">
                <div className="dev-section-header">
                  <h4>⚠️ Developer Mode</h4>
                  <p>Advanced options for development and testing</p>
                </div>
                
                <div className="dev-warning">
                  <FaExclamationTriangle />
                  <span>These actions cannot be undone!</span>
                </div>
                
                <div className="dev-actions">
                  <button
                    type="button"
                    className="delete-profile-button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    <FaTrash />
                    {isDeleting ? 'Deleting...' : 'Delete Profile'}
                  </button>
                </div>
                
                <div className="dev-info">
                  <p><strong>Profile ID:</strong> {profile.id || 'Not assigned'}</p>
                  <p><strong>User Type:</strong> {profile.type || 'Unknown'}</p>
                  <p><strong>Created:</strong> {profile.createdAt ? new Date(profile.createdAt as string).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modal-overlay" onClick={cancelDelete}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-modal-header">
              <h3>⚠️ Confirm Profile Deletion</h3>
            </div>
            <div className="delete-confirm-modal-content">
              <div className="delete-warning">
                <h4>This action cannot be undone!</h4>
                <p>Deleting your profile will:</p>
                <ul>
                  <li>Remove all your profile information</li>
                  <li>Cancel any pending bookings</li>
                  <li>Remove you from the matching system</li>
                </ul>
              </div>
              <div className="delete-note">
                <h5>Note:</h5>
                <p>If you want to keep your account but just update your information, use the "Save Changes" button instead.</p>
              </div>
              <div className="delete-confirm-actions">
                <button className="cancel-delete-button" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="confirm-delete-button" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Yes, Delete My Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
