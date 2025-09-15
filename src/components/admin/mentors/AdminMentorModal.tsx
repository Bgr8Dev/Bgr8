import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaGraduationCap, FaIndustry, FaInfoCircle, FaSave, FaUndo } from 'react-icons/fa';
import { MentorMenteeProfile } from '../../widgets/MentorAlgorithm/algorithm/matchUsers';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import '../../../styles/adminStyles/AdminMentorModal.css';

interface AdminMentorModalProps {
  open: boolean;
  onClose: () => void;
  user: MentorMenteeProfile | null;
  mode: 'view' | 'edit';
  onSave?: (updatedUser: MentorMenteeProfile) => void;
}



const AdminMentorModal: React.FC<AdminMentorModalProps> = ({ 
  open, 
  onClose, 
  user, 
  mode = 'view',
  onSave 
}) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [editUser, setEditUser] = useState<MentorMenteeProfile | null>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (user) {
      setEditUser(user);
      setHasChanges(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [name]: value };
      setHasChanges(true);
      return updated;
    });
  };

  const handleArrayChange = (field: string, idx: number, value: string) => {
    setEditUser((prev) => {
      if (!prev) return null;
      const arr = [...(prev[field as keyof MentorMenteeProfile] as string[] || [])];
      arr[idx] = value;
      const updated = { ...prev, [field]: arr };
      setHasChanges(true);
      return updated;
    });
  };

  const addArrayField = (field: string) => {
    setEditUser((prev) => {
      if (!prev) return null;
      const currentArray = prev[field as keyof MentorMenteeProfile] as string[] || [];
      const updated = { ...prev, [field]: [...currentArray, ''] };
      setHasChanges(true);
      return updated;
    });
  };

  const removeArrayField = (field: string, idx: number) => {
    setEditUser((prev) => {
      if (!prev) return null;
      const arr = [...(prev[field as keyof MentorMenteeProfile] as string[] || [])];
      arr.splice(idx, 1);
      const updated = { ...prev, [field]: arr.length ? arr : [''] };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editUser || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editUser);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditUser(user);
    setHasChanges(false);
    onClose();
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDisplayName = () => {
    if (!editUser) return '';
    if (editUser.firstName && editUser.lastName) {
      return `${editUser.firstName} ${editUser.lastName}`;
    }
    if (editUser.firstName) return editUser.firstName;
    if (editUser.lastName) return editUser.lastName;
    if (editUser.email) return editUser.email.split('@')[0];
    return editUser.type === 'mentor' ? 'Mentor' : 'Mentee';
  };

  const getProfileImageSrc = () => {
    if (!editUser) return '';
    if (Array.isArray(editUser.profilePicture)) {
      return editUser.profilePicture[0] || `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random`;
    }
    if (typeof editUser.profilePicture === 'string') {
      return editUser.profilePicture;
    }
    return `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random`;
  };

  const renderPersonalInformation = () => (
    <div className="amm-section" id="section-personal-information">
      <div className="amm-section-header">
        <FaUser className="amm-section-icon" />
        <h3>Personal Information</h3>
      </div>
      <div className="amm-section-content">
        <div className="amm-profile-header">
          <div className="amm-avatar">
            <img src={getProfileImageSrc()} alt={getDisplayName()} />
            {editUser?.isGenerated && (
              <div className="amm-generated-badge" title="Generated Profile">
                🎲 Generated
              </div>
            )}
          </div>
          <div className="amm-profile-info">
            <h2>{getDisplayName()}</h2>
            <p className="amm-role">
              {editUser?.type === 'mentor' ? 'Mentor' : 'Mentee'}
            </p>
            <p className="amm-profession">
              {editUser?.profession || editUser?.educationLevel || 'Professional'}
            </p>
          </div>
        </div>
        
        <div className="amm-form-grid">
          <div className="amm-form-group">
            <label>First Name</label>
            {mode === 'edit' ? (
              <input
                type="text"
                name="firstName"
                value={editUser?.firstName || ''}
                onChange={handleInputChange}
                placeholder="Enter first name"
              />
            ) : (
              <div className="amm-field-value">{editUser?.firstName || 'Not provided'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Last Name</label>
            {mode === 'edit' ? (
              <input
                type="text"
                name="lastName"
                value={editUser?.lastName || ''}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
            ) : (
              <div className="amm-field-value">{editUser?.lastName || 'Not provided'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Email</label>
            {mode === 'edit' ? (
              <input
                type="email"
                name="email"
                value={editUser?.email || ''}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            ) : (
              <div className="amm-field-value">{editUser?.email || 'Not provided'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Phone</label>
            {mode === 'edit' ? (
              <input
                type="tel"
                name="phone"
                value={editUser?.phone || ''}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            ) : (
              <div className="amm-field-value">{editUser?.phone || 'Not provided'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Age</label>
            {mode === 'edit' ? (
              <input
                type="text"
                name="age"
                value={editUser?.age || ''}
                onChange={handleInputChange}
                placeholder="Enter age"
              />
            ) : (
              <div className="amm-field-value">{editUser?.age || 'Not provided'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>County</label>
            {mode === 'edit' ? (
              <select name="county" value={editUser?.county || ''} onChange={handleInputChange}>
                <option value="">Select County</option>
                {ukCounties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            ) : (
              <div className="amm-field-value">{editUser?.county || 'Not provided'}</div>
            )}
          </div>

          {editUser?.linkedin && (
            <div className="amm-form-group">
              <label>LinkedIn</label>
              <div className="amm-field-value">
                <a href={editUser.linkedin} target="_blank" rel="noopener noreferrer" className="amm-link">
                  View LinkedIn Profile
                </a>
              </div>
            </div>
          )}

          {editUser?.calCom && (
            <div className="amm-form-group">
              <label>Cal.com</label>
              <div className="amm-field-value">
                <a href={editUser.calCom} target="_blank" rel="noopener noreferrer" className="amm-link">
                  Book Session
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEducationCareer = () => (
    <div className="amm-section" id="section-education-career">
      <div className="amm-section-header">
        <FaGraduationCap className="amm-section-icon" />
        <h3>Education & Career</h3>
      </div>
      <div className="amm-section-content">
        <div className="amm-form-grid">
          <div className="amm-form-group">
            <label>Education Level</label>
            {mode === 'edit' ? (
              <select name="educationLevel" value={editUser?.educationLevel || ''} onChange={handleInputChange}>
                <option value="">Select Education Level</option>
                {ukEducationLevels
                  .filter(level => {
                    if (editUser?.type === 'mentee') {
                      const menteeLevels = ['GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree"];
                      return menteeLevels.includes(level);
                    }
                    return true;
                  })
                  .map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
              </select>
            ) : (
              <div className="amm-field-value">{editUser?.educationLevel || 'Not specified'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Degree</label>
            {mode === 'edit' ? (
              <input
                type="text"
                name="degree"
                value={editUser?.degree || ''}
                onChange={handleInputChange}
                placeholder="Enter degree"
              />
            ) : (
              <div className="amm-field-value">{editUser?.degree || 'Not specified'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Current Profession</label>
            {mode === 'edit' ? (
              <input
                type="text"
                name="profession"
                value={editUser?.profession || ''}
                onChange={handleInputChange}
                placeholder="Enter profession"
              />
            ) : (
              <div className="amm-field-value">{editUser?.profession || 'Not specified'}</div>
            )}
          </div>
        </div>

        {editUser?.pastProfessions && editUser.pastProfessions.length > 0 && (
          <div className="amm-list-section">
            <h4>Past Professions</h4>
            {mode === 'edit' ? (
              <div className="amm-array-fields">
                {editUser.pastProfessions.map((profession, idx) => (
                  <div key={idx} className="amm-array-field">
                    <input
                      value={profession}
                      onChange={e => handleArrayChange('pastProfessions', idx, e.target.value)}
                      placeholder="Enter past profession"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('pastProfessions', idx)}
                      className="amm-remove-btn"
                      title="Remove profession"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('pastProfessions')}
                  className="amm-add-btn"
                >
                  + Add Past Profession
                </button>
              </div>
            ) : (
              <div className="amm-tags">
                {editUser.pastProfessions.map((profession, index) => (
                  <span key={index} className="amm-tag">{profession}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSkillsInterests = () => (
    <div className="amm-section" id="section-skills-interests">
      <div className="amm-section-header">
        <FaIndustry className="amm-section-icon" />
        <h3>Skills & Interests</h3>
      </div>
      <div className="amm-section-content">
        {editUser?.skills && editUser.skills.length > 0 && (
          <div className="amm-list-section">
            <h4>Skills</h4>
            {mode === 'edit' ? (
              <div className="amm-array-fields">
                {editUser.skills.map((skill, idx) => (
                  <div key={idx} className="amm-array-field">
                    <input
                      value={skill}
                      onChange={e => handleArrayChange('skills', idx, e.target.value)}
                      placeholder="Enter skill"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('skills', idx)}
                      className="amm-remove-btn"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('skills')}
                  className="amm-add-btn"
                >
                  + Add Skill
                </button>
              </div>
            ) : (
              <div className="amm-tags">
                {editUser.skills.map((skill, index) => (
                  <span key={index} className="amm-tag">{skill}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {editUser?.lookingFor && editUser.lookingFor.length > 0 && (
          <div className="amm-list-section">
            <h4>Looking For</h4>
            {mode === 'edit' ? (
              <div className="amm-array-fields">
                {editUser.lookingFor.map((item, idx) => (
                  <div key={idx} className="amm-array-field">
                    <input
                      value={item}
                      onChange={e => handleArrayChange('lookingFor', idx, e.target.value)}
                      placeholder="Enter what you're looking for"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('lookingFor', idx)}
                      className="amm-remove-btn"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('lookingFor')}
                  className="amm-add-btn"
                >
                  + Add Item
                </button>
              </div>
            ) : (
              <div className="amm-tags">
                {editUser.lookingFor.map((item, index) => (
                  <span key={index} className="amm-tag">{item}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {editUser?.hobbies && editUser.hobbies.length > 0 && (
          <div className="amm-list-section">
            <h4>Hobbies & Interests</h4>
            {mode === 'edit' ? (
              <div className="amm-array-fields">
                {editUser.hobbies.map((hobby, idx) => (
                  <div key={idx} className="amm-array-field">
                    <input
                      value={hobby}
                      onChange={e => handleArrayChange('hobbies', idx, e.target.value)}
                      placeholder="Enter hobby or interest"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('hobbies', idx)}
                      className="amm-remove-btn"
                      title="Remove hobby"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('hobbies')}
                  className="amm-add-btn"
                >
                  + Add Hobby
                </button>
              </div>
            ) : (
              <div className="amm-tags">
                {editUser.hobbies.map((hobby, index) => (
                  <span key={index} className="amm-tag">{hobby}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {editUser?.industries && editUser.industries.length > 0 && (
          <div className="amm-list-section">
            <h4>Industries</h4>
            {mode === 'edit' ? (
              <div className="amm-array-fields">
                {editUser.industries.map((industry, idx) => (
                  <div key={idx} className="amm-array-field">
                    <input
                      value={industry}
                      onChange={e => handleArrayChange('industries', idx, e.target.value)}
                      placeholder="Enter industry"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('industries', idx)}
                      className="amm-remove-btn"
                      title="Remove industry"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('industries')}
                  className="amm-add-btn"
                >
                  + Add Industry
                </button>
              </div>
            ) : (
              <div className="amm-tags">
                {editUser.industries.map((industry, index) => (
                  <span key={index} className="amm-tag">{industry}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="amm-section" id="section-additional-information">
      <div className="amm-section-header">
        <FaInfoCircle className="amm-section-icon" />
        <h3>Additional Information</h3>
      </div>
      <div className="amm-section-content">
        <div className="amm-form-grid">
          <div className="amm-form-group">
            <label>Ethnicity</label>
            {mode === 'edit' ? (
              <select name="ethnicity" value={editUser?.ethnicity || ''} onChange={handleInputChange}>
                <option value="">Select Ethnicity</option>
                {ethnicityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <div className="amm-field-value">{editUser?.ethnicity || 'Not specified'}</div>
            )}
          </div>

          <div className="amm-form-group">
            <label>Religion</label>
            {mode === 'edit' ? (
              <select name="religion" value={editUser?.religion || ''} onChange={handleInputChange}>
                <option value="">Select Religion</option>
                {religionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <div className="amm-field-value">{editUser?.religion || 'Not specified'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const sections = [
    { id: 'personal', label: 'Personal Information', icon: FaUser, render: renderPersonalInformation },
    { id: 'education', label: 'Education & Career', icon: FaGraduationCap, render: renderEducationCareer },
    { id: 'skills', label: 'Skills & Interests', icon: FaIndustry, render: renderSkillsInterests },
    { id: 'additional', label: 'Additional Info', icon: FaInfoCircle, render: renderAdditionalInfo }
  ];

  if (!open || !user || !editUser) return null;

  return (
    <div className="amm-overlay" onClick={onClose}>
      <div className="amm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="amm-header">
          <div className="amm-header-content">
            <h2>Profile Details</h2>
            <p className="amm-subtitle">
              {mode === 'edit' ? 'Edit Profile' : 'View Profile'} - {getDisplayName()}
            </p>
          </div>
          <button className="amm-close-button" onClick={onClose} title="Close modal">
            <FaTimes />
          </button>
        </div>
        
        <div className="amm-content">
          <div className="amm-sidebar">
            <div className="amm-navigation">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`amm-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    scrollToSection(`section-${section.id}`);
                  }}
                  title={`View ${section.label}`}
                >
                  <section.icon className="amm-nav-icon" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="amm-main-content">
            {sections.find(s => s.id === activeSection)?.render()}
          </div>
        </div>

        {mode === 'edit' && (
          <div className="amm-actions">
            <button
              className="amm-btn amm-btn-secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <FaUndo />
              Cancel
            </button>
            <button
              className="amm-btn amm-btn-primary"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <FaSave />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMentorModal;
