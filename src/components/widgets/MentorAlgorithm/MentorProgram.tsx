import React, { useState, useEffect, useRef } from 'react';
import './MentorProgram.css';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FaUserGraduate, FaChalkboardTeacher, FaUserFriends, FaMapMarkerAlt, FaGraduationCap, FaBrain, FaStar, FaRegSmile, FaChartLine, FaUserTie, FaQuestionCircle, FaSyncAlt } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import MentorProfile from './MentorProfile';
import { ageCloseReasonIDs, ageExperiencedMentorReasonIDs, ageReasonIDs, checkReasonType, countyReasonIDs, educationLevelReasonIDs, getBestMatchesForUser, 
  hobbiesReasonIDs, industriesReasonIDs, MatchResult, MENTEE, MENTOR, MentorMenteeProfile, professionReasonIDs, skillsReasonIDs, UserType } from './algorithm/matchUsers';
import MentorModal from './MentorModal';
import BookingModal from './booking/BookingModal';
import CalComModal from './CalCom/CalComModal';
import skillsByCategory from '../../../constants/skillsByCategory';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';
import {ethnicityOptions} from '../../../constants/ethnicityOptions';
import {religionOptions} from '../../../constants/religionOptions';
import industriesList from '../../../constants/industries';
import hobbiesByCategory from '../../../constants/hobbiesByCategory';
import MatchStrengthRing from './MatchStrengthRing';

const MENTEE_MIN_AGE = 15;
const MENTEE_MAX_AGE = 19;

