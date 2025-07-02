import React, { useState, useEffect } from 'react';
import './MentorProgram.css';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import MentorProfile from './MentorProfile';
import { getBestMatchesForUser, MatchResult, MentorMenteeProfile } from './matchUsers';
import MentorModal from './MentorModal';
import skillsByCategory from '../../../constants/skillsByCategory';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import ethnicityOptions from '../../../constants/ethnicityOptions';
import religionOptions from '../../../constants/religionOptions';

type UserType = 'mentor' | 'mentee';

const MENTEE_MIN_AGE = 15;
const MENTEE_MAX_AGE = 19;

export default function MentorProgram() {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentees, setMentees] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    degree: '',
    educationLevel: '',
    county: '',
    currentProfession: '',
    pastProfessions: [''],
    linkedin: '',
    hobbies: [''],
    ethnicity: '',
    religion: '',
    skills: [] as string[],
    lookingFor: [] as string[],
    type: '' as UserType | ''
  });
  const [, setMatches] = useState<{ mentee: User; mentor: User }[]>([]);
  const [bestMatches, setBestMatches] = useState<MatchResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfile | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!currentUser) return;
      
      try {
        const mentorDoc = await getDoc(doc(db, 'mentorProgram', currentUser.uid));
        setHasProfile(mentorDoc.exists());
      } catch (err) {
        console.error('Error checking profile:', err);
      }
    };

    checkProfile();
  }, [currentUser]);

  // Fetch best matches for the current user
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser || !hasProfile) return;
      setLoadingMatches(true);
      try {
        const results = await getBestMatchesForUser(currentUser.uid);
        setBestMatches(results);
      } catch (err) {
        setBestMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [currentUser, hasProfile]);

  // Simple matching algorithm
  const matchMentees = () => {
    const newMatches: { mentee: User; mentor: User }[] = [];
    mentees.forEach(mentee => {
      const mentor = mentors.find(m =>
        m.skills.some(skill => mentee.lookingFor.includes(skill))
      );
      if (mentor) newMatches.push({ mentee, mentor });
    });
    setMatches(newMatches);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle skill toggle
  const handleSkillToggle = (skill: string, field: 'skills' | 'lookingFor') => {
    setForm(prev => {
      const arr = prev[field];
      const exists = arr.includes(skill);
      return {
        ...prev,
        [field]: exists ? arr.filter(s => s !== skill) : [...arr, skill],
      };
    });
  };

  // Handle dynamic past professions
  const handlePastProfessionChange = (idx: number, value: string) => {
    setForm(prev => {
      const updated = [...prev.pastProfessions];
      updated[idx] = value;
      return { ...prev, pastProfessions: updated };
    });
  };
  const addPastProfessionField = () => {
    setForm(prev => ({ ...prev, pastProfessions: [...prev.pastProfessions, ''] }));
  };
  const removePastProfessionField = (idx: number) => {
    setForm(prev => {
      const updated = prev.pastProfessions.filter((_, i) => i !== idx);
      return { ...prev, pastProfessions: updated.length ? updated : [''] };
    });
  };

  // Handle dynamic hobbies/interests
  const handleHobbyChange = (idx: number, value: string) => {
    setForm(prev => {
      const updated = [...prev.hobbies];
      updated[idx] = value;
      return { ...prev, hobbies: updated };
    });
  };
  const addHobbyField = () => {
    setForm(prev => ({ ...prev, hobbies: [...prev.hobbies, ''] }));
  };
  const removeHobbyField = (idx: number) => {
    setForm(prev => {
      const updated = prev.hobbies.filter((_, i) => i !== idx);
      return { ...prev, hobbies: updated.length ? updated : [''] };
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Age validation for mentees
    if (selectedRole === 'mentee') {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < MENTEE_MIN_AGE || ageNum > MENTEE_MAX_AGE) {
        setError(`Mentees must be between ${MENTEE_MIN_AGE} and ${MENTEE_MAX_AGE} years old.`);
        setLoading(false);
        return;
      }
    }
    const user: User = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      age: form.age,
      degree: form.degree,
      educationLevel: form.educationLevel,
      county: form.county,
      currentProfession: form.currentProfession,
      pastProfessions: form.pastProfessions.filter(p => p.trim() !== ''),
      linkedin: form.linkedin,
      hobbies: form.hobbies.filter(h => h.trim() !== ''),
      ethnicity: form.ethnicity,
      religion: form.religion,
      skills: form.skills,
      lookingFor: form.lookingFor,
      type: selectedRole!,
    };
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Save mentor/mentee profile with user.uid as document ID
      await setDoc(doc(db, 'mentorProgram', currentUser.uid), user);
      
      // Update user's profile with mentor/mentee status
      const roleUpdate = selectedRole === 'mentor' ? { mentor: true } : { mentee: true };
      await updateDoc(doc(db, 'users', currentUser.uid), roleUpdate);

      setSuccess('Successfully registered!');
      if (selectedRole === 'mentor') {
        setMentors(prev => [...prev, user]);
      } else {
        setMentees(prev => [...prev, user]);
      }
      setForm({
        name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', county: '',
        currentProfession: '', pastProfessions: [''], linkedin: '', hobbies: [''], ethnicity: '', religion: '',
        skills: [], lookingFor: [], type: ''
      });
      setTimeout(matchMentees, 0); // Update matches after state change
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: UserType) => {
    setSwipeDirection(role === 'mentor' ? 'left' : 'right');
    setTimeout(() => {
      setSelectedRole(role);
      setShowForm(true);
      setSwipeDirection(null);
      setForm({
        name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', county: '',
        currentProfession: '', pastProfessions: [''], linkedin: '', hobbies: [''], ethnicity: '', religion: '',
        skills: [], lookingFor: [], type: role
      });
      setError(null);
      setSuccess(null);
    }, 600); // match CSS transition duration
  };

  const handleBack = () => {
    setSelectedRole(null);
    setShowForm(false);
    setForm({
      name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', county: '',
      currentProfession: '', pastProfessions: [''], linkedin: '', hobbies: [''], ethnicity: '', religion: '',
      skills: [], lookingFor: [], type: ''
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <section className="mentor-program-widget">
      <h2>Mentor Program</h2>
      <p>Sign up as a mentor or mentee and get matched based on your skills and interests!</p>
      
      {hasProfile ? (
        <MentorProfile />
      ) : (
        <>
          {!selectedRole && !showForm ? (
            <div className={`mentor-role-cards${swipeDirection ? ` swipe-${swipeDirection}` : ''}`}>
              <div className="mentor-role-card mentor" onClick={() => handleRoleSelect('mentor')}>
                <FaChalkboardTeacher size={48} style={{ color: '#ff2a2a', marginBottom: 16 }} />
                <h3>Become a Mentor</h3>
                <p>Share your expertise and help guide the next generation. List your skills and get matched with mentees looking for your knowledge.</p>
              </div>
              <div className="mentor-role-card mentee" onClick={() => handleRoleSelect('mentee')}>
                <FaUserGraduate size={48} style={{ color: '#ff2a2a', marginBottom: 16 }} />
                <h3>Become a Mentee</h3>
                <p>Find a mentor to help you grow. Tell us what skills you're looking for and get matched with the right mentor for you.</p>
              </div>
            </div>
          ) : null}
          
          {showForm && (
            <div className="mentor-form-stage">
              <button className="mentor-back-btn" onClick={handleBack} type="button">&larr; Back</button>
              <form onSubmit={handleSubmit} className="mentor-form">
                <div className="mentor-form-row">
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Personal Information</div>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
                      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required type="tel" />
                      <input name="age" value={form.age} onChange={handleChange} placeholder="Age" required type="number" min="10" max="100" />
                      <select name="county" value={form.county} onChange={handleChange} required style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        <option value="" disabled>Select County</option>
                        {ukCounties.map(county => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Education</div>
                      <input name="degree" value={form.degree} onChange={handleChange} placeholder="Degree (e.g. BSc Computer Science)" required />
                      <select name="educationLevel" value={form.educationLevel} onChange={handleChange} required style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        <option value="" disabled>Select Education Level</option>
                        {ukEducationLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mentor-form-row">
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Professional Information</div>
                      <input name="currentProfession" value={form.currentProfession} onChange={handleChange} placeholder="Current Profession" required />
                      <div className="mentor-past-professions-list">
                        {form.pastProfessions.map((prof, idx) => (
                          <div key={idx} className="mentor-past-profession-field">
                            <input
                              name={`pastProfession${idx}`}
                              value={prof}
                              onChange={e => handlePastProfessionChange(idx, e.target.value)}
                              placeholder={idx === 0 ? 'Past Professions' : 'Additional Past Profession'}
                              required={idx === 0}
                              style={{ marginBottom: 4 }}
                            />
                            {form.pastProfessions.length > 1 && (
                              <button type="button" className="mentor-remove-btn" onClick={() => removePastProfessionField(idx)} title="Remove profession">&times;</button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="mentor-add-btn" onClick={addPastProfessionField} style={{ marginTop: 4, marginBottom: 8 }}>
                          + Add Profession
                        </button>
                      </div>
                      <input
                        name="linkedin"
                        value={form.linkedin}
                        onChange={handleChange}
                        placeholder="LinkedIn (optional)"
                        type="url"
                        pattern="https?://(www\.)?linkedin\.com/in/[A-Za-z0-9\-_/]+/?"
                        title="Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/your-profile)"
                      />
                    </div>
                  </div>
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Identity & Interests</div>
                      <div className="mentor-hobbies-list">
                        {form.hobbies.map((hobby, idx) => (
                          <div key={idx} className="mentor-hobby-field">
                            <input
                              name={`hobby${idx}`}
                              value={hobby}
                              onChange={e => handleHobbyChange(idx, e.target.value)}
                              placeholder={idx === 0 ? 'Hobbies / Interests (optional)' : 'Additional Hobby / Interest'}
                              style={{ marginBottom: 4 }}
                            />
                            {form.hobbies.length > 1 && (
                              <button type="button" className="mentor-remove-btn" onClick={() => removeHobbyField(idx)} title="Remove hobby">&times;</button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="mentor-add-btn" onClick={addHobbyField} style={{ marginTop: 4, marginBottom: 8 }}>
                          + Add Hobby / Interest
                        </button>
                      </div>
                      <select
                        name="ethnicity"
                        value={form.ethnicity}
                        onChange={handleChange}
                        style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}
                      >
                        <option value="" disabled>Select Ethnicity (optional)</option>
                        {ethnicityOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <select
                        name="religion"
                        value={form.religion}
                        onChange={handleChange}
                        style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}
                      >
                        <option value="" disabled>Select Religion (optional)</option>
                        {religionOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mentor-form-section skills-section">
                  <div className="mentor-form-section-title">Skills</div>
                  <div className="mentor-skills-list">
                    <label style={{ fontWeight: 600, color: '#ff2a2a', marginBottom: 8, display: 'block' }}>
                      {selectedRole === 'mentor' ? 'Select the skills you can offer:' : 'Select the skills you are looking for:'}
                    </label>
                    <div className="mentor-skills-categories">
                      {Object.entries(skillsByCategory).map(([category, skills]) => (
                        <div className="mentor-skills-category" key={category}>
                          <div className="mentor-skills-category-title">{category}</div>
                          <div className="mentor-skills-toggles">
                            {skills.map(skill => (
                              <button
                                type="button"
                                key={skill}
                                className={
                                  'mentor-skill-toggle' +
                                  ((selectedRole === 'mentor' ? form.skills : form.lookingFor).includes(skill) ? ' selected' : '')
                                }
                                onClick={() => handleSkillToggle(skill, selectedRole === 'mentor' ? 'skills' : 'lookingFor')}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading || (selectedRole === 'mentor' ? form.skills.length === 0 : form.lookingFor.length === 0)}>
                  {loading ? 'Saving...' : 'Sign Up'}
                </button>
              </form>
              {error && <p style={{ color: '#ff2a2a', marginTop: '1rem' }}>{error}</p>}
              {success && <p style={{ color: '#00ff00', marginTop: '1rem' }}>{success}</p>}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>Matches</h3>
        {loadingMatches ? (
          <p>Loading matches...</p>
        ) : bestMatches.length === 0 ? (
          <p>No matches yet. Sign up as a mentor or mentee!</p>
        ) : (
          <div className="matches-grid">
            {bestMatches.map((match, idx) => {
              const user = match.user;
              return (
                <div className="match-card" key={idx} onClick={() => { setModalUser(user); setModalOpen(true); }} style={{ cursor: 'pointer' }}>
                  <div className="match-card-header">
                    <div className="match-card-title">
                      <span className="match-card-name">{user.name}</span>
                      <span className="match-card-type">({user.type})</span>
                    </div>
                    <div className="match-card-score">
                      Match Score: <span className="match-card-score-value">{match.score}</span>
                    </div>
                  </div>
                  <div className="match-card-info">
                    <div className="match-card-row">
                      <span className="match-card-label">Email:</span>
                      <span className="match-card-value">{user.email}</span>
                    </div>
                    <div className="match-card-row">
                      <span className="match-card-label">Profession:</span>
                      <span className="match-card-value">{user.currentProfession}</span>
                    </div>
                    <div className="match-card-row">
                      <span className="match-card-label">Education:</span>
                      <span className="match-card-value">{user.degree} ({user.educationLevel})</span>
                    </div>
                    <div className="match-card-row">
                      <span className="match-card-label">Skills:</span>
                      <span className="match-card-value">
                        {(user.skills && user.skills.length > 0)
                          ? user.skills.slice(0, 3).join(', ') + (user.skills.length > 3 ? `, +${user.skills.length - 3} more` : '')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="match-card-row">
                      <span className="match-card-label">Looking For:</span>
                      <span className="match-card-value">
                        {(user.lookingFor && user.lookingFor.length > 0)
                          ? user.lookingFor.slice(0, 3).join(', ') + (user.lookingFor.length > 3 ? `, +${user.lookingFor.length - 3} more` : '')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="match-card-reasons">
                    {match.reasons.map((reason, i) => (
                      <div className="match-card-reason" key={i}>{reason}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MentorModal open={modalOpen} onClose={() => setModalOpen(false)} user={modalUser} />
    </section>
  );
} 