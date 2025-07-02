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
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mentor-profile-linkedin-btn"
                    title="View LinkedIn Profile"
                  >
                    <svg className="linkedin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6, verticalAlign: 'middle' }}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.594v5.602z"/></svg>
                    LinkedIn
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
                <span className="mentor-profile-chip mentor-profile-skill-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{skill}</span>
              ))}
            </div>
          </div>
          <div className="mentor-profile-field">
            <label>Hobbies & Interests</label>
            <div className="mentor-profile-list mentor-profile-chips mentor-profile-hobbies-chips">
              {profile.hobbies.map((hobby, idx) => (
                <span className="mentor-profile-chip mentor-profile-hobby-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{hobby}</span>
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