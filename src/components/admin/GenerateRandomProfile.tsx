import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FaRandom, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { MentorMenteeProfile } from '../widgets/MentorAlgorithm/matchUsers';
import ukCounties from '../../constants/ukCounties';
import industriesList from '../../constants/industries';
import '../../styles/adminStyles/MentorManagement.css';

// Sample data for randomization
const firstNames = [
  // English/American
  'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella',
  'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Theodore', 'Eleanor',
  
  // Chinese
  'Wei', 'Ming', 'Li', 'Hui', 'Xiao', 'Jing', 'Zhang', 'Chen', 'Yong', 'Ling',
  'Feng', 'Jun', 'Hong', 'Mei', 'Yang', 'Ying', 'Cheng', 'Zhen',
  
  // Indian
  'Aarav', 'Diya', 'Arjun', 'Zara', 'Vihaan', 'Aanya', 'Reyansh', 'Anaya', 'Vivaan',
  'Anika', 'Krishna', 'Riya', 'Ishaan', 'Myra', 'Advik', 'Shanaya',
  
  // Arabic
  'Mohammed', 'Fatima', 'Ahmed', 'Aisha', 'Omar', 'Layla', 'Ali', 'Noor', 'Hassan',
  'Zainab', 'Ibrahim', 'Mariam', 'Yusuf', 'Sara', 'Khalil', 'Amira',
  
  // Japanese
  'Hiroto', 'Yui', 'Haruto', 'Aoi', 'Yuto', 'Hina', 'Sota', 'Yuna', 'Yuki',
  'Akari', 'Kento', 'Sakura', 'Riku', 'Mio', 'Takumi', 'Nanami',
  
  // African
  'Kwame', 'Amara', 'Oluwaseun', 'Chioma', 'Tendai', 'Aisha', 'Kofi', 'Abena',
  'Babajide', 'Folami', 'Olayinka', 'Zalika', 'Chidi', 'Makena', 'Kwesi', 'Zuri',
  
  // Hispanic/Latino
  'Santiago', 'Sofia', 'Mateo', 'Valentina', 'Sebastian', 'Isabella', 'Diego',
  'Camila', 'Gabriel', 'Victoria', 'Alejandro', 'Lucia', 'Daniel', 'Elena',
  
  // Russian
  'Dmitri', 'Anastasia', 'Ivan', 'Natasha', 'Vladimir', 'Ekaterina', 'Mikhail',
  'Olga', 'Boris', 'Tatiana', 'Nikolai', 'Svetlana', 'Andrei', 'Marina',
  
  // Korean
  'Min-jun', 'Seo-yeon', 'Ji-hun', 'Ji-woo', 'Hyun-woo', 'Soo-jin', 'Joon-ho',
  'Min-seo', 'Tae-hyung', 'Hae-won', 'Seung-min', 'Yoo-jin', 'Do-yoon', 'Eun-ji',
  
  // Greek
  'Andreas', 'Helena', 'Stavros', 'Sofia', 'Dimitris', 'Maria', 'Georgios',
  'Eleni', 'Nikolaos', 'Christina', 'Alexandros', 'Katerina', 'Petros', 'Athena'
];
const lastNames = [
  // English/American/Australian
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Wilson', 'Taylor', 'Davies', 'Evans', 'Thomas',
  'Roberts', 'Walker', 'Wright', 'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Lewis', 'Wood',
  
  // Chinese
  'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
  'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'Lin', 'He', 'Gao', 'Luo',
  
  // Indian
  'Patel', 'Kumar', 'Singh', 'Shah', 'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Mehra',
  'Chopra', 'Agarwal', 'Reddy', 'Nair', 'Menon', 'Pillai', 'Rao', 'Mukherjee', 'Banerjee', 'Das',
  
  // Arabic/Middle Eastern
  'Al-Sayed', 'Abdullah', 'Mohammed', 'Ahmed', 'Hassan', 'Ali', 'Ibrahim', 'Mahmoud', 'Rahman', 'Malik',
  'Saleh', 'Khalil', 'Nasser', 'Aziz', 'Qureshi', 'Hussain', 'Khan', 'Mirza', 'Sheikh', 'Raza',
  
  // Japanese
  'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
  'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori',
  
  // Korean
  'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
  'Han', 'Yang', 'Shin', 'Chang', 'Song', 'Hong', 'Yoo', 'Chung', 'Kwon', 'Ryu',
  
  // Hispanic/Latino
  'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
  'Flores', 'Rivera', 'Morales', 'Ortiz', 'Cruz', 'Reyes', 'Moreno', 'Diaz', 'Castro', 'Ruiz',
  
  // Russian/Eastern European
  'Ivanov', 'Petrov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov', 'Novikov', 'Morozov',
  'Volkov', 'Kowalski', 'Nowicki', 'Wojcik', 'Kowalczyk', 'Kaminski', 'Lewandowski', 'Zielinski', 'Szymanski', 'Wozniak',
  
  // African
  'Okafor', 'Adebayo', 'Okonkwo', 'Mensah', 'Mwangi', 'Afolabi', 'Okoro', 'Diallo', 'Ndlovu', 'Mutua',
  'Osei', 'Adeyemi', 'Kamau', 'Banda', 'Nyathi', 'Moyo', 'Dube', 'Kone', 'Toure', 'Keita',
  
  // Greek
  'Papadopoulos', 'Pappas', 'Kouris', 'Demetriou', 'Georgiou', 'Angelopoulos', 'Constantinides', 'Stavros', 'Kyriakides', 'Antoniou',
  
  // Vietnamese
  'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do',
  
  // Thai
  'Srisai', 'Saetang', 'Sae-Tang', 'Saechao', 'Ruangkanchanasetr', 'Wongsawat', 'Sitthichai', 'Chaisurivirat', 'Rojjanasukchai'
];
const professions = [
  // Technology
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
  'Cloud Architect', 'Mobile App Developer', 'Systems Administrator', 'Database Administrator',
  'Information Security Analyst', 'Network Engineer', 'AI/ML Engineer', 'QA Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Game Developer',
  'Blockchain Developer', 'AR/VR Developer', 'IoT Engineer',

  // Business & Finance
  'Business Analyst', 'Project Manager', 'Financial Analyst', 'Investment Banker',
  'Management Consultant', 'Risk Analyst', 'Portfolio Manager', 'Accountant', 'Actuary',
  'Business Development Manager', 'Strategy Consultant', 'Operations Manager',
  'Supply Chain Manager', 'Chief Financial Officer', 'Venture Capitalist',

  // Marketing & Creative
  'Marketing Manager', 'Digital Marketing Specialist', 'Content Strategist',
  'Brand Manager', 'Social Media Manager', 'SEO Specialist', 'Copywriter',
  'Content Writer', 'Graphic Designer', 'UI Designer', 'Art Director',
  'Creative Director', 'Video Producer', 'Motion Designer', 'Animator',

  // Healthcare
  'Doctor', 'Nurse', 'Pharmacist', 'Dentist', 'Physiotherapist',
  'Occupational Therapist', 'Clinical Psychologist', 'Veterinarian',
  'Medical Researcher', 'Healthcare Administrator', 'Nutritionist',
  'Radiologist', 'Surgeon', 'Pediatrician', 'Mental Health Counselor',

  // Education
  'Teacher', 'Professor', 'Educational Consultant', 'School Principal',
  'Special Education Teacher', 'Corporate Trainer', 'Instructional Designer',
  'Education Technology Specialist', 'Academic Advisor', 'Research Scientist',

  // Legal & Professional
  'Lawyer', 'Legal Consultant', 'Paralegal', 'Corporate Counsel',
  'Patent Attorney', 'HR Manager', 'Recruitment Specialist',
  'Compliance Officer', 'Policy Analyst', 'Public Relations Manager',

  // Engineering & Science
  'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer',
  'Chemical Engineer', 'Aerospace Engineer', 'Environmental Scientist',
  'Biomedical Engineer', 'Materials Scientist', 'Nuclear Engineer',
  'Quantum Physicist', 'Marine Biologist', 'Geologist',

  // Arts & Entertainment
  'Actor', 'Musician', 'Film Director', 'Fashion Designer',
  'Interior Designer', 'Photographer', 'Game Designer',
  'Music Producer', 'Dance Choreographer', 'Theater Director',

  // Trades & Services
  'Electrician', 'Plumber', 'Carpenter', 'Chef', 'Real Estate Agent',
  'Personal Trainer', 'Wedding Planner', 'Travel Consultant',
  'Landscape Architect', 'Auto Mechanic', 'Construction Manager'
];
const hobbies = [
  // Creative & Artistic
  'Reading', 'Writing', 'Poetry', 'Painting', 'Drawing', 'Sketching', 'Digital Art',
  'Photography', 'Filmmaking', 'Music Production', 'Playing Guitar', 'Playing Piano',
  'Singing', 'Dancing', 'Ballet', 'Theater', 'Pottery', 'Sculpture', 'Knitting',
  'Crocheting', 'Sewing', 'Fashion Design', 'Jewelry Making', 'Woodworking',

  // Outdoor & Adventure
  'Hiking', 'Rock Climbing', 'Mountaineering', 'Camping', 'Backpacking',
  'Bird Watching', 'Nature Photography', 'Gardening', 'Landscaping',
  'Foraging', 'Bushcraft', 'Survival Skills', 'Geocaching',

  // Sports & Fitness
  'Running', 'Swimming', 'Cycling', 'Weight Training', 'CrossFit', 'Yoga',
  'Pilates', 'Martial Arts', 'Boxing', 'Football', 'Basketball', 'Tennis',
  'Golf', 'Skateboarding', 'Surfing', 'Snowboarding', 'Skiing', 'Rock Climbing',
  'Horse Riding', 'Archery',

  // Games & Entertainment
  'Video Gaming', 'Board Games', 'Chess', 'Poker', 'Magic: The Gathering',
  'Dungeons & Dragons', 'Warhammer', 'Cosplay', 'Anime', 'Comic Books',
  'Movie Collecting', 'TV Series', 'Virtual Reality Gaming',

  // Food & Drink
  'Cooking', 'Baking', 'Wine Tasting', 'Beer Brewing', 'Coffee Roasting',
  'Mixology', 'Food Photography', 'Restaurant Exploring', 'Cheese Making',
  'Fermentation', 'Vegetarian Cooking', 'International Cuisine',

  // Technology & Digital
  'Programming', 'Web Development', '3D Printing', 'Drone Flying',
  'Robotics', 'Electronics', 'App Development', 'Digital Design',
  'Blogging', 'Podcasting', 'YouTube Content Creation',

  // Learning & Knowledge
  'Language Learning', 'History Research', 'Philosophy', 'Science',
  'Astronomy', 'Bird Watching', 'Genealogy', 'Psychology',
  'Political Science', 'Economics', 'Mathematics',

  // Collection & Curation
  'Stamp Collecting', 'Coin Collecting', 'Antique Collecting',
  'Record Collecting', 'Book Collecting', 'Art Collecting',
  'Watch Collecting', 'Car Collecting', 'Model Building',

  // Social & Community
  'Volunteering', 'Mentoring', 'Teaching', 'Public Speaking',
  'Event Planning', 'Community Organizing', 'Charity Work',
  'Environmental Activism', 'Social Justice',

  // Travel & Culture
  'Traveling', 'Cultural Exchange', 'Language Exchange',
  'Food Tourism', 'Photography Tourism', 'Historical Tourism',
  'Backpacking', 'Van Life', 'Digital Nomading',

  // Wellness & Spirituality
  'Meditation', 'Mindfulness', 'Yoga', 'Tai Chi', 'Qigong',
  'Reiki', 'Aromatherapy', 'Crystal Healing', 'Sound Healing',
  'Traditional Medicine', 'Herbalism', 'Astrology'
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
  'Prefer not to say',
  // White backgrounds
  'White - British', 'White - English', 'White - Welsh', 'White - Scottish', 'White - Northern Irish',
  'White - Irish', 'White - Gypsy or Irish Traveller', 'White - Roma',
  'White - Eastern European', 'White - Western European', 'White - Southern European', 'White - Northern European',
  'White - American', 'White - Canadian', 'White - Australian', 'White - New Zealander', 'White - South African',
  'White - Other',

  // Mixed/Multiple ethnic backgrounds
  'Mixed - White and Black Caribbean', 'Mixed - White and Black African', 'Mixed - White and Asian',
  'Mixed - White and Indian', 'Mixed - White and Pakistani', 'Mixed - White and Bangladeshi',
  'Mixed - White and Chinese', 'Mixed - White and Arab', 'Mixed - Black and Asian',
  'Mixed - Asian and Chinese', 'Mixed - Other',

  // Asian backgrounds
  'Asian or Asian British - Indian', 'Asian or Asian British - Pakistani', 'Asian or Asian British - Bangladeshi',
  'Asian or Asian British - Chinese', 'Asian or Asian British - Filipino', 'Asian or Asian British - Vietnamese',
  'Asian or Asian British - Thai', 'Asian or Asian British - Malaysian', 'Asian or Asian British - Indonesian',
  'Asian or Asian British - Japanese', 'Asian or Asian British - Korean', 'Asian or Asian British - Nepali',
  'Asian or Asian British - Sri Lankan', 'Asian or Asian British - Burmese', 'Asian or Asian British - Mongolian',
  'Asian or Asian British - Other',

  // Black backgrounds
  'Black or Black British - African', 'Black or Black British - Nigerian', 'Black or Black British - Ghanaian',
  'Black or Black British - Somali', 'Black or Black British - Sudanese', 'Black or Black British - Caribbean',
  'Black or Black British - Jamaican', 'Black or Black British - Barbadian', 'Black or Black British - Trinidadian',
  'Black or Black British - Ethiopian', 'Black or Black British - Eritrean', 'Black or Black British - Congolese',
  'Black or Black British - Angolan', 'Black or Black British - Other',

  // Middle Eastern and North African backgrounds
  'Arab - Middle Eastern', 'Arab - North African', 'Arab - Gulf States',
  'Kurdish', 'Turkish', 'Iranian', 'Iraqi', 'Lebanese', 'Syrian', 'Yemeni', 'Egyptian',
  'Moroccan', 'Algerian', 'Tunisian', 'Libyan',

  // Latin American backgrounds
  'Latin American - Mexican', 'Latin American - Brazilian', 'Latin American - Colombian',
  'Latin American - Argentine', 'Latin American - Chilean', 'Latin American - Peruvian',
  'Latin American - Other',

  // Indigenous peoples
  'Indigenous Australian', 'Torres Strait Islander', 'Maori', 'Native American/First Nations',
  'Inuit', 'Sami', 'Indigenous African', 'Indigenous Asian', 'Indigenous South American',

  // Other categories
  'Jewish', 'Romani', 'Traveller', 'Other Ethnic Group'
];

