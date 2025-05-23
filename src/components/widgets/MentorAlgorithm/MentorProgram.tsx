import React, { useState } from 'react';
import './MentorProgram.css';
import { db } from '../../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';

type UserType = 'mentor' | 'mentee';

const skillsByCategory: { [category: string]: string[] } = {
  'Academic': [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Statistics', 'Calculus', 'Algebra', 'Geometry', 'Data Science',
  ],
  'Technology & Programming': [
    'Web Development', 'Mobile Development', 'Python', 'JavaScript',
    'Java', 'C++', 'React', 'Node.js', 'Database Design', 'Cloud Computing',
    'Machine Learning', 'Artificial Intelligence', 'Cybersecurity',
    'DevOps', 'UI/UX Design', 'Software Architecture',
  ],
  'Business & Professional': [
    'Project Management', 'Business Strategy', 'Marketing', 'Digital Marketing',
    'Social Media Marketing', 'Public Relations', 'Sales', 'Entrepreneurship',
    'Finance', 'Accounting', 'Investment', 'Business Analysis',
    'Human Resources', 'Leadership', 'Team Management', 'Public Speaking',
    'Negotiation', 'Business Writing', 'Consulting',
  ],
  'Creative Arts': [
    'Graphic Design', 'Web Design', '3D Modeling', 'Animation',
    'Video Editing', 'Photography', 'Drawing', 'Painting',
    'Music Production', 'Music Theory', 'Songwriting', 'Creative Writing',
    'Content Creation', 'Film Making',
  ],
  'Languages': [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian',
  ],
  'Soft Skills': [
    'Communication', 'Time Management', 'Problem Solving', 'Critical Thinking',
    'Emotional Intelligence', 'Conflict Resolution', 'Teamwork',
    'Adaptability', 'Work Ethics', 'Stress Management',
  ],
  'Specialized Fields': [
    'Data Analytics', 'Digital Marketing', 'Product Management',
    'Supply Chain Management', 'Quality Assurance', 'Research Methods',
    'Technical Writing', 'SEO', 'Blockchain', 'IoT',
    'Renewable Energy', 'Environmental Science', 'Healthcare Management',
  ],
};

const ukEducationLevels = [
  'GCSEs',
  'A-Levels',
  'BTEC',
  'Foundation Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate/PhD',
  'NVQ/SVQ',
  'Apprenticeship',
  'Other',
];

interface User {
  name: string;
  email: string;
  phone: string;
  age: string;
  degree: string;
  educationLevel: string;
  country: string;
  currentProfession: string;
  pastProfessions: string[];
  linkedin: string;
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  type: UserType;
}

const ethnicityOptions = [
  // UK ONS categories and common global options
  'Prefer not to say',
  'White - British',
  'White - Irish',
  'White - Other',
  'Mixed - White and Black Caribbean',
  'Mixed - White and Black African',
  'Mixed - White and Asian',
  'Mixed - Other',
  'Asian or Asian British - Indian',
  'Asian or Asian British - Pakistani',
  'Asian or Asian British - Bangladeshi',
  'Asian or Asian British - Chinese',
  'Asian or Asian British - Other',
  'Black or Black British - African',
  'Black or Black British - Caribbean',
  'Black or Black British - Other',
  'Arab',
  'Gypsy or Irish Traveller',
  'Roma',
  'Other Ethnic Group',
  'Hispanic or Latino',
  'Native American or Alaska Native',
  'Native Hawaiian or Other Pacific Islander',
  'Jewish',
  'South East Asian',
  'East Asian',
  'Central Asian',
  'North African',
  'Sub-Saharan African',
  'Other (please specify)',
];

const religionOptions = [
  'Prefer not to say',
  'Christianity',
  'Islam',
  'Hinduism',
  'Buddhism',
  'Sikhism',
  'Judaism',
  'Jainism',
  'Shinto',
  'Taoism',
  'Confucianism',
  'Baháʼí',
  'Zoroastrianism',
  'Traditional African Religions',
  'Indigenous Religions',
  'Agnostic',
  'Atheist',
  'Spiritual but not religious',
  'Other (please specify)',
];

export default function MentorProgram() {
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentees, setMentees] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    degree: '',
    educationLevel: '',
    country: '',
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
  const [matches, setMatches] = useState<{ mentee: User; mentor: User }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);

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
    const user: User = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      age: form.age,
      degree: form.degree,
      educationLevel: form.educationLevel,
      country: form.country,
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
      await addDoc(collection(db, 'mentorProgram'), user);
      setSuccess('Successfully registered!');
      if (selectedRole === 'mentor') {
        setMentors(prev => [...prev, user]);
      } else {
        setMentees(prev => [...prev, user]);
      }
      setForm({
        name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', country: '',
        currentProfession: '', pastProfessions: [''], linkedin: '', hobbies: [''], ethnicity: '', religion: '',
        skills: [], lookingFor: [], type: ''
      });
      setTimeout(matchMentees, 0); // Update matches after state change
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setForm({
      name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', country: '',
      currentProfession: '', pastProfessions: [''], linkedin: '', hobbies: [''], ethnicity: '', religion: '',
      skills: [], lookingFor: [], type: role
    });
    setError(null);
    setSuccess(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setForm({
      name: '', email: '', phone: '', age: '', degree: '', educationLevel: '', country: '',
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
      {!selectedRole ? (
        <div className="mentor-role-cards">
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
      ) : (
        <>
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
                  <input name="country" value={form.country} onChange={handleChange} placeholder="Country" required />
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
                    pattern="https?://(www\\.)?linkedin\\.com/.*"
                    title="Please enter a valid LinkedIn profile URL."
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
          {success && <p style={{ color: '#2aff2a', marginTop: '1rem' }}>{success}</p>}
        </>
      )}
      <div style={{ marginTop: '2rem' }}>
        <h3>Matches</h3>
        {matches.length === 0 ? (
          <p>No matches yet. Sign up as a mentor or mentee!</p>
        ) : (
          <ul>
            {matches.map((match, idx) => (
              <li key={idx}>
                <strong>{match.mentee.name}</strong> (mentee) matched with <strong>{match.mentor.name}</strong> (mentor)
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
} 