import React from 'react';
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { UserType, MENTOR, MENTEE, ProfileFormData, ValidationErrors, FormProgress, SectionStatus } from '../types/mentorTypes';
import { degreePlaceholders } from '../types/mentorConstants';
import skillsByCategory from '../../../constants/skillsByCategory';
import industriesList from '../../../constants/industries';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import '../styles/ProfileRegistrationForm.css';

interface ProfileRegistrationFormProps {
  selectedRole: UserType;
  profileForm: ProfileFormData;
  validationErrors: ValidationErrors;
  formProgress: FormProgress;
  sectionStatus: SectionStatus;
  onBack: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onArrayChange: (field: keyof ProfileFormData, value: string[]) => void;
  onPastProfessionChange: (index: number, value: string) => void;
  onAddPastProfession: () => void;
  onRemovePastProfession: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileRegistrationForm: React.FC<ProfileRegistrationFormProps> = ({
  selectedRole,
  profileForm,
  validationErrors,
  formProgress,
  sectionStatus,
  onBack,
  onFormChange,
  onArrayChange,
  onPastProfessionChange,
  onAddPastProfession,
  onRemovePastProfession,
  onSubmit
}) => {
  const getFieldTooltip = (fieldName: string) => {
    const tooltips: { [key: string]: string } = {
      firstName: 'Enter your legal first name as it appears on official documents',
      lastName: 'Enter your legal last name as it appears on official documents',
      email: 'We\'ll use this to send you important updates and match notifications',
      phone: 'Your phone number helps mentors/mentees contact you for sessions',
      age: `Mentees must be between 15-19 years old. Mentors must be 18 or older`,
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
        Skills {selectedRole === MENTOR ? 'you can teach' : 'you want to learn'} *
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
                    profileForm.skills.includes(skill) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const newSkills = profileForm.skills.includes(skill)
                      ? profileForm.skills.filter(s => s !== skill)
                      : [...profileForm.skills, skill];
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
      {profileForm.skills.length > 0 && (
        <div className="selected-skills-summary">
          <span className="summary-label">Selected skills:</span>
          <div className="selected-tags">
            {profileForm.skills.map((skill, index) => (
              <span key={index} className="selected-tag">
                {skill}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newSkills = profileForm.skills.filter((_, i) => i !== index);
                    onArrayChange('skills', newSkills);
                  }}
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
        Industries {selectedRole === MENTOR ? 'you work in' : 'you\'re interested in'} *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('industries')} />
      </label>
      <div className="skills-tags-container">
        <div className="tags-grid">
          {industriesList.map((industry) => (
            <button
              key={industry}
              type="button"
              className={`skill-tag-selectable ${
                profileForm.industries.includes(industry) ? 'selected' : ''
              }`}
              onClick={() => {
                const newIndustries = profileForm.industries.includes(industry)
                  ? profileForm.industries.filter(i => i !== industry)
                  : [...profileForm.industries, industry];
                onArrayChange('industries', newIndustries);
              }}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>
      {profileForm.industries.length > 0 && (
        <div className="selected-skills-summary">
          <span className="summary-label">Selected industries:</span>
          <div className="selected-tags">
            {profileForm.industries.map((industry, index) => (
              <span key={index} className="selected-tag">
                {industry}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newIndustries = profileForm.industries.filter((_, i) => i !== index);
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
                    profileForm.hobbies.includes(hobby) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const newHobbies = profileForm.hobbies.includes(hobby)
                      ? profileForm.hobbies.filter(h => h !== hobby)
                      : [...profileForm.hobbies, hobby];
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
      {profileForm.hobbies.length > 0 && (
        <div className="selected-hobbies-summary">
          <span className="summary-label">Selected hobbies:</span>
          <div className="selected-tags">
            {profileForm.hobbies.map((hobby, index) => (
              <span key={index} className="selected-tag">
                {hobby}
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => {
                    const newHobbies = profileForm.hobbies.filter((_, i) => i !== index);
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

  const renderLookingForSelection = () => {
    if (selectedRole !== MENTEE) return null;

    return (
      <div className="looking-for-container">
        <label className="field-label">
          What are you looking to learn? *
          <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('lookingFor')} />
        </label>
        <div className="looking-for-tags-container">
          <div className="tags-grid">
            {Object.values(skillsByCategory).flat().map((skill) => (
              <button
                key={skill}
                type="button"
                className={`skill-tag-selectable ${
                  profileForm.lookingFor.includes(skill) ? 'selected' : ''
                }`}
                onClick={() => {
                  const newLookingFor = profileForm.lookingFor.includes(skill)
                    ? profileForm.lookingFor.filter(s => s !== skill)
                    : [...profileForm.lookingFor, skill];
                  onArrayChange('lookingFor', newLookingFor);
                }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        {profileForm.lookingFor.length > 0 && (
          <div className="selected-looking-for-summary">
            <span className="summary-label">Learning goals:</span>
            <div className="selected-tags">
              {profileForm.lookingFor.map((goal, index) => (
                <span key={index} className="selected-tag">
                  {goal}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => {
                      const newLookingFor = profileForm.lookingFor.filter((_, i) => i !== index);
                      onArrayChange('lookingFor', newLookingFor);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        {validationErrors.lookingFor && (
          <div className="validation-error">{validationErrors.lookingFor}</div>
        )}
      </div>
    );
  };

  return (
    <div className="mentor-registration">
      {/* Fixed Back Button - Always visible at top */}
      <div className="back-button-container">
        <button onClick={onBack} className="back-button">
          <FaArrowLeft /> Back to role selection
        </button>
      </div>
      
      <div className="registration-header">
        <h2>Complete Your {selectedRole === MENTOR ? 'Mentor' : 'Mentee'} Profile</h2>
        <p>Help us find the perfect match by providing detailed information about yourself</p>
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

      <form onSubmit={onSubmit} className="registration-form">
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="firstName" className="field-label">
                First Name *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('firstName')} />
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profileForm.firstName}
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
              <label htmlFor="lastName" className="field-label">
                Last Name *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('lastName')} />
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profileForm.lastName}
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
              <label htmlFor="email" className="field-label">
                Email Address *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('email')} />
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileForm.email}
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
              <label htmlFor="phone" className="field-label">
                Phone Number *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('phone')} />
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileForm.phone}
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
              <label htmlFor="age" className="field-label">
                Age *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('age')} />
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={profileForm.age}
                onChange={onFormChange}
                className={validationErrors.age ? 'error' : ''}
                placeholder={selectedRole === MENTEE ? "15-19" : "18+"}
                min={selectedRole === MENTEE ? 15 : 18}
                max={selectedRole === MENTEE ? 19 : 100}
                data-tooltip={getFieldTooltip('age')}
              />
              {validationErrors.age && (
                <div className="validation-error">{validationErrors.age}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="county" className="field-label">
                County/Location *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('county')} />
              </label>
              <select
                id="county"
                name="county"
                value={profileForm.county}
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
          <h3>Education & Career</h3>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="degree" className="field-label">
                Degree/Qualification *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('degree')} />
              </label>
              <input
                type="text"
                id="degree"
                name="degree"
                value={profileForm.degree}
                onChange={onFormChange}
                className={validationErrors.degree ? 'error' : ''}
                placeholder={degreePlaceholders[profileForm.educationLevel] || "e.g., BSc Computer Science"}
                data-tooltip={getFieldTooltip('degree')}
              />
              {validationErrors.degree && (
                <div className="validation-error">{validationErrors.degree}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="educationLevel" className="field-label">
                Education Level *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('educationLevel')} />
              </label>
              <select
                id="educationLevel"
                name="educationLevel"
                value={profileForm.educationLevel}
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
              <label htmlFor="profession" className="field-label">
                Current Profession *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('profession')} />
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={profileForm.profession}
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
              <label htmlFor="linkedin" className="field-label">
                LinkedIn Profile *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('linkedin')} />
              </label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={profileForm.linkedin}
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
              <label htmlFor="calCom" className="field-label">
                Cal.com Username
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('calCom')} />
              </label>
              <input
                type="text"
                id="calCom"
                name="calCom"
                value={profileForm.calCom}
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
            {profileForm.pastProfessions.map((profession, index) => (
              <div key={index} className="profession-input-row">
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => onPastProfessionChange(index, e.target.value)}
                  placeholder={`Past profession ${index + 1}`}
                  data-tooltip={getFieldTooltip('pastProfessions')}
                />
                {profileForm.pastProfessions.length > 1 && (
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
          <h3>Skills & Interests</h3>
          {renderSkillsSelection()}
          {renderIndustriesSelection()}
          {renderHobbiesSelection()}
          {renderLookingForSelection()}
        </div>

        {/* Additional Information Section */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="ethnicity" className="field-label">
                Ethnicity *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('ethnicity')} />
              </label>
              <select
                id="ethnicity"
                name="ethnicity"
                value={profileForm.ethnicity}
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
              <label htmlFor="religion" className="field-label">
                Religion *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('religion')} />
              </label>
              <select
                id="religion"
                name="religion"
                value={profileForm.religion}
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

        <button type="submit" className="submit-button">
          Complete Profile
        </button>
      </form>
    </div>
  );
};
