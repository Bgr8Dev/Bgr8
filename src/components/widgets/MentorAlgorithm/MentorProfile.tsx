import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './MentorProgram.css';

interface MentorProfile {
  name: string;
  email: string;
  phone: string;
  age: string;
  degree: string;
  educationLevel: string;
  county: string;
  currentProfession: string;
  pastProfessions: string[];
  linkedin: string;
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  type: 'mentor' | 'mentee';
}

export default function MentorProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        const mentorDoc = await getDoc(doc(db, 'mentorProgram', currentUser.uid));
        if (mentorDoc.exists()) {
          setProfile(mentorDoc.data() as MentorProfile);
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
        setTimeout(() => setAnimateIn(true), 100); // trigger entrance animation
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;

    try {
      // Convert profile to a plain object for Firestore
      const profileData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        degree: profile.degree,
        educationLevel: profile.educationLevel,
        county: profile.county,
        currentProfession: profile.currentProfession,
        pastProfessions: profile.pastProfessions,
        linkedin: profile.linkedin,
        hobbies: profile.hobbies,
        ethnicity: profile.ethnicity,
        religion: profile.religion,
        skills: profile.skills,
        lookingFor: profile.lookingFor,
        type: profile.type
      };

      await updateDoc(doc(db, 'mentorProgram', currentUser.uid), profileData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  if (loading) {
    return <div className="mentor-profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="mentor-profile-empty">
        <p>You haven't signed up as a mentor or mentee yet.</p>
        <p>Please complete the sign-up form to create your profile.</p>
      </div>
    );
  }

  return (
    <div className={`mentor-profile mentor-profile-animate${animateIn ? ' in' : ''}`}>
      <div className="mentor-profile-header mentor-profile-header-animate">
        <h3 className="mentor-profile-title-animate">{profile.type === 'mentor' ? 'Mentor Profile' : 'Mentee Profile'}</h3>
        {!isEditing ? (
          <button onClick={handleEdit} className="mentor-profile-edit-btn mentor-profile-btn-animate">
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <div className="mentor-profile-actions">
            <button onClick={handleSave} className="mentor-profile-save-btn mentor-profile-btn-animate">
              <FaSave /> Save
            </button>
            <button onClick={handleCancel} className="mentor-profile-cancel-btn mentor-profile-btn-animate">
              <FaTimes /> Cancel
            </button>
          </div>
        )}
      </div>

      {error && <div className="mentor-profile-error mentor-profile-fadein">{error}</div>}
      {success && <div className="mentor-profile-success mentor-profile-fadein">{success}</div>}

      <div className="mentor-profile-content">
        <div className="mentor-profile-section mentor-profile-section-animate">
          <h4>Personal Information</h4>
          <div className="mentor-profile-field">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.name}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Email</label>
            <p className="mentor-profile-value">{profile.email}</p>
          </div>
          <div className="mentor-profile-field">
            <label>Phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.phone}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Age</label>
            {isEditing ? (
              <input
                type="number"
                name="age"
                value={profile.age}
                onChange={handleChange}
                required
                min="10"
                max="100"
              />
            ) : (
              <p className="mentor-profile-value">{profile.age}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>County</label>
            {isEditing ? (
              <input
                type="text"
                name="county"
                value={profile.county}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.county}</p>
            )}
          </div>
        </div>

        <div className="mentor-profile-section mentor-profile-section-animate">
          <h4>Education & Professional</h4>
          <div className="mentor-profile-field">
            <label>Degree</label>
            {isEditing ? (
              <input
                type="text"
                name="degree"
                value={profile.degree}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.degree}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Education Level</label>
            {isEditing ? (
              <input
                type="text"
                name="educationLevel"
                value={profile.educationLevel}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.educationLevel}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Current Profession</label>
            {isEditing ? (
              <input
                type="text"
                name="currentProfession"
                value={profile.currentProfession}
                onChange={handleChange}
                required
              />
            ) : (
              <p className="mentor-profile-value">{profile.currentProfession}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Past Professions</label>
            {isEditing ? (
              <div className="mentor-profile-list">
                {profile.pastProfessions.map((prof, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={prof}
                    onChange={(e) => {
                      const newPastProfessions = [...profile.pastProfessions];
                      newPastProfessions[idx] = e.target.value;
                      setProfile(prev => prev ? { ...prev, pastProfessions: newPastProfessions } : null);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mentor-profile-list mentor-profile-chips">
                {profile.pastProfessions.map((prof, idx) => (
                  <span className="mentor-profile-chip" key={idx}>{prof}</span>
                ))}
              </div>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>LinkedIn</label>
            {isEditing ? (
              <input
                type="url"
                name="linkedin"
                value={profile.linkedin}
                onChange={handleChange}
                pattern="https?://(www\.)?linkedin\.com/in/[A-Za-z0-9\-_/]+/?"
                title="Please enter a valid LinkedIn profile URL"
              />
            ) : (
              <p className="mentor-profile-value">
                {profile.linkedin ? (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#4faaff', textDecoration: 'underline' }}>
                    View Profile
                  </a>
                ) : (
                  'Not provided'
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mentor-profile-section mentor-profile-section-animate">
          <h4>Skills & Interests</h4>
          <div className="mentor-profile-field">
            <label>{profile.type === 'mentor' ? 'Skills Offered' : 'Skills Looking For'}</label>
            <div className="mentor-profile-skills mentor-profile-chips">
              {(profile.type === 'mentor' ? profile.skills : profile.lookingFor).map((skill, idx) => (
                <span className="mentor-profile-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{skill}</span>
              ))}
            </div>
          </div>
          <div className="mentor-profile-field">
            <label>Hobbies & Interests</label>
            <div className="mentor-profile-list mentor-profile-chips">
              {profile.hobbies.map((hobby, idx) => (
                <span className="mentor-profile-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{hobby}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mentor-profile-section mentor-profile-section-animate">
          <h4>Additional Information</h4>
          <div className="mentor-profile-field">
            <label>Ethnicity</label>
            {isEditing ? (
              <input
                type="text"
                name="ethnicity"
                value={profile.ethnicity}
                onChange={handleChange}
              />
            ) : (
              <p className="mentor-profile-value">{profile.ethnicity || 'Not specified'}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Religion</label>
            {isEditing ? (
              <input
                type="text"
                name="religion"
                value={profile.religion}
                onChange={handleChange}
              />
            ) : (
              <p className="mentor-profile-value">{profile.religion || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 