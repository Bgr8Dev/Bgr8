import React, { useState } from 'react';
import { FaArrowLeft, FaInfoCircle, FaExclamationTriangle, FaTimes, FaCode, FaRandom } from 'react-icons/fa';
import { UserType, MENTOR, MENTEE, ProfileFormData, ValidationErrors, FormProgress, SectionStatus } from '../types/mentorTypes';
import { degreePlaceholders } from '../types/mentorConstants';
import skillsByCategory from '../../../constants/skillsByCategory';
import industriesList from '../../../constants/industries';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import { UserProfile, hasRole } from '../../../utils/userProfile';
import '../styles/ProfileRegistrationForm.css';

interface ProfileRegistrationFormProps {
  selectedRole: UserType;
  profileForm: ProfileFormData;
  validationErrors: ValidationErrors;
  formProgress: FormProgress;
  sectionStatus: SectionStatus;
  userProfile?: UserProfile | null;
  onBack: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onArrayChange: (field: keyof ProfileFormData, value: string[]) => void;
  onPastProfessionChange: (index: number, value: string) => void;
  onAddPastProfession: () => void;
  onRemovePastProfession: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// Missing Fields Modal Component
const MissingFieldsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  onScrollToField: (fieldName: string) => void;
}> = ({ isOpen, onClose, missingFields, onScrollToField }) => {
  if (!isOpen) return null;

  const getFieldSection = (fieldName: string): string => {
    const personalFields = ['First Name', 'Last Name', 'Email', 'Phone Number', 'Age', 'County'];
    const educationFields = ['Degree/Qualification', 'Education Level', 'Profession', 'LinkedIn Profile'];
    const skillsFields = ['Skills', 'Industries', 'Hobbies & Interests'];
    const additionalFields = ['Ethnicity', 'Religion'];
    const menteeFields = ['Learning Goals'];

    if (personalFields.includes(fieldName)) return 'Personal Information';
    if (educationFields.includes(fieldName)) return 'Education & Career';
    if (skillsFields.includes(fieldName)) return 'Skills & Interests';
    if (additionalFields.includes(fieldName)) return 'Additional Information';
    if (menteeFields.includes(fieldName)) return 'Learning Goals';
    return 'Other';
  };

  const groupedFields = missingFields.reduce((acc, field) => {
    const section = getFieldSection(field);
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="missing-fields-modal-overlay" onClick={onClose}>
      <div className="missing-fields-modal" onClick={(e) => e.stopPropagation()}>
        <div className="missing-fields-modal-header">
          <div className="missing-fields-modal-title">
            <FaExclamationTriangle className="warning-icon" />
            <h3>Missing Required Fields</h3>
          </div>
          <button 
            className="missing-fields-modal-close" 
            onClick={onClose}
            aria-label="Close missing fields modal"
            title="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="missing-fields-modal-content">
          <p className="missing-fields-intro">
            Please complete the following required fields to continue:
          </p>
          
          {Object.entries(groupedFields).map(([section, fields]) => (
            <div key={section} className="missing-fields-section">
              <h4 className="missing-fields-section-title">{section}</h4>
              <div className="missing-fields-list">
                {fields.map((field) => (
                  <button
                    key={field}
                    className="missing-field-item"
                    onClick={() => {
                      onScrollToField(field);
                      onClose();
                    }}
                  >
                    {field}
                    <span className="scroll-hint">Click to scroll to field</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="missing-fields-modal-footer">
          <button className="missing-fields-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfileRegistrationForm: React.FC<ProfileRegistrationFormProps> = ({
  selectedRole,
  profileForm,
  validationErrors,
  formProgress,
  sectionStatus,
  userProfile,
  onBack,
  onFormChange,
  onArrayChange,
  onPastProfessionChange,
  onAddPastProfession,
  onRemovePastProfession,
  onSubmit
}) => {
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Developer mode data generation
  const generateRandomData = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Phoenix', 'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Hayden', 'Jamie', 'Kendall', 'Logan'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const professions = selectedRole === MENTOR 
      ? ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Marketing Manager', 'Financial Analyst', 'Consultant', 'Project Manager', 'Business Analyst', 'Sales Director']
      : ['Student', 'Aspiring Developer', 'Future Engineer', 'Business Student', 'Art Student', 'Science Student', 'Literature Student', 'History Student', 'Psychology Student', 'Economics Student'];
    
    const degrees = selectedRole === MENTOR
      ? ['BSc Computer Science', 'MSc Data Science', 'MBA', 'BEng Software Engineering', 'MSc Artificial Intelligence', 'BSc Mathematics', 'MSc Business Analytics', 'BSc Economics', 'MSc Finance', 'BSc Psychology']
      : ['A-Levels', 'GCSEs', 'BTEC Level 3', 'International Baccalaureate', 'Scottish Highers', 'Welsh Baccalaureate', 'Access to HE Diploma', 'T-Levels', 'Apprenticeship', 'Foundation Degree'];
    
    const educationLevels = selectedRole === MENTOR
      ? ['Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Professional Qualification', 'Postgraduate Diploma']
      : ['GCSE', 'A-Level', 'BTEC Level 3', 'International Baccalaureate', 'Scottish Highers'];
    
    const skills = Object.values(skillsByCategory).flat();
    const industries = industriesList;
    const hobbies = Object.values(hobbiesByCategory).flat();
    const counties = ukCounties;
    const ethnicities = ethnicityOptions;
    const religions = religionOptions;
    
    // Generate random selections
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomProfession = professions[Math.floor(Math.random() * professions.length)];
    const randomDegree = degrees[Math.floor(Math.random() * degrees.length)];
    const randomEducationLevel = educationLevels[Math.floor(Math.random() * educationLevels.length)];
    const randomCounty = counties[Math.floor(Math.random() * counties.length)];
    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomReligion = religions[Math.floor(Math.random() * religions.length)];
    
    // Generate random skills (3-8 skills)
    const numSkills = Math.floor(Math.random() * 6) + 3;
    const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, numSkills);
    
    // Generate random industries (2-5 industries)
    const numIndustries = Math.floor(Math.random() * 4) + 2;
    const randomIndustries = industries.sort(() => 0.5 - Math.random()).slice(0, numIndustries);
    
    // Generate random hobbies (3-6 hobbies)
    const numHobbies = Math.floor(Math.random() * 4) + 3;
    const randomHobbies = hobbies.sort(() => 0.5 - Math.random()).slice(0, numHobbies);
    
    // Generate random looking for (for mentees only)
    const randomLookingFor = selectedRole === MENTEE 
      ? skills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3)
      : [];
    
    // Generate random past professions (for mentors only)
    const randomPastProfessions = selectedRole === MENTOR 
      ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
          professions[Math.floor(Math.random() * professions.length)]
        )
      : [''];
    
    // Generate random age
    const randomAge = selectedRole === MENTOR 
      ? (Math.floor(Math.random() * 20) + 25).toString() // 25-44 for mentors
      : (Math.floor(Math.random() * 4) + 16).toString(); // 16-19 for mentees
    
    // Generate random phone number
    const randomPhone = `+44 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Generate random email
    const randomEmail = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@example.com`;
    
    // Generate random LinkedIn URL
    const randomLinkedin = `https://linkedin.com/in/${randomFirstName.toLowerCase()}-${randomLastName.toLowerCase()}`;
    
    // Generate random Cal.com URL (for mentors only)
    const randomCalCom = selectedRole === MENTOR 
      ? `https://cal.com/${randomFirstName.toLowerCase()}-${randomLastName.toLowerCase()}`
      : '';
    
    return {
      firstName: randomFirstName,
      lastName: randomLastName,
      email: randomEmail,
      phone: randomPhone,
      age: randomAge,
      degree: randomDegree,
      educationLevel: randomEducationLevel,
      county: randomCounty,
      profession: randomProfession,
      pastProfessions: randomPastProfessions,
      linkedin: randomLinkedin,
      calCom: randomCalCom,
      skills: randomSkills,
      industries: randomIndustries,
      hobbies: randomHobbies,
      lookingFor: randomLookingFor,
      ethnicity: randomEthnicity,
      religion: randomReligion
    };
  };

  const handleDeveloperMode = () => {
    const randomData = generateRandomData();
    
    // Update all form fields with random data
    Object.entries(randomData).forEach(([key, value]) => {
      if (key === 'pastProfessions' && Array.isArray(value)) {
        // Handle past professions array
        value.forEach((profession, index) => {
          if (index === 0) {
            onPastProfessionChange(0, profession);
          } else {
            onAddPastProfession();
            onPastProfessionChange(index, profession);
          }
        });
      } else if (Array.isArray(value)) {
        // Handle array fields (skills, industries, hobbies, lookingFor)
        onArrayChange(key as keyof ProfileFormData, value);
      } else {
        // Handle string fields
        const syntheticEvent = {
          target: {
            name: key,
            value: value
          }
        } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
        onFormChange(syntheticEvent);
      }
    });
  };

  const getFieldTooltip = (fieldName: string) => {
    const tooltips: { [key: string]: string } = {
      firstName: 'Enter your legal first name as it appears on official documents',
      lastName: 'Enter your legal last name as it appears on official documents',
      email: 'We\'ll use this to send you important updates and match notifications',
      phone: 'Your phone number helps mentors/mentees contact you for sessions',
      age: `Mentees must be between 16-19 years old. Mentors must be 18 or older`,
      degree: selectedRole === MENTOR 
        ? 'Tell us about your highest qualification or what you\'re currently studying'
        : 'Tell us about your current education level and what you\'re studying',
      educationLevel: selectedRole === MENTOR 
        ? 'Select the highest level of education you\'ve completed'
        : 'Select your current education level',
      county: 'Your location helps match you with nearby mentors/mentees',
      profession: selectedRole === MENTOR 
        ? 'What do you currently do for work? This helps mentees understand your expertise'
        : 'What career path are you interested in pursuing? This helps mentors provide relevant guidance',
      pastProfessions: 'List your previous work experience to show your background and expertise (optional)',
      linkedin: 'Your LinkedIn profile helps verify your professional experience (optional for mentees)',
      calCom: 'Connect your Cal.com public page to enable video call scheduling',
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
    <div className="prf-skills-selection-container">
      <label className="field-label">
        Skills {selectedRole === MENTOR ? 'you can teach' : 'you want to learn'} *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('skills')} />
      </label>
      <div className="skills-tags-container">
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <div key={category} className="skill-category-section">
            <h5 className="prf-category-title">{category}</h5>
            <div className="prf-tags-grid">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`prf-skill-tag-selectable ${
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
        <div className="prf-selected-skills-summary">
          <span className="prf-summary-label">Selected skills:</span>
          <div className="prf-selected-tags">
            {profileForm.skills.map((skill, index) => (
              <span key={index} className="prf-selected-tag">
                {skill}
                <button
                  type="button"
                  className="prf-remove-tag"
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
    <div className="prf-skills-selection-container">
      <label className="field-label">
        Industries {selectedRole === MENTOR ? 'you work in' : 'you\'re interested in'} *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('industries')} />
      </label>
      <div className="skills-tags-container">
        <div className="prf-tags-grid">
          {industriesList.map((industry) => (
            <button
              key={industry}
              type="button"
              className={`prf-skill-tag-selectable ${
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
        <div className="prf-selected-skills-summary">
          <span className="prf-summary-label">Selected industries:</span>
          <div className="prf-selected-tags">
            {profileForm.industries.map((industry, index) => (
              <span key={index} className="prf-selected-tag">
                {industry}
                <button
                  type="button"
                  className="prf-remove-tag"
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
    <div className="prf-hobbies-selection-container">
      <label className="field-label">
        Hobbies & Interests *
        <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('hobbies')} />
      </label>
      <div className="hobbies-tags-container">
        {Object.entries(hobbiesByCategory).map(([category, hobbies]) => (
          <div key={category} className="hobby-category-section">
            <h5 className="prf-category-title">{category}</h5>
            <div className="prf-tags-grid">
              {hobbies.map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  className={`prf-hobby-tag-selectable ${
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
        <div className="prf-selected-hobbies-summary">
          <span className="prf-summary-label">Selected hobbies:</span>
          <div className="prf-selected-tags">
            {profileForm.hobbies.map((hobby, index) => (
              <span key={index} className="prf-selected-tag">
                {hobby}
                <button
                  type="button"
                  className="prf-remove-tag"
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
      <div className="prf-looking-for-container">
        <label className="field-label">
          What are you looking to learn? *
          <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('lookingFor')} />
        </label>
        <div className="prf-looking-for-tags-container">
          <div className="prf-tags-grid">
            {Object.values(skillsByCategory).flat().map((skill) => (
              <button
                key={skill}
                type="button"
                className={`prf-skill-tag-selectable ${
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
          <div className="prf-selected-looking-for-summary">
            <span className="prf-summary-label">Learning goals:</span>
            <div className="prf-selected-tags">
              {profileForm.lookingFor.map((goal, index) => (
                <span key={index} className="prf-selected-tag">
                  {goal}
                  <button
                    type="button"
                    className="prf-remove-tag"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Selected role:', selectedRole);
    console.log('Profile form data:', profileForm);
    
    const requiredFields: string[] = [];

    if (!profileForm.firstName) requiredFields.push('First Name');
    if (!profileForm.lastName) requiredFields.push('Last Name');
    if (!profileForm.email) requiredFields.push('Email');
    if (!profileForm.phone) requiredFields.push('Phone Number');
    if (!profileForm.age) requiredFields.push('Age');
    if (!profileForm.county) requiredFields.push('County');

    if (selectedRole === MENTOR) {
      if (!profileForm.degree) requiredFields.push('Degree/Qualification');
      if (!profileForm.educationLevel) requiredFields.push('Education Level');
      if (!profileForm.profession) requiredFields.push('Current Profession');
      if (!profileForm.linkedin) requiredFields.push('LinkedIn Profile');
      // Cal.com is optional for mentors, so not included in required fields
    } else { // MENTEE
      if (!profileForm.degree) requiredFields.push('Degree/Qualification');
      if (!profileForm.educationLevel) requiredFields.push('Education Level');
      if (!profileForm.profession) requiredFields.push('Desired Profession');
      if (profileForm.lookingFor.length === 0) requiredFields.push('Learning Goals');
    }

    if (profileForm.skills.length === 0) requiredFields.push('Skills');
    if (profileForm.industries.length === 0) requiredFields.push('Industries');
    if (profileForm.hobbies.length === 0) requiredFields.push('Hobbies & Interests');
    if (profileForm.ethnicity === '') requiredFields.push('Ethnicity');
    if (profileForm.religion === '') requiredFields.push('Religion');

    console.log('Required fields found:', requiredFields);

    if (requiredFields.length > 0) {
      console.log('Opening missing fields modal');
      setMissingFields(requiredFields);
      setIsModalOpen(true);
    } else {
      console.log('All required fields completed, calling onSubmit');
      onSubmit(e);
    }
  };

  const scrollToField = (fieldName: string) => {
    // Map field names to their corresponding section IDs
    const fieldToSection: Record<string, string> = {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Email': 'email',
      'Phone Number': 'phone',
      'Age': 'age',
      'County': 'county',
      'Degree/Qualification': 'degree',
      'Education Level': 'educationLevel',
      'Current Profession': 'profession',
      'Desired Profession': 'profession', // For mentees
      'LinkedIn Profile': 'linkedin',
      'Cal.com Public Page Link': 'calCom',
      'Skills': 'skills',
      'Industries': 'industries',
      'Hobbies & Interests': 'hobbies',
      'Ethnicity': 'ethnicity',
      'Religion': 'religion',
      'Learning Goals': 'lookingFor'
    };

    const fieldId = fieldToSection[fieldName];
    if (fieldId) {
      const element = document.getElementById(fieldId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow = '0 0 0 4px rgba(59, 167, 242, 0.3)';
        element.style.transform = 'scale(1.02)';
        setTimeout(() => {
          element.style.boxShadow = '';
          element.style.transform = '';
        }, 2000);
      }
    }
  };

  return (
    <div className="prf-mentor-registration">
      {/* Fixed Back Button - Always visible at top */}
      <div className="prf-back-button-container">
        <button onClick={onBack} className="prf-back-button">
          <FaArrowLeft /> Back to role selection
        </button>
        
        {/* Developer Mode Button - Only visible to developers */}
        {hasRole(userProfile || null, 'developer') && (
          <button 
            onClick={handleDeveloperMode} 
            className="prf-developer-mode-button"
            title="Fill form with random test data"
          >
            <FaCode /> <FaRandom /> Developer Mode
          </button>
        )}
      </div>
      
      <div className="prf-registration-header">
        <h2>Complete Your {selectedRole === MENTOR ? 'Mentor' : 'Mentee'} Profile</h2>
        <p>Help us find the perfect match by providing detailed information about yourself</p>
      </div>

      {/* Form Progress */}
      <div className="prf-form-progress">
        <div className="prf-progress-bar">
          <div 
            className="prf-progress-fill" 
            style={{ width: `${(formProgress.completedFields / formProgress.totalFields) * 100}%` }}
          />
        </div>
        <div className="prf-progress-text">
          {formProgress.completedFields} of {formProgress.totalFields} fields completed
        </div>
      </div>

      {/* Section Status */}
      <div className="prf-section-status">
        {Object.entries(sectionStatus).map(([sectionName, status]) => (
          <div key={sectionName} className="prf-status-indicator">
            <span className={`prf-status-dot ${status.completed ? 'completed' : 'incomplete'}`} />
            <span className="status-text">{sectionName}</span>
            <span className="prf-status-count">({status.completed}/{status.total})</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="prf-registration-form">
        {/* Personal Information Section */}
        <div className="prf-form-section" id="personal-info">
          <h3>Personal Information</h3>
          <div className="prf-form-row">
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

          <div className="prf-form-row">
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

          <div className="prf-form-row">
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
                placeholder={selectedRole === MENTEE ? "16-19" : "18+"}
                min={selectedRole === MENTEE ? 16 : 18}
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
        <div className="prf-form-section" id="education-career">
          <h3>Education & Career</h3>
          <div className="prf-form-row">
            <div className="input-group">
              <label htmlFor="degree" className="field-label">
                {selectedRole === MENTOR ? 'Degree/Qualification' : 'Education/Studies'} *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('degree')} />
              </label>
              <input
                type="text"
                id="degree"
                name="degree"
                value={profileForm.degree}
                onChange={onFormChange}
                className={validationErrors.degree ? 'error' : ''}
                placeholder={selectedRole === MENTOR 
                  ? (degreePlaceholders[profileForm.educationLevel] || "e.g., BSc Computer Science")
                  : "e.g., A-Levels, GCSEs, or what you're currently studying"
                }
                data-tooltip={getFieldTooltip('degree')}
              />
              {validationErrors.degree && (
                <div className="validation-error">{validationErrors.degree}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="educationLevel" className="field-label">
                {selectedRole === MENTOR ? 'Education Level' : 'Current Education Level'} *
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

          <div className="prf-form-row">
            <div className="input-group">
              <label htmlFor="profession" className="field-label">
                {selectedRole === MENTOR ? 'Current Profession' : 'Desired Profession'} *
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('profession')} />
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={profileForm.profession}
                onChange={onFormChange}
                className={validationErrors.profession ? 'error' : ''}
                placeholder={selectedRole === MENTOR ? "e.g., Software Developer, Teacher" : "e.g., Software Developer, Doctor, Engineer"}
                data-tooltip={getFieldTooltip('profession')}
              />
              {validationErrors.profession && (
                <div className="validation-error">{validationErrors.profession}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="linkedin" className="field-label">
                LinkedIn Profile
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

          {selectedRole === MENTOR && (
            <div className="prf-form-row">
              <div className="input-group">
                <label htmlFor="calCom" className="field-label">
                  Cal.com Public Page Link
                  <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('calCom')} />
                </label>
                <input
                  type="url"
                  id="calCom"
                  name="calCom"
                  value={profileForm.calCom}
                  onChange={onFormChange}
                  placeholder="https://cal.com/yourusername"
                  data-tooltip={getFieldTooltip('calCom')}
                />
              </div>
            </div>
          )}

          {/* Past Professions - Only for Mentors */}
          {selectedRole === MENTOR && (
            <div className="prf-past-professions-container">
              <label className="field-label">
                Past Professions
                <FaInfoCircle className="info-icon" data-tooltip={getFieldTooltip('pastProfessions')} />
              </label>
              {profileForm.pastProfessions.map((profession, index) => (
                <div key={index} className="prf-profession-input-row">
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
                      className="prf-remove-profession-btn"
                      onClick={() => onRemovePastProfession(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="prf-add-profession-btn"
                onClick={onAddPastProfession}
              >
                + Add Another Profession
              </button>
              {validationErrors.pastProfessions && (
                <div className="validation-error">{validationErrors.pastProfessions}</div>
              )}
            </div>
          )}
        </div>

        {/* Skills & Interests Section */}
        <div className="prf-form-section" id="skills-interests">
          <h3>Skills & Interests</h3>
          {renderSkillsSelection()}
          {renderIndustriesSelection()}
          {renderHobbiesSelection()}
          {renderLookingForSelection()}
        </div>

        {/* Additional Information Section */}
        <div className="prf-form-section" id="additional-info">
          <h3>Additional Information</h3>
          <div className="prf-form-row">
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

        <button type="submit" className="prf-submit-button">
          Complete Profile
        </button>
      </form>

      {isModalOpen && (
        <MissingFieldsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          missingFields={missingFields}
          onScrollToField={scrollToField}
        />
      )}
    </div>
  );
};