const religionOptions = [
  'Prefer not to say',
  // Abrahamic Religions
  'Christianity - Catholic', 'Christianity - Protestant', 'Christianity - Orthodox', 'Christianity - Coptic',
  'Christianity - Anglican', 'Christianity - Methodist', 'Christianity - Baptist', 'Christianity - Lutheran',
  'Christianity - Presbyterian', 'Christianity - Pentecostal', 'Christianity - Evangelical', 'Christianity - Other',
  'Islam - Sunni', 'Islam - Shia', 'Islam - Sufi', 'Islam - Ahmadiyya', 'Islam - Other',
  'Judaism - Orthodox', 'Judaism - Conservative', 'Judaism - Reform', 'Judaism - Reconstructionist',
  'Judaism - Hasidic', 'Judaism - Other',
  'Baháʼí Faith', 'Druze', 'Samaritanism', 'Mandaeism',

  // Indian Religions
  'Hinduism - Vaishnavism', 'Hinduism - Shaivism', 'Hinduism - Shaktism', 'Hinduism - Smartism',
  'Hinduism - ISKCON', 'Hinduism - Other',
  'Buddhism - Theravada', 'Buddhism - Mahayana', 'Buddhism - Vajrayana', 'Buddhism - Zen',
  'Buddhism - Pure Land', 'Buddhism - Other',
  'Sikhism', 'Jainism - Svetambara', 'Jainism - Digambara',

  // East Asian Religions
  'Taoism', 'Confucianism', 'Shinto', 'Chinese Folk Religion',
  'Korean Shamanism', 'Caodaism', 'Chondogyo', 'Tenrikyo',
  'Seicho-no-Ie', 'Falun Gong',

  // Iranian/Persian Religions
  'Zoroastrianism', 'Yazdânism', 'Manichaeism', 'Mandaeism',

  // African Traditional Religions
  'Yoruba Religion', 'Vodun', 'Santería', 'Candomblé',
  'Umbanda', 'Odinani', 'Serer Religion', 'Zulu Traditional',
  'Akan Religion', 'Dogon Religion',

  // Indigenous Religions
  'Native American Religions', 'First Nations Spirituality',
  'Australian Aboriginal Religion', 'Māori Religion',
  'Sami Shamanism', 'Siberian Shamanism',
  'Aztec Religion', 'Inca Religion', 'Maya Religion',

  // Modern Religious Movements
  'Scientology', 'Raëlism', 'Wicca', 'Neo-Paganism',
  'New Age', 'Theosophy', 'Anthroposophy', 'Rastafari',
  'Unitarian Universalism', 'Unity Church',

  // Ancient Religions Still Practiced
  'Hellenism', 'Roman Polytheism', 'Kemetism',
  'Germanic Heathenry', 'Celtic Polytheism', 'Baltic Polytheism',
  'Slavic Native Faith',

  // Non-Religious Categories
  'Atheist', 'Agnostic', 'Humanist', 'Secular',
  'Spiritual but not religious', 'Religious but not affiliated',
  'Questioning/Seeking', 'Prefer not to practice',

  // Other Categories
  'Multiple Religious Beliefs', 'Syncretic Beliefs',
  'Personal Religion/Philosophy', 'Other'
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
    const industries = getRandomElements(industriesList, Math.floor(Math.random() * 3) + 1);

    // Filter education levels based on type
    const availableEducationLevels = type === 'mentee' 
      ? ukEducationLevels.filter(level => [
          'GCSEs', 'A-Levels', 'BTEC', 'Foundation Degree', "Bachelor's Degree"
        ].includes(level))
      : ukEducationLevels;

    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      age: age.toString(),
      degree: `${getRandomElement(['BSc', 'BA', 'MSc', 'MA'])} ${getRandomElement(['Computer Science', 'Business', 'Engineering', 'Arts', 'Science'])}`,
      educationLevel: getRandomElement(availableEducationLevels),
      county: getRandomElement(ukCounties),
      currentProfession: getRandomElement(professions),
      pastProfessions: getRandomElements(professions, Math.floor(Math.random() * 3) + 1),
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      hobbies: getRandomElements(hobbies, Math.floor(Math.random() * 4) + 2),
      ethnicity: getRandomElement(ethnicityOptions),
      religion: getRandomElement(religionOptions),
      skills: type === 'mentor' ? skills : [],
      lookingFor: type === 'mentee' ? lookingFor : [],
      industries: industries,
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