export default function MentorProgram() {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState<MentorMenteeProfile[]>([]);
  const [mentees, setMentees] = useState<MentorMenteeProfile[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    degree: '',
    educationLevel: '',
    county: '',
    profession: '',
    pastProfessions: [''],
    linkedin: '',
    calCom: '',
    hobbies: [] as string[],
    ethnicity: '',
    religion: '',
    skills: [] as string[],
    lookingFor: [] as string[],
    industries: [] as string[],
    type: '' as UserType | ''
  });
  const [, setMatches] = useState<{ mentee: MentorMenteeProfile; mentor: MentorMenteeProfile }[]>([]);
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
  const [currentUserProfile, setCurrentUserProfile] = useState<MentorMenteeProfile | null>(null);
  const [industriesDropdownOpen, setIndustriesDropdownOpen] = useState(false);
  const [hobbiesDropdownOpen, setHobbiesDropdownOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingMentor, setBookingMentor] = useState<MentorMenteeProfile | null>(null);
  const [calComModalOpen, setCalComModalOpen] = useState(false);
  const [calComMentor, setCalComMentor] = useState<MentorMenteeProfile | null>(null);
  const industriesDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const MATCHES_PER_PAGE = 6;
  const totalPages = Math.ceil(bestMatches.length / MATCHES_PER_PAGE);
  const paginatedMatches = bestMatches.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE);

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const docSnap = await getDoc(doc(db, 'mentorProgram', currentUser.uid));
        if (docSnap.exists()) setCurrentUserProfile(docSnap.data() as MentorMenteeProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [currentUser]);

  // Fetch best matches for the current user
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser || !hasProfile) return;
      setLoadingMatches(true);
      try {
        const results = await getBestMatchesForUser(currentUser.uid);
        setBestMatches(results);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setBestMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [currentUser, hasProfile]);

  // Add manual refresh function
  const refreshMatches = async () => {
    if (!currentUser || !hasProfile) return;
    setLoadingMatches(true);
    try {
      const results = await getBestMatchesForUser(currentUser.uid);
      setBestMatches(results);
    } catch (error) {
      console.error('Error refreshing matches:', error);
      setBestMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Close industries dropdown on outside click or Escape
  useEffect(() => {
    if (!industriesDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (industriesDropdownRef.current && !industriesDropdownRef.current.contains(e.target as Node)) {
        setIndustriesDropdownOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIndustriesDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [industriesDropdownOpen]);

  // Simple matching algorithm
  const matchMentees = () => {
    const newMatches: { mentee: MentorMenteeProfile; mentor: MentorMenteeProfile }[] = [];
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
    if (e.target instanceof HTMLSelectElement && e.target.multiple) {
      const options = Array.from(e.target.selectedOptions, o => o.value);
      setForm(prev => ({ ...prev, [name]: options }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Age validation for mentees
    if (selectedRole === MENTEE) {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < MENTEE_MIN_AGE || ageNum > MENTEE_MAX_AGE) {
        setError(`Mentees must be between ${MENTEE_MIN_AGE} and ${MENTEE_MAX_AGE} years old.`);
        setLoading(false);
        return;
      }
    }

    // Cal.com validation for mentors
    if (selectedRole === MENTOR) {
      if (!form.calCom || form.calCom.trim() === '') {
        setError('Cal.com URL is required for mentors.');
        setLoading(false);
        return;
      }
      if (!form.calCom.match(/^https?:\/\/.*\.cal\.com\/.*$/)) {
        setError('Please enter a valid Cal.com URL (e.g. https://yourname.cal.com/30min).');
        setLoading(false);
        return;
      }
    }

    if (!currentUser) {
      setError('No user logged in');
      setLoading(false);
      return;
    }
    const user: MentorMenteeProfile = {
      uid: currentUser.uid,
      name: form.name,
      email: form.email,
      phone: form.phone,
      age: form.age,
      degree: form.degree,
      educationLevel: form.educationLevel,
      county: form.county,
      profession: form.profession,
      pastProfessions: form.pastProfessions.filter(p => p.trim() !== ''),
      linkedin: form.linkedin,
      calCom: form.calCom,
      hobbies: form.hobbies.filter(h => h.trim() !== ''),
      ethnicity: form.ethnicity,
      religion: form.religion,
      skills: form.skills,
      lookingFor: form.lookingFor,
      industries: form.industries,
      type: selectedRole!,
    };
    try {
      
      // Save mentor/mentee profile with user.uid as document ID
      await setDoc(doc(db, 'mentorProgram', currentUser.uid), user);
      
      // Update user's profile with mentor/mentee status
      const roleUpdate = selectedRole === MENTOR ? { mentor: true } : { mentee: true };
      await updateDoc(doc(db, 'users', currentUser.uid), roleUpdate);

      setSuccess('Successfully registered!');
      if (selectedRole === MENTOR) {
        setMentors(prev => [...prev, user]);
      } else {
        setMentees(prev => [...prev, user]);
      }
      setForm({
        name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', county: '',
        profession: '', pastProfessions: [''], linkedin: '', calCom: '', hobbies: [''], ethnicity: '', religion: '',
        skills: [], lookingFor: [], industries: [], type: ''
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
    setSwipeDirection(role === MENTOR ? 'left' : 'right');
    setTimeout(() => {
      setSelectedRole(role);
      setShowForm(true);
      setSwipeDirection(null);
      setForm({
        name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', county: '',
        profession: '', pastProfessions: [''], linkedin: '', calCom: '', hobbies: [''], ethnicity: '', religion: '',
        skills: [], lookingFor: [], industries: [], type: role
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
      profession: '', pastProfessions: [''], linkedin: '', calCom: '', hobbies: [''], ethnicity: '', religion: '',
      skills: [], lookingFor: [], industries: [], type: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Tooltip logic for match reasons
  function getReasonTooltip(reason: string, match: MatchResult, user: MentorMenteeProfile, currentUserProfile: MentorMenteeProfile | null): string {
    // Skill match
    if (checkReasonType(skillsReasonIDs, reason)) {
      // Find the actual skills matched
      if (!currentUserProfile) return 'Skills matched.';
      const isMentor = currentUserProfile.type === MENTOR;
      const skills = isMentor
        ? currentUserProfile.skills.filter(skill => user.lookingFor.includes(skill))
        : user.skills.filter(skill => currentUserProfile.lookingFor.includes(skill));
      return skills.length > 0 ? `Matched skills: ${skills.join(', ')}` : 'Skills matched.';
    }
    // Hobbies/interests
    if (checkReasonType(hobbiesReasonIDs, reason)) {
      if (!currentUserProfile) return 'Hobbies/interests matched.';
      const hobbies = currentUserProfile.hobbies.filter(h => user.hobbies.includes(h));
      return hobbies.length > 0 ? `Matched hobbies/interests: ${hobbies.join(', ')}` : 'Hobbies/interests matched.';
    }
    // County
    if (checkReasonType(countyReasonIDs, reason)) {
      return `Both are in ${user.county}.`;
    }
    // Education
    if (checkReasonType(educationLevelReasonIDs, reason)) {
      if (currentUserProfile?.type == MENTOR)
        return `You have a higher education level: ${currentUserProfile.educationLevel} > ${user.educationLevel}.`;
      else
        return `${user?.name} has a higher education level: ${user.educationLevel} > ${currentUserProfile?.educationLevel}.`;
    }
    // Age/experience
    if (checkReasonType(ageExperiencedMentorReasonIDs, reason)) {
      if (!currentUserProfile) return 'Mentor is older.';
      const ageDiff = Math.abs(Number(currentUserProfile.age) - Number(user.age));
      return `${user.type == MENTOR ? user.name + " is" : "You are"} older by ${ageDiff} years.`;
    }
    if (checkReasonType(ageCloseReasonIDs, reason)) {
      if (!currentUserProfile) return 'Close in age.';
      const ageDiff = Math.abs(Number(currentUserProfile.age) - Number(user.age));
      return `You are close in age (difference: ${ageDiff} years).`;
    }
    // Fallback
    return reason;
  }

  // Color grading for match score
  function getScoreColor(score: number) {
    // Clamp score between 0 and 100
    const s = Math.max(0, Math.min(100, score));
    // Interpolate hue from 0 (gray) to 120 (green)
    // We'll use HSL: gray is hsl(0,0%,53%), green is hsl(120,100%,45%)
    const hue = 120 * (s / 100);
    const sat = s < 10 ? 0 : 100; // very low scores are gray
    const light = 45 + (8 * (1 - s / 100)); // slightly lighter for low scores
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  // SuccessModal component
  function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useEffect(() => {
      if (!open) return;
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }, [open, onClose]);
    if (!open) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeInModalBg 0.3s'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #181818 80%, #2d0000 100%)',
          borderRadius: 18, boxShadow: '0 8px 48px rgba(255,42,42,0.18), 0 2px 12px rgba(0,0,0,0.22)',
          padding: '2.5rem 2.2rem 2rem 2.2rem', minWidth: 320, maxWidth: 400, color: '#fff', textAlign: 'center',
          position: 'relative',
          border: '2px solid #00ff00',
          animation: 'fadeInModal 0.3s cubic-bezier(0.77,0,0.175,1)'
        }}>
          <div style={{ marginBottom: 24 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto' }}>
              <circle cx="32" cy="32" r="30" fill="#181818" stroke="#00ff00" strokeWidth="4" />
              <polyline points="20,34 30,44 46,24" fill="none" stroke="#00ff00" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="stroke-dasharray" from="0,60" to="60,0" dur="0.7s" fill="freeze" />
              </polyline>
            </svg>
          </div>
          <h2 style={{ color: '#00ff00', fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>Success!</h2>
          <div style={{ color: '#fff', fontSize: '1.15rem', marginBottom: 18 }}>You have successfully registered.</div>
          <button onClick={onClose} style={{
            background: 'linear-gradient(90deg, #ff2a2a 60%, #a80000 100%)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '0.8rem 2.2rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer',
            marginTop: 8, boxShadow: '0 2px 12px rgba(255,42,42,0.15)', transition: 'background 0.2s, transform 0.2s'
          }}>OK</button>
        </div>
      </div>
    );
  }

  // SuccessModal close handler: also reset form view
  const handleSuccessModalClose = () => {
    setSuccess(null);
    setSelectedRole(null);
    setShowForm(false);
  };

  const degreePlaceholders: Record<string, string> = {
    "GCSEs": "e.g. 9 GCSEs, including Maths and English",
    "A-Levels": "e.g. A-Levels in Maths, Physics, Chemistry",
    "BTEC": "e.g. BTEC Level 3 in Business",
    "Foundation Degree": "e.g. Foundation Degree in Art & Design",
    "Bachelor's Degree": "e.g. BSc Computer Science",
    "Master's Degree": "e.g. MSc Artificial Intelligence",
    "PhD": "e.g. PhD in Molecular Biology",
    "Other": "e.g. Diploma in Marketing",
  };

  // Map reason keywords to icon and color
  const reasonIconMap: { [key: string]: { icon: React.ReactNode; color: string } } = {
    skills: { icon: <FaBrain />, color: '#00e676' },
    profession: { icon: <FaUserTie />, color: '#ffb300' },
    industries: { icon: <FaUserTie />, color: '#ffff30' },
    hobbies: { icon: <FaRegSmile />, color: '#ff6f00' },
    county: { icon: <FaMapMarkerAlt />, color: '#42a5f5' },
    educationLevel: { icon: <FaGraduationCap />, color: '#ab47bc' },
    experience: { icon: <FaChartLine />, color: '#00bcd4' },
    age: { icon: <FaUserFriends />, color: '#ff2a2a' },
    top: { icon: <FaStar />, color: '#ffd700' },
    default: { icon: <FaQuestionCircle />, color: '#888' },
  };
  // Helper to get icon/color for a reason
  function getReasonBadgeProps(reason: string) {
    const r = reason.toLowerCase();
    if (checkReasonType(skillsReasonIDs, reason)) return reasonIconMap.skills;
    if (checkReasonType(professionReasonIDs, reason)) return reasonIconMap.profession;
    if (checkReasonType(industriesReasonIDs, reason)) return reasonIconMap.industries;
    if (checkReasonType(hobbiesReasonIDs, reason)) return reasonIconMap.hobbies;
    if (checkReasonType(countyReasonIDs, reason)) return reasonIconMap.county;
    if (checkReasonType(educationLevelReasonIDs, reason)) return reasonIconMap.educationLevel;
    if (checkReasonType(ageExperiencedMentorReasonIDs, reason)) return reasonIconMap.experience;
    if (checkReasonType(ageCloseReasonIDs, reason)) return reasonIconMap.age;
    if (r.includes('top')) return reasonIconMap.top;
    return reasonIconMap.default;
  }

  // Reset to page 1 if matches change
  useEffect(() => {
    setCurrentPage(1);
  }, [bestMatches.length]);

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
              <div className="mentor-role-card mentor" onClick={() => handleRoleSelect(MENTOR)}>
                <FaChalkboardTeacher size={48} style={{ color: '#ff2a2a', marginBottom: 16 }} />
                <h3>Become a Mentor</h3>
                <p>Share your expertise and help guide the next generation. List your skills and get matched with mentees looking for your knowledge.</p>
              </div>
              <div className="mentor-role-card mentee" onClick={() => handleRoleSelect(MENTEE)}>
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
                      <input name="degree" value={form.degree} onChange={handleChange} 
                        placeholder={degreePlaceholders[form.educationLevel] || "Degree (e.g. BSc Computer Science)"} />
                      <select name="educationLevel" value={form.educationLevel} onChange={handleChange} required style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        <option value="" disabled>Select Education Level</option>
                        {ukEducationLevels
                          .filter(level => {
                            // For mentees, only show up to Bachelor's degree
                            if (selectedRole === MENTEE) {
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
                    </div>
                  </div>
                </div>
                <div className="mentor-form-row">
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Industries</div>
                      <div style={{ fontWeight: 600, color: '#ff2a2a', marginBottom: 8, display: 'block', marginTop: 8 }}>
                        {selectedRole === MENTOR ? 'Industries (Current/Previous)' : 'Industries (Desired)'}
                        <div
                          ref={industriesDropdownRef}
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
                            onClick={() => setIndustriesDropdownOpen(v => !v)}
                            aria-haspopup="listbox"
                          >
                            <span style={{ color: form.industries.length === 0 ? '#888' : '#fff' }}>
                              {form.industries.length === 0 ? 'Select industries...' : `${form.industries.length} selected`}
                            </span>
                            <span style={{ fontSize: 18, color: '#ff2a2a', marginLeft: 8 }}>
                              ▼
                            </span>
                          </div>
                          {industriesDropdownOpen && (
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
                              {industriesList.map(ind => (
                                <label
                                  key={ind}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    background: form.industries.includes(ind) ? 'rgba(0,119,181,0.13)' : 'transparent',
                                    color: form.industries.includes(ind) ? '#00eaff' : '#fff',
                                    fontWeight: form.industries.includes(ind) ? 700 : 400,
                                    borderRadius: 6,
                                    marginBottom: 0,
                                    transition: 'background 0.15s, color 0.15s',
                                    fontSize: '1.08rem',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.industries.includes(ind)}
                                    onChange={() => {
                                      setForm(prev => ({
                                        ...prev,
                                        industries: prev.industries.includes(ind)
                                          ? prev.industries.filter((i: string) => i !== ind)
                                          : [...prev.industries, ind],
                                      }));
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
                                  <span style={{ flex: 1, textAlign: 'left', fontSize: '1.08rem', letterSpacing: 0.2 }}>{ind}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {form.industries.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {form.industries.map((industry) => (
                                <span className="mentor-profile-chip mentor-profile-industry-chip" key={industry} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {industry}
                                  <button
                                    type="button"
                                    aria-label={`Remove ${industry}`}
                                    onClick={e => {
                                      e.preventDefault();
                                      setForm(prev => ({ ...prev, industries: prev.industries.filter((i: string) => i !== industry) }));
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
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mentor-form-row">
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Professional Information</div>
                      <div className="mentor-profile-field">
                        <label className="mentor-profile-label">{selectedRole === MENTEE ? 'Desired Profession' : 'Current Profession'}</label>
                        <input
                          name="profession"
                          value={form.profession}
                          onChange={handleChange}
                          required
                          placeholder={selectedRole === MENTEE ? 'Desired Profession (e.g. Software Engineer)' : 'Current Profession (e.g. Software Engineer)'}
                          className="mentor-profile-input"
                          style={{ width: '100%', padding: '0.8rem', border: '1.5px solid #3a0a0a', borderRadius: 8, background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: 0 }}
                        />
                      </div>
                      <div className="mentor-past-professions-list">
                        {form.pastProfessions.map((prof, idx) => (
                          <div key={idx} className="mentor-past-profession-field">
                            <input
                              name={`pastProfession${idx}`}
                              value={prof}
                              onChange={e => handlePastProfessionChange(idx, e.target.value)}
                              placeholder={idx === 0 ? 'Past Professions' : 'Additional Past Profession'}
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
                      {selectedRole === MENTOR && (
                        <input
                          name="calCom"
                          value={form.calCom}
                          onChange={handleChange}
                          placeholder="Cal.com URL (required for mentors)"
                          type="url"
                          required
                          pattern="https?://.*\.cal\.com/.*"
                          title="Please enter a valid Cal.com URL (e.g. https://yourname.cal.com/30min)"
                          style={{ borderColor: form.calCom ? '#3a0a0a' : '#ff2a2a' }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="mentor-form-half">
                    <div className="mentor-form-section">
                      <div className="mentor-form-section-title">Identity & Interests</div>
                      <select 
                        name="ethnicity" 
                        value={form.ethnicity} 
                        onChange={handleChange} 
                        required
                        style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}
                      >
                        <option value="" disabled>Select Ethnicity</option>
                        {ethnicityOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <select 
                        name="religion" 
                        value={form.religion} 
                        onChange={handleChange} 
                        style={{ padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}
                      >
                        <option value="" disabled>Select Religion</option>
                        {religionOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <div style={{ fontWeight: 600, color: '#ff2a2a', marginBottom: 8, marginTop: 8 }}>
                        Hobbies & Interests
                      </div>
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
                          >
                            <span style={{ color: form.hobbies.length === 0 ? '#888' : '#fff' }}>
                              {form.hobbies.filter(h => h && h.trim() !== '').length === 0
                                ? 'Select hobbies...'
                                : `${form.hobbies.filter(h => h && h.trim() !== '').length} selected`}
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
                                  <div style={{ fontWeight: 700, color: '#ffb300', fontSize: '1.02rem', margin: '0.5rem 0 0.2rem 0.7rem' }}>
                                    {category.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  {hobbies.map(hobby => (
                                    <label
                                      key={hobby}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 16, padding: '0.5rem 1rem', cursor: 'pointer',
                                        background: form.hobbies.includes(hobby) ? 'rgba(255,179,0,0.13)' : 'transparent',
                                        color: form.hobbies.includes(hobby) ? '#ffb300' : '#fff',
                                        fontWeight: form.hobbies.includes(hobby) ? 700 : 400,
                                        borderRadius: 6,
                                        marginBottom: 0,
                                        transition: 'background 0.15s, color 0.15s',
                                        fontSize: '1.08rem',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={form.hobbies.includes(hobby)}
                                        onChange={() => {
                                          if (!hobby || hobby.trim() === '') return;
                                          setForm(prev => {
                                            const isSelected = prev.hobbies.includes(hobby);
                                            const updated = isSelected
                                              ? prev.hobbies.filter(h => h !== hobby)
                                              : [...prev.hobbies, hobby];

                                            return {
                                              ...prev,
                                              hobbies: updated.filter(h => h && h.trim() !== '') // Sanitize
                                            };
                                          });
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

                          {form.hobbies.filter(h => h && h.trim() !== '').length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {form.hobbies
                                .filter(h => h && h.trim() !== '')
                                .map((hobby) => (
                                  <span className="mentor-profile-chip mentor-profile-hobby-chip" key={hobby} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {hobby}
                                    <button
                                      type="button"
                                      aria-label={`Remove ${hobby}`}
                                      onClick={e => {
                                        e.preventDefault();
                                        setForm(prev => ({
                                          ...prev,
                                          hobbies: prev.hobbies.filter(h => h !== hobby).filter(h => h && h.trim() !== '')
                                        }));
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
                    </div>
                  </div>
                </div>
                <div className="mentor-form-section skills-section">
                  <div className="mentor-form-section-title">Skills</div>
                  <div className="mentor-skills-list">
                    <label style={{ fontWeight: 600, color: '#ff2a2a', marginBottom: 8, display: 'block' }}>
                      {selectedRole === MENTOR ? 'Select the skills you can offer:' : 'Select the skills you are looking for:'}
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
                                  ((selectedRole === MENTOR ? form.skills : form.lookingFor).includes(skill) ? ' selected' : '')
                                }
                                onClick={() => handleSkillToggle(skill, selectedRole === MENTOR ? 'skills' : 'lookingFor')}
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

                <button type="submit" disabled={loading || (selectedRole === MENTOR ? (form.skills.length === 0) : form.lookingFor.length === 0)}>
                  {loading ? 'Saving...' : 'Sign Up'}
                </button>
              </form>
              {error && <p style={{ color: '#ff2a2a', marginTop: '1rem' }}>{error}</p>}
              <SuccessModal open={!!success} onClose={handleSuccessModalClose} />
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>Matches</h3>
        <button
          onClick={refreshMatches}
          disabled={loadingMatches}
          style={{
            marginBottom: '1rem',
            padding: '0.7rem 1.5rem',
            background: 'linear-gradient(90deg, #ff2a2a 60%, #a80000 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loadingMatches ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 12px rgba(255,42,42,0.15)',
            transition: 'background 0.2s, transform 0.2s',
            opacity: loadingMatches ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <FaSyncAlt style={{ fontSize: 20, marginRight: 4, verticalAlign: 'middle', animation: loadingMatches ? 'spin 1s linear infinite' : undefined }} />
          {loadingMatches ? 'Refreshing...' : 'Refresh Matches'}
        </button>
        {loadingMatches ? (
          <p>Loading matches...</p>
        ) : bestMatches.length === 0 ? (
          <p>No matches yet. Sign up as a mentor or mentee!</p>
        ) : (
          <>
            <div className="matches-grid">
              {paginatedMatches.map((match, idx) => {
                const user = match.user;
                let topClass = '';
                const globalIdx = (currentPage - 1) * MATCHES_PER_PAGE + idx;
                if (globalIdx === 0) topClass = 'top-match-gold';
                else if (globalIdx === 1) topClass = 'top-match-silver';
                else if (globalIdx === 2) topClass = 'top-match-bronze';
                // Animation: fade/slide in, staggered
                const cardAnimClass = 'match-card-animate';
                const animDelay = `${globalIdx * 80}ms`;
                return (
                  <div
                    className={`match-card ${topClass} ${cardAnimClass}`}
                    key={globalIdx}
                    onClick={() => { setModalUser(user); setModalOpen(true); }}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      animationDelay: animDelay,
                    }}
                  >
                  {/* Avatar/Profile Picture */}
                  <div className="match-card-avatar-wrapper">
                    <MatchStrengthRing score={match.score} color={getScoreColor(match.score)} size={60} label="Match Strength" />
                  </div>
                  {(globalIdx < 3) && (
                    <div className="top-match-watermark">Top Match</div>
                  )}
                  <div className="match-card-header">
                    <div className="match-card-title">
                      <span className="match-card-name">{user.name}</span>
                      <span className="match-card-type">({user.type})</span>
                    </div>
                  </div>
                  <div className="match-card-info">
                    <div className="match-card-row">
                      <span className="match-card-label">Email:</span>
                      <span className="match-card-value">{user.email}</span>
                    </div>
                    <div className="match-card-row">
                      <span className="match-card-label">{(user.type == MENTOR) ? "Profession:" : "Desired Profession:"}</span>
                      <span className="match-card-value">{user.profession}</span>
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
                    {match.reasons.map((reason, i) => {
                      const { icon, color } = getReasonBadgeProps(reason);
                      return (
                        <div
                          className="match-card-reason-badge"
                          key={i}
                          tabIndex={0}
                          style={{ background: color + '22', borderColor: color, color }}
                        >
                          <span className="match-card-reason-icon" style={{ color }}>{icon}</span>
                          <span className="match-card-reason-label">{reason}</span>
                          <span className="match-card-tooltip">{getReasonTooltip(reason, match, user, currentUserProfile)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {user.type === MENTOR && currentUserProfile?.type === MENTEE && (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user.calCom && user.calCom.trim()) {
                            setCalComMentor(user);
                            setCalComModalOpen(true);
                          } else {
                            setBookingMentor(user);
                            setBookingModalOpen(true);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #ff2a2a 0%, #a80000 100%)',
                          color: '#fff',
                          padding: '0.7rem 1.4rem',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(255,42,42,0.3)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,42,42,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,42,42,0.3)';
                        }}
                      >
                        📅 Book Session
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#888' : 'linear-gradient(90deg, #ff2a2a 60%, #a80000 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.6 : 1
                }}
              >Previous</button>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? '#888' : 'linear-gradient(90deg, #ff2a2a 60%, #a80000 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.6 : 1
                }}
              >Next</button>
            </div>
          </>
        )}
      </div>
      <MentorModal open={modalOpen} onClose={() => setModalOpen(false)} user={modalUser} />
      <BookingModal 
        open={bookingModalOpen} 
        onClose={() => {
          setBookingModalOpen(false);
          setBookingMentor(null);
        }} 
        mentor={bookingMentor!} 
      />
      <CalComModal
        open={calComModalOpen}
        onClose={() => {
          setCalComModalOpen(false);
          setCalComMentor(null);
        }}
        mentor={calComMentor!}
      />
    </section>
  );
} 