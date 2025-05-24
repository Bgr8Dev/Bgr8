import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FaRandom, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { MentorMenteeProfile } from '../widgets/MentorAlgorithm/matchUsers';
import '../../styles/adminStyles/MentorManagement.css';

// Sample data for randomization
const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];
const countries = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico', 'South Africa', 'Singapore'];
const professions = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Marketing Manager',
  'Business Analyst', 'Project Manager', 'Financial Analyst', 'HR Manager', 'Sales Representative',
  'Content Writer', 'Graphic Designer', 'Research Scientist', 'Teacher', 'Consultant'
];
const hobbies = [
  'Reading', 'Traveling', 'Photography', 'Cooking', 'Gaming', 'Hiking', 'Painting', 'Music',
  'Sports', 'Dancing', 'Writing', 'Yoga', 'Gardening', 'Chess', 'Swimming'
];

const skillsByCategory = {
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
  'GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree",
  "Master's Degree", 'Doctorate/PhD', 'NVQ/SVQ', 'Apprenticeship', 'Other'
];

const ethnicityOptions = [
  'Prefer not to say', 'White - British', 'White - Irish', 'White - Other',
  'Mixed - White and Black Caribbean', 'Mixed - White and Black African',
  'Mixed - White and Asian', 'Mixed - Other', 'Asian or Asian British - Indian',
  'Asian or Asian British - Pakistani', 'Asian or Asian British - Bangladeshi',
  'Asian or Asian British - Chinese', 'Asian or Asian British - Other',
  'Black or Black British - African', 'Black or Black British - Caribbean',
  'Black or Black British - Other', 'Arab', 'Gypsy or Irish Traveller',
  'Roma', 'Other Ethnic Group'
];

const religionOptions = [
  'Prefer not to say', 'Christianity', 'Islam', 'Hinduism', 'Buddhism',
  'Sikhism', 'Judaism', 'Jainism', 'Shinto', 'Taoism', 'Confucianism',
  'Baháʼí', 'Zoroastrianism', 'Traditional African Religions',
  'Indigenous Religions', 'Agnostic', 'Atheist',
  'Spiritual but not religious', 'Other'
];

export default function GenerateRandomProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [type, setType] = useState<'mentor' | 'mentee'>('mentor');

  const getRandomElement = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomElements = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getRandomSkills = (): string[] => {
    const allSkills = Object.values(skillsByCategory).flat();
    return getRandomElements(allSkills, Math.floor(Math.random() * 5) + 3);
  };

  const generateRandomProfile = (): MentorMenteeProfile => {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const age = Math.floor(Math.random() * 43) + 18; // 18-60 years old
    const skills = getRandomSkills();
    const lookingFor = getRandomSkills();

    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      age: age.toString(),
      degree: `${getRandomElement(['BSc', 'BA', 'MSc', 'MA'])} ${getRandomElement(['Computer Science', 'Business', 'Engineering', 'Arts', 'Science'])}`,
      educationLevel: getRandomElement(ukEducationLevels),
      country: getRandomElement(countries),
      currentProfession: getRandomElement(professions),
      pastProfessions: getRandomElements(professions, Math.floor(Math.random() * 3) + 1),
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      hobbies: getRandomElements(hobbies, Math.floor(Math.random() * 4) + 2),
      ethnicity: getRandomElement(ethnicityOptions),
      religion: getRandomElement(religionOptions),
      skills: type === 'mentor' ? skills : [],
      lookingFor: type === 'mentee' ? lookingFor : [],
      type
    };
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profiles = Array.from({ length: count }, () => generateRandomProfile());
      
      for (const profile of profiles) {
        await addDoc(collection(db, 'mentorProgram'), profile);
      }

      setSuccess(`Successfully generated ${count} ${type}${count > 1 ? 's' : ''}!`);
    } catch (err) {
      console.error('Error generating profiles:', err);
      setError('Failed to generate profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mentor-management">
      <div className="mentor-management-header">
        <h2>Generate Random Profiles</h2>
        <div className="mentor-management-controls">
          <div className="mentor-management-filters">
            <button
              className={type === 'mentor' ? 'active' : ''}
              onClick={() => setType('mentor')}
            >
              <FaChalkboardTeacher /> Mentors
            </button>
            <button
              className={type === 'mentee' ? 'active' : ''}
              onClick={() => setType('mentee')}
            >
              <FaUserGraduate /> Mentees
            </button>
          </div>
        </div>
      </div>

      <div className="mentor-management-stats">
        <div className="stat-card">
          <h3>Generate</h3>
          <div className="generate-controls">
            <input
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="count-input"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="generate-button"
            >
              <FaRandom /> Generate {count} {type}{count > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mentor-management-error">{error}</div>}
      {success && <div className="mentor-management-success">{success}</div>}
    </div>
  );
} 