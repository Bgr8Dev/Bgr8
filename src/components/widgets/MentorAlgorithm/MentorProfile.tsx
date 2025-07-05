import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './MentorProgram.css';
import industriesList from '../../../constants/industries';
import subjects from '../../../constants/subjects';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import { MentorMenteeProfile } from './matchUsers';

export default function MentorProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<MentorMenteeProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [subjectsDropdownOpen, setSubjectsDropdownOpen] = useState(false);
  const [hobbiesDropdownOpen, setHobbiesDropdownOpen] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        const mentorDoc = await getDoc(doc(db, 'mentorProgram', currentUser.uid));
        if (mentorDoc.exists()) {
          setProfile(mentorDoc.data() as MentorMenteeProfile);
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
        industries: profile.industries,
        type: profile.type,
        subjects: profile.subjects
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
          <div className="mentor-profile-field">
            <label>Subjects</label>
            {isEditing ? (
              <div
                className="custom-multiselect-dropdown"
                tabIndex={0}
                style={{ position: 'relative', marginTop: 4 }}
              >
                <div
                  className="custom-multiselect-control"
                  style={{
                    background: '#181818',
                    color: '#fff',
                    border: '1.5px solid #3a0a0a',
                    borderRadius: 8,
                    padding: '0.7rem 1rem',
                    fontSize: '1rem',
                    minHeight: 44,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                  }}
                  onClick={() => setSubjectsDropdownOpen(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={subjectsDropdownOpen}
                >
                  <span style={{ color: profile.subjects.length === 0 ? '#888' : '#fff' }}>
                    {profile.subjects.length === 0 ? 'Select subjects...' : `${profile.subjects.length} selected`}
                  </span>
                  <span style={{ fontSize: 18, color: '#ff2a2a', marginLeft: 8 }}>
                    ▼
                  </span>
                </div>
                {subjectsDropdownOpen && (
                  <div
                    className="custom-multiselect-options"
                    style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      width: '100%',
                      background: '#181818',
                      border: '1.5px solid #3a0a0a',
                      borderRadius: 8,
                      zIndex: 20,
                      maxHeight: 220,
                      overflowY: 'auto',
                      boxShadow: '0 4px 18px rgba(255,42,42,0.13)',
                    }}
                  >
                    {subjects.map(subj => (
                      <label
                        key={subj}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16, padding: '0.5rem 1rem', cursor: 'pointer',
                          background: profile.subjects.includes(subj) ? 'rgba(0,119,181,0.13)' : 'transparent',
                          color: profile.subjects.includes(subj) ? '#00eaff' : '#fff',
                          fontWeight: profile.subjects.includes(subj) ? 700 : 400,
                          borderRadius: 6,
                          marginBottom: 0,
                          transition: 'background 0.15s, color 0.15s',
                          fontSize: '1.08rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={profile.subjects.includes(subj)}
                          onChange={() => {
                            setProfile(prev => prev ? {
                              ...prev,
                              subjects: prev.subjects.includes(subj)
                                ? prev.subjects.filter((s: string) => s !== subj)
                                : [...prev.subjects, subj],
                            } : null);
                          }}
                          style={{
                            accentColor: '#00eaff',
                            marginRight: 0,
                            width: 16,
                            height: 16,
                            flexShrink: 0,
                            verticalAlign: 'middle'
                          }}
                        />
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '1.08rem', letterSpacing: 0.2 }}>{subj}</span>
                      </label>
                    ))}
                  </div>
                )}
                {profile.subjects.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.subjects.map((subj) => (
                      <span className="mentor-profile-chip mentor-profile-industry-chip" key={subj} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {subj}
                        <button
                          type="button"
                          aria-label={`Remove ${subj}`}
                          onClick={e => {
                            e.preventDefault();
                            setProfile(prev => prev ? { ...prev, subjects: prev.subjects.filter((s: string) => s !== subj) } : null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00eaff',
                            fontWeight: 700,
                            fontSize: 18,
                            cursor: 'pointer',
                            marginLeft: 2,
                            lineHeight: 1
                          }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mentor-profile-list mentor-profile-chips mentor-profile-industries-chips">
                {profile.subjects && profile.subjects.length > 0 ? (
                  profile.subjects.map((subj, idx) => (
                    <span className="mentor-profile-chip mentor-profile-industry-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{subj}</span>
                  ))
                ) : (
                  <p className="mentor-profile-value">Not specified</p>
                )}
              </div>
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
              <select
                name="educationLevel"
                value={profile.educationLevel}
                onChange={handleChange}
                required
                style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', width: '100%' }}
              >
                <option value="">Select Education Level</option>
                {ukEducationLevels
                  .filter(level => {
                    // For mentees, only show up to Bachelor's degree
                    if (profile.type === 'mentee') {
                      const menteeLevels = [
                        'GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree"
                      ];
                      return menteeLevels.includes(level);
                    }
                    // For mentors, show all levels
                    return true;
                  })
                  .map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
              </select>
            ) : (
              <p className="mentor-profile-value">{profile.educationLevel}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label className="mentor-profile-label">{profile.type === 'mentee' ? 'Desired Profession' : 'Current Profession'}</label>
            {isEditing ? (
              <input
                type="text"
                name="currentProfession"
                value={profile.currentProfession}
                onChange={handleChange}
                required
                className="mentor-profile-input"
                style={{ width: '100%', padding: '0.8rem', border: '1.5px solid #3a0a0a', borderRadius: 8, background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: 0 }}
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
          <div className="mentor-profile-field">
            <label>{profile.type === 'mentor' ? 'Industries (Current/Previous)' : 'Industries (Desired)'}</label>
            {isEditing ? (
              <>
                <select
                  name="industries"
                  multiple
                  value={profile.industries || []}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, o => o.value);
                    setProfile(prev => prev ? { ...prev, industries: options } : null);
                  }}
                  style={{ minHeight: 90, background: '#181818', color: '#fff', border: '1.5px solid #3a0a0a', borderRadius: 8, padding: '0.7rem 1rem', fontSize: '1rem' }}
                >
                  {industriesList.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                {profile.industries && profile.industries.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.industries.map((industry) => (
                      <span className="mentor-profile-chip mentor-profile-industry-chip" key={industry} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {industry}
                        <button
                          type="button"
                          aria-label={`Remove ${industry}`}
                          onClick={e => {
                            e.preventDefault();
                            setProfile(prev => prev ? { ...prev, industries: prev.industries.filter((i: string) => i !== industry) } : null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00eaff',
                            fontWeight: 700,
                            fontSize: 18,
                            cursor: 'pointer',
                            marginLeft: 2,
                            lineHeight: 1
                          }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mentor-profile-list mentor-profile-chips mentor-profile-industries-chips">
                {(profile.industries || []).map((industry, idx) => (
                  <span className="mentor-profile-chip mentor-profile-industry-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={idx}>{industry}</span>
                ))}
              </div>
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
            {isEditing ? (
              <div
                className="custom-multiselect-dropdown"
                tabIndex={0}
                style={{ position: 'relative', marginTop: 4 }}
              >
                <div
                  className="custom-multiselect-control"
                  style={{
                    background: '#181818',
                    color: '#fff',
                    border: '1.5px solid #3a0a0a',
                    borderRadius: 8,
                    padding: '0.7rem 1rem',
                    fontSize: '1rem',
                    minHeight: 44,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                  }}
                  onClick={() => setHobbiesDropdownOpen(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={hobbiesDropdownOpen}
                >
                  <span style={{ color: profile.hobbies.length === 0 ? '#888' : '#fff' }}>
                    {profile.hobbies.length === 0 ? 'Select hobbies...' : `${profile.hobbies.length} selected`}
                  </span>
                  <span style={{ fontSize: 18, color: '#ffb300', marginLeft: 8 }}>
                    ▼
                  </span>
                </div>
                {hobbiesDropdownOpen && (
                  <div
                    className="custom-multiselect-options"
                    style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      width: '100%',
                      background: '#181818',
                      border: '1.5px solid #3a0a0a',
                      borderRadius: 8,
                      zIndex: 20,
                      maxHeight: 320,
                      overflowY: 'auto',
                      boxShadow: '0 4px 18px rgba(255,42,42,0.13)',
                      padding: '0.5rem 0',
                    }}
                  >
                    {Object.entries(hobbiesByCategory).map(([category, hobbies]) => (
                      <div key={category} style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: '#ffb300', fontSize: '1.02rem', margin: '0.5rem 0 0.2rem 0.7rem' }}>{category.replace(/([A-Z])/g, ' $1').trim()}</div>
                        {hobbies.map(hobby => (
                          <label
                            key={hobby}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 16, padding: '0.5rem 1rem', cursor: 'pointer',
                              background: profile.hobbies.includes(hobby) ? 'rgba(255,179,0,0.13)' : 'transparent',
                              color: profile.hobbies.includes(hobby) ? '#ffb300' : '#fff',
                              fontWeight: profile.hobbies.includes(hobby) ? 700 : 400,
                              borderRadius: 6,
                              marginBottom: 0,
                              transition: 'background 0.15s, color 0.15s',
                              fontSize: '1.08rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={profile.hobbies.includes(hobby)}
                              onChange={() => {
                                setProfile(prev => prev ? {
                                  ...prev,
                                  hobbies: prev.hobbies.includes(hobby)
                                    ? prev.hobbies.filter((h: string) => h !== hobby)
                                    : [...prev.hobbies, hobby],
                                } : null);
                              }}
                              style={{
                                accentColor: '#ffb300',
                                marginRight: 0,
                                width: 16,
                                height: 16,
                                flexShrink: 0,
                                verticalAlign: 'middle'
                              }}
                            />
                            <span style={{ flex: 1, textAlign: 'left', fontSize: '1.08rem', letterSpacing: 0.2 }}>{hobby}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {profile.hobbies.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.hobbies.map((hobby) => (
                      <span className="mentor-profile-chip mentor-profile-hobby-chip" key={hobby} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {hobby}
                        <button
                          type="button"
                          aria-label={`Remove ${hobby}`}
                          onClick={e => {
                            e.preventDefault();
                            setProfile(prev => prev ? { ...prev, hobbies: prev.hobbies.filter((h: string) => h !== hobby) } : null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffb300',
                            fontWeight: 700,
                            fontSize: 18,
                            cursor: 'pointer',
                            marginLeft: 2,
                            lineHeight: 1
                          }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mentor-profile-list mentor-profile-chips mentor-profile-hobbies-chips">
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  Object.entries(hobbiesByCategory).map(([category, hobbies]) => (
                    <React.Fragment key={category}>
                      {profile.hobbies.some(hobby => hobbies.includes(hobby)) && (
                        <div style={{ marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, color: '#ffb300', fontSize: '1.02rem', margin: '0.5rem 0 0.2rem 0.7rem' }}>{category.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {hobbies.filter(hobby => profile.hobbies.includes(hobby)).map((hobby, idx) => (
                              <span className="mentor-profile-chip mentor-profile-hobby-chip mentor-profile-chip-animate" style={{ animationDelay: `${0.05 * idx + 0.1}s` }} key={hobby}>{hobby}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="mentor-profile-value">Not specified</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mentor-profile-section mentor-profile-section-animate">
          <h4>Additional Information</h4>
          <div className="mentor-profile-field">
            <label>Ethnicity</label>
            {isEditing ? (
              <select
                name="ethnicity"
                value={profile.ethnicity}
                onChange={handleChange}
                style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', width: '100%' }}
              >
                <option value="">Select Ethnicity</option>
                {ethnicityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <p className="mentor-profile-value">{profile.ethnicity || 'Not specified'}</p>
            )}
          </div>
          <div className="mentor-profile-field">
            <label>Religion</label>
            {isEditing ? (
              <select
                name="religion"
                value={profile.religion}
                onChange={handleChange}
                style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', width: '100%' }}
              >
                <option value="">Select Religion</option>
                {religionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <p className="mentor-profile-value">{profile.religion || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 