import React, { useState } from 'react';
import { FaTimes, FaUser, FaGraduationCap, FaIndustry, FaHeart, FaInfoCircle, FaMapMarkerAlt, FaLinkedin, FaVideo } from 'react-icons/fa';
import { MentorMenteeProfile } from '../types/mentorTypes';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import '../styles/ProfileViewModal.css';

interface ProfileViewModalProps {
  isOpen: boolean;
  profile: MentorMenteeProfile;
  onClose: () => void;
  currentUserRole?: 'mentor' | 'mentee';
}

export const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
  isOpen,
  profile,
  onClose,
  currentUserRole
}) => {
  const [activeSection, setActiveSection] = useState('personal');

  if (!isOpen) return null;

  const getDisplayName = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.firstName) {
      return profile.firstName;
    }
    if (profile.lastName) {
      return profile.lastName;
    }
    if (profile.email) {
      return profile.email.split('@')[0];
    }
    return currentUserRole === 'mentee' ? 'Mentor' : 'Mentee';
  };

  // Determine role from profile
  const getRole = (): 'mentor' | 'mentee' | null => {
    if (profile.isMentor === true) {
      return 'mentor';
    }
    if (profile.isMentee === true) {
      return 'mentee';
    }
    if (typeof profile.type === 'string' && profile.type.toLowerCase() === 'mentor') {
      return 'mentor';
    }
    if (typeof profile.type === 'string' && profile.type.toLowerCase() === 'mentee') {
      return 'mentee';
    }
    return null;
  };

  const renderPersonalInformation = () => (
    <div className="pvm-section" id="section-personal-information">
      <div className="pvm-section-header">
        <FaUser className="pvm-section-icon" />
        <h3>Personal Information</h3>
      </div>
      <div className="pvm-section-content">
        <div className="pvm-profile-header">
          <div className="pvm-avatar">
            <ProfilePicture
              src={typeof profile.profilePicture === 'string' || Array.isArray(profile.profilePicture) ? profile.profilePicture : null}
              alt={getDisplayName()}
              role={getRole()}
              size={120}
            />
            {profile.isGenerated && (
              <div className="pvm-generated-badge" title="Generated Profile">
                🎲 Generated
              </div>
            )}
          </div>
          <div className="pvm-profile-info">
            <h2>{getDisplayName()}</h2>
            <p className="pvm-role">
              {profile.type === 'mentor' ? 'Mentor' : 'Mentee'}
            </p>
            <p className="pvm-profession">
              {profile.profession || profile.educationLevel || 'Professional'}
            </p>
          </div>
        </div>
        
        <div className="pvm-info-grid">
          <div className="pvm-info-item">
            <FaMapMarkerAlt className="pvm-info-icon" />
            <span>{profile.county || 'Location not specified'}</span>
          </div>
          <div className="pvm-info-item">
            <FaUser className="pvm-info-icon" />
            <span>Age: {profile.age || 'Not specified'}</span>
          </div>
          {profile.linkedin && (
            <div className="pvm-info-item">
              <FaLinkedin className="pvm-info-icon" />
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn Profile
              </a>
            </div>
          )}
          {profile.calCom && (
            <div className="pvm-info-item">
              <FaVideo className="pvm-info-icon" />
              <a href={profile.calCom} target="_blank" rel="noopener noreferrer">
                Cal.com Booking
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEducationCareer = () => (
    <div className="pvm-section" id="section-education-career">
      <div className="pvm-section-header">
        <FaGraduationCap className="pvm-section-icon" />
        <h3>Education & Career</h3>
      </div>
      <div className="pvm-section-content">
        <div className="pvm-info-grid">
          <div className="pvm-info-item">
            <FaGraduationCap className="pvm-info-icon" />
            <span>Education Level: {profile.educationLevel || 'Not specified'}</span>
          </div>
          <div className="pvm-info-item">
            <FaIndustry className="pvm-info-icon" />
            <span>Current Profession: {profile.profession || 'Not specified'}</span>
          </div>
          {profile.degree && (
            <div className="pvm-info-item">
              <FaGraduationCap className="pvm-info-icon" />
              <span>Degree: {profile.degree}</span>
            </div>
          )}
        </div>
        
        {profile.pastProfessions && profile.pastProfessions.length > 0 && (
          <div className="pvm-list-section">
            <h4>Past Professions</h4>
            <div className="pvm-tags">
              {profile.pastProfessions.map((profession, index) => (
                <span key={index} className="pvm-tag">{profession}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSkillsInterests = () => (
    <div className="pvm-section" id="section-skills-interests">
      <div className="pvm-section-header">
        <FaIndustry className="pvm-section-icon" />
        <h3>Skills & Interests</h3>
      </div>
      <div className="pvm-section-content">
        {profile.skills && profile.skills.length > 0 && (
          <div className="pvm-list-section">
            <h4>{currentUserRole === 'mentee' ? 'Expertise' : 'Skills & Interests'}</h4>
            <div className="pvm-tags">
              {profile.skills.map((skill, index) => (
                <span key={index} className="pvm-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}
        
        {profile.industries && profile.industries.length > 0 && (
          <div className="pvm-list-section">
            <h4>Industries</h4>
            <div className="pvm-tags">
              {profile.industries.map((industry, index) => (
                <span key={index} className="pvm-tag">{industry}</span>
              ))}
            </div>
          </div>
        )}
        
        {profile.hobbies && profile.hobbies.length > 0 && (
          <div className="pvm-list-section">
            <h4>Hobbies & Interests</h4>
            <div className="pvm-tags">
              {profile.hobbies.map((hobby, index) => (
                <span key={index} className="pvm-tag">{hobby}</span>
              ))}
            </div>
          </div>
        )}
        
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <div className="pvm-list-section">
            <h4>Looking For</h4>
            <div className="pvm-tags">
              {profile.lookingFor.map((item, index) => (
                <span key={index} className="pvm-tag">{item}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="pvm-section" id="section-additional-information">
      <div className="pvm-section-header">
        <FaInfoCircle className="pvm-section-icon" />
        <h3>Additional Information</h3>
      </div>
      <div className="pvm-section-content">
        <div className="pvm-info-grid">
          {profile.ethnicity && (
            <div className="pvm-info-item">
              <FaUser className="pvm-info-icon" />
              <span>Ethnicity: {profile.ethnicity}</span>
            </div>
          )}
          {profile.religion && (
            <div className="pvm-info-item">
              <FaHeart className="pvm-info-icon" />
              <span>Religion: {profile.religion}</span>
            </div>
          )}
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

  return (
    <div className="pvm-overlay" onClick={onClose}>
      <div className="pvm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pvm-header">
          <h2>Profile Details</h2>
          <button className="pvm-close-button" onClick={onClose} title="Close profile view">
            <FaTimes />
          </button>
        </div>
        
        <div className="pvm-content">
          <div className="pvm-sidebar">
            <div className="pvm-navigation">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`pvm-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  title={`View ${section.label}`}
                >
                  <section.icon className="pvm-nav-icon" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pvm-main-content">
            {sections.find(s => s.id === activeSection)?.render()}
          </div>
        </div>
      </div>
    </div>
  );
};
