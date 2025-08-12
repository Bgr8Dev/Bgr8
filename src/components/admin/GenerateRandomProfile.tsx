import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, setDoc, doc } from 'firebase/firestore';
import { FaRandom, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { MentorMenteeProfile } from '../widgets/MentorAlgorithm/algorithm/matchUsers';
import ukCounties from '../../constants/ukCounties';
import industriesList from '../../constants/industries';
import '../../styles/adminStyles/MentorManagement.css';

// Import interfaces for availability
interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  type: 'recurring' | 'specific';
}

interface MentorAvailability {
  mentorId: string;
  timeSlots: TimeSlot[];
  lastUpdated: Date | string;
}

interface Booking {
  id?: string;
  mentorName: string;
  mentorEmail: string;
  menteeName: string;
  menteeEmail: string;
  sessionDate?: Date | string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  meetLink?: string;
  eventId?: string;
  isCalComBooking?: boolean;
  calComBookingId?: string;
  mentorId?: string;
  menteeId?: string;
  duration?: number;
  revenue?: number;
  createdAt?: Date;
}

interface AvailableMentor {
  id: string;
  uid: string;
  name: string;
  email: string;
}

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

// Mentor and Mentee Archetype definitions
const mentorArchetypes = [
  {
    key: 'random',
    label: 'Random Mentor',
  },
  {
    key: 'tech_mentor',
    label: 'Tech Mentor',
    type: 'mentor',
    professions: [
      'Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Cloud Architect', 'AI/ML Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'QA Engineer', 'Mobile App Developer',
    ],
    skills: [
      'Programming', 'Cloud Computing', 'Machine Learning', 'Web Development', 'Python', 'JavaScript', 'DevOps', 'Database Design', 'Cybersecurity', 'AI/ML Engineer',
    ],
    educationLevels: ["Bachelor's Degree", "Master's Degree", 'Doctorate/PhD'],
    degrees: ['BSc Computer Science', 'MSc Computer Science', 'BSc Engineering', 'MSc Engineering'],
    hobbies: ['Programming', 'Gaming', 'Reading', 'Web Development', '3D Printing', 'Electronics'],
    industries: ['Technology', 'Software', 'Engineering'],
    ageRange: [28, 55],
  },
  {
    key: 'business_mentor',
    label: 'Business Mentor',
    type: 'mentor',
    professions: ['Business Analyst', 'Project Manager', 'Accountant', 'Financial Analyst', 'Management Consultant', 'Venture Capitalist'],
    skills: ['Project Management', 'Business Strategy', 'Finance', 'Leadership', 'Team Management', 'Negotiation'],
    educationLevels: ["Bachelor's Degree", "Master's Degree"],
    degrees: ['BSc Business', 'MBA', 'BSc Finance'],
    hobbies: ['Networking', 'Reading', 'Traveling', 'Public Speaking'],
    industries: ['Business', 'Finance', 'Consulting'],
    ageRange: [30, 60],
  },
  {
    key: 'healthcare_mentor',
    label: 'Healthcare Mentor',
    type: 'mentor',
    professions: ['Doctor', 'Nurse', 'Pharmacist', 'Dentist', 'Clinical Psychologist'],
    skills: ['Healthcare Management', 'Communication', 'Leadership', 'Research Methods'],
    educationLevels: ["Master's Degree", 'Doctorate/PhD'],
    degrees: ['MBBS', 'BSc Nursing', 'MSc Healthcare'],
    hobbies: ['Volunteering', 'Reading', 'Sports', 'Cooking'],
    industries: ['Healthcare', 'Medicine'],
    ageRange: [32, 65],
  },
  {
    key: 'creative_mentor',
    label: 'Creative Mentor',
    type: 'mentor',
    professions: ['Art Director', 'Creative Director', 'Graphic Designer', 'Animator', 'Music Producer'],
    skills: ['Graphic Design', 'Video Editing', 'Music Production', 'Content Creation', 'Drawing', 'Painting'],
    educationLevels: ["Bachelor's Degree", "Master's Degree"],
    degrees: ['BA Arts', 'BA Design', 'MA Animation'],
    hobbies: ['Drawing', 'Music', 'Photography', 'Digital Art', 'Film Making'],
    industries: ['Creative', 'Media', 'Design'],
    ageRange: [28, 55],
  },
  {
    key: 'entrepreneur_mentor',
    label: 'Entrepreneur Mentor',
    type: 'mentor',
    professions: ['Entrepreneur', 'Business Owner', 'Startup Founder', 'Venture Capitalist'],
    skills: ['Entrepreneurship', 'Business Strategy', 'Leadership', 'Finance', 'Public Speaking'],
    educationLevels: ["Bachelor's Degree", "Master's Degree"],
    degrees: ['BSc Business', 'MBA'],
    hobbies: ['Networking', 'Traveling', 'Reading', 'Mentoring'],
    industries: ['Business', 'Startups', 'Finance'],
    ageRange: [30, 65],
  },
];

const menteeArchetypes = [
  {
    key: 'random',
    label: 'Random Mentee',
  },
  {
    key: 'creative_mentee',
    label: 'Creative Mentee',
    type: 'mentee',
    professions: ['Student', 'Content Creator', 'Graphic Designer', 'UI Designer', 'Animator'],
    skills: ['Graphic Design', 'Video Editing', 'Social Media', 'Content Creation', 'Drawing', 'Painting'],
    educationLevels: ['A-Levels', "Bachelor's Degree", 'BTEC'],
    degrees: ['BA Arts', 'BA Design', 'BA Animation'],
    hobbies: ['Drawing', 'Music', 'Social Media', 'Photography', 'Digital Art'],
    industries: ['Creative', 'Media', 'Design'],
    ageRange: [16, 25],
  },
  {
    key: 'stem_student',
    label: 'STEM Student',
    type: 'mentee',
    professions: ['Student'],
    skills: ['Mathematics', 'Physics', 'Programming', 'Data Science', 'Chemistry'],
    educationLevels: ['A-Levels', 'BTEC', "Bachelor's Degree"],
    degrees: ['BSc Physics', 'BSc Mathematics', 'BSc Computer Science'],
    hobbies: ['Science', 'Gaming', 'Reading', 'Programming'],
    industries: ['Science', 'Technology'],
    ageRange: [15, 25],
  },
  {
    key: 'business_mentee',
    label: 'Business Mentee',
    type: 'mentee',
    professions: ['Student', 'Intern', 'Junior Analyst', 'Junior Accountant'],
    skills: ['Business Analysis', 'Finance', 'Excel', 'Teamwork', 'Communication'],
    educationLevels: ['A-Levels', "Bachelor's Degree", 'BTEC'],
    degrees: ['BSc Business', 'BSc Finance'],
    hobbies: ['Networking', 'Reading', 'Traveling', 'Public Speaking'],
    industries: ['Business', 'Finance', 'Consulting'],
    ageRange: [17, 27],
  },
  {
    key: 'healthcare_mentee',
    label: 'Healthcare Mentee',
    type: 'mentee',
    professions: ['Student', 'Nursing Student', 'Medical Student', 'Pharmacy Student'],
    skills: ['Biology', 'Chemistry', 'Communication', 'Teamwork'],
    educationLevels: ['A-Levels', 'BTEC', "Bachelor's Degree"],
    degrees: ['BSc Biology', 'BSc Nursing', 'BSc Medicine'],
    hobbies: ['Volunteering', 'Reading', 'Sports', 'Cooking'],
    industries: ['Healthcare', 'Medicine'],
    ageRange: [17, 27],
  },
  {
    key: 'aspiring_entrepreneur',
    label: 'Aspiring Entrepreneur',
    type: 'mentee',
    professions: ['Student', 'Intern', 'Startup Enthusiast'],
    skills: ['Entrepreneurship', 'Business Strategy', 'Networking', 'Public Speaking'],
    educationLevels: ['A-Levels', "Bachelor's Degree", 'BTEC'],
    degrees: ['BSc Business', 'BSc Marketing'],
    hobbies: ['Networking', 'Traveling', 'Reading', 'Mentoring'],
    industries: ['Business', 'Startups', 'Marketing'],
    ageRange: [17, 27],
  },
];

export default function GenerateRandomProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [type, setType] = useState<'mentor' | 'mentee'>('mentor');
  const [useArchetype, setUseArchetype] = useState(false);
  const [archetype, setArchetype] = useState('random');
  const [generateSampleData, setGenerateSampleData] = useState(false);
  const [generateMentees, setGenerateMentees] = useState(false);
  const [overwriteAvailability, setOverwriteAvailability] = useState(false);
  const [mentorSearch, setMentorSearch] = useState('');
  const [availableMentors, setAvailableMentors] = useState<AvailableMentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [showMentorSelector, setShowMentorSelector] = useState(false);

  const getRandomElement = <T,>(array: T[]): T => {
    if (!array || array.length === 0) {
      throw new Error('Cannot get random element from empty array');
    }
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomElements = <T,>(array: T[], count: number): T[] => {
    if (!array || array.length === 0 || count <= 0) {
      return [];
    }
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getRandomSkills = (): string[] => {
    const allSkills = Object.values(skillsByCategory).flat();
    return getRandomElements(allSkills, Math.floor(Math.random() * 5) + 3);
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const generateRandomAvailability = (mentorId: string): MentorAvailability => {
    if (!mentorId || mentorId.trim() === '') {
      throw new Error('Mentor ID is required for generating availability');
    }
    
    const timeSlots: TimeSlot[] = [];
    const today = new Date();
    
    // Generate availability for the next 14 days (2 weeks)
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Skip weekends for most mentors (Monday = 1, Friday = 5)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend availability - reduced hours, lower availability
        for (let hour = 10; hour < 16; hour++) { // 10 AM to 4 PM
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          // 40% chance of being available on weekends
          const isAvailable = Math.random() > 0.6;
          
          timeSlots.push({
            id: `${mentorId}_${dateString}_${hour}`,
            day: getDayName(dayOfWeek),
            startTime,
            endTime,
            isAvailable,
            type: 'specific' as const
          });
        }
      } else {
        // Weekday availability - full business hours
        for (let hour = 9; hour < 18; hour++) { // 9 AM to 6 PM
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          // 75% chance of being available on weekdays
          const isAvailable = Math.random() > 0.25;
          
          timeSlots.push({
            id: `${mentorId}_${dateString}_${hour}`,
            day: getDayName(dayOfWeek),
            startTime,
            endTime,
            isAvailable,
            type: 'specific' as const
          });
        }
      }
    }
    
    // Add some recurring weekly patterns for consistency
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    weekdays.forEach((day) => {
      // Add recurring morning slots (9-11 AM)
      timeSlots.push({
        id: `${mentorId}_recurring_${day}_morning`,
        day: day,
        startTime: '09:00',
        endTime: '11:00',
        isAvailable: Math.random() > 0.2, // 80% chance of morning availability
        type: 'recurring' as const
      });
      
      // Add recurring afternoon slots (2-4 PM)
      timeSlots.push({
        id: `${mentorId}_recurring_${day}_afternoon`,
        day: day,
        startTime: '14:00',
        endTime: '16:00',
        isAvailable: Math.random() > 0.15, // 85% chance of afternoon availability
        type: 'recurring' as const
      });
    });
    
    // Add more sophisticated recurring patterns
    const recurringSlots = generateSampleRecurringAvailability(mentorId);
    timeSlots.push(...recurringSlots);
    
    // Add some special availability patterns (holidays, special events, etc.)
    const specialSlots = generateSpecialAvailability(mentorId);
    timeSlots.push(...specialSlots);
    
    return {
      mentorId,
      timeSlots,
      lastUpdated: new Date()
    };
  };

  const generateRandomBooking = (mentor: MentorMenteeProfile, mentorId: string): Booking => {
    if (!mentor || !mentorId || mentorId.trim() === '') {
      throw new Error('Mentor and mentor ID are required for generating bookings');
    }
    
    const today = new Date();
    const randomDaysAhead = Math.floor(Math.random() * 14); // 0-14 days ahead
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() + randomDaysAhead);
    
    const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;
    
    const statuses: ('pending' | 'confirmed' | 'cancelled')[] = ['pending', 'confirmed', 'cancelled'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const isCalComBooking = Math.random() > 0.5; // 50% chance of being Cal.com booking
    
    // Create the base booking object
    const booking: Booking = {
      mentorName: mentor.name,
      mentorEmail: mentor.email,
      menteeName: `Test Mentee ${Math.floor(Math.random() * 1000)}`,
      menteeEmail: `mentee${Math.floor(Math.random() * 1000)}@example.com`,
      sessionDate: sessionDate.toISOString().split('T')[0],
      startTime,
      endTime,
      status,
      mentorId,
      menteeId: `mentee_${Math.random().toString(36).substr(2, 9)}`,
      duration: 60, // 1 hour sessions
      revenue: Math.floor(Math.random() * 50) + 25, // £25-75 per session
      createdAt: new Date()
    };
    
    // Only add Cal.com specific fields if it's a Cal.com booking
    if (isCalComBooking) {
      booking.meetLink = `https://meet.google.com/abc-defg-hij`;
      booking.eventId = `event_${Math.random().toString(36).substr(2, 9)}`;
      booking.isCalComBooking = true;
      booking.calComBookingId = `cal_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      booking.isCalComBooking = false;
    }
    
    return booking;
  };

  // Generate some sample recurring availability patterns for mentors
  const generateSampleRecurringAvailability = (mentorId: string): TimeSlot[] => {
    if (!mentorId || mentorId.trim() === '') {
      return [];
    }
    
    const recurringSlots: TimeSlot[] = [];
    
    // Different availability patterns based on mentor type (randomized)
    const mentorType = Math.random();
    
    if (mentorType < 0.3) {
      // Early bird mentor - available early mornings
      const earlyPatterns = [
        { day: 'Monday', start: '07:00', end: '11:00', availability: 0.95 },
        { day: 'Tuesday', start: '07:00', end: '11:00', availability: 0.9 },
        { day: 'Wednesday', start: '07:00', end: '11:00', availability: 0.95 },
        { day: 'Thursday', start: '07:00', end: '11:00', availability: 0.9 },
        { day: 'Friday', start: '07:00', end: '11:00', availability: 0.85 }
      ];
      
      earlyPatterns.forEach((pattern, index) => {
        recurringSlots.push({
          id: `${mentorId}_recurring_${pattern.day}_early_${index}`,
          day: pattern.day,
          startTime: pattern.start,
          endTime: pattern.end,
          isAvailable: Math.random() < pattern.availability,
          type: 'recurring' as const
        });
      });
    } else if (mentorType < 0.6) {
      // Standard business hours mentor
      const standardPatterns = [
        { day: 'Monday', start: '09:00', end: '12:00', availability: 0.9 },
        { day: 'Monday', start: '14:00', end: '17:00', availability: 0.8 },
        { day: 'Tuesday', start: '10:00', end: '13:00', availability: 0.85 },
        { day: 'Tuesday', start: '15:00', end: '18:00', availability: 0.75 },
        { day: 'Wednesday', start: '09:00', end: '11:00', availability: 0.9 },
        { day: 'Wednesday', start: '13:00', end: '16:00', availability: 0.8 },
        { day: 'Thursday', start: '10:00', end: '14:00', availability: 0.85 },
        { day: 'Thursday', start: '15:00', end: '17:00', availability: 0.7 },
        { day: 'Friday', start: '09:00', end: '12:00', availability: 0.8 },
        { day: 'Friday', start: '14:00', end: '16:00', availability: 0.6 }
      ];
      
      standardPatterns.forEach((pattern, index) => {
        recurringSlots.push({
          id: `${mentorId}_recurring_${pattern.day}_standard_${index}`,
          day: pattern.day,
          startTime: pattern.start,
          endTime: pattern.end,
          isAvailable: Math.random() < pattern.availability,
          type: 'recurring' as const
        });
      });
    } else {
      // Evening mentor - available late afternoons and evenings
      const eveningPatterns = [
        { day: 'Monday', start: '16:00', end: '20:00', availability: 0.9 },
        { day: 'Tuesday', start: '16:00', end: '20:00', availability: 0.85 },
        { day: 'Wednesday', start: '16:00', end: '20:00', availability: 0.9 },
        { day: 'Thursday', start: '16:00', end: '20:00', availability: 0.85 },
        { day: 'Friday', start: '16:00', end: '19:00', availability: 0.8 },
        { day: 'Saturday', start: '10:00', end: '14:00', availability: 0.7 }
      ];
      
      eveningPatterns.forEach((pattern, index) => {
        recurringSlots.push({
          id: `${mentorId}_recurring_${pattern.day}_evening_${index}`,
          day: pattern.day,
          startTime: pattern.start,
          endTime: pattern.end,
          isAvailable: Math.random() < pattern.availability,
          type: 'recurring' as const
        });
      });
    }
    
    return recurringSlots;
  };

  // Generate special availability patterns (holidays, special events, etc.)
  const generateSpecialAvailability = (mentorId: string): TimeSlot[] => {
    if (!mentorId || mentorId.trim() === '') {
      return [];
    }
    
    const specialSlots: TimeSlot[] = [];
    const today = new Date();
    
    // Generate some special availability patterns for the next 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      
      // 10% chance of having special availability on any given day
      if (Math.random() < 0.1) {
        const specialType = Math.random();
        
        if (specialType < 0.3) {
          // Extended hours day
          for (let hour = 8; hour < 20; hour++) {
            specialSlots.push({
              id: `${mentorId}_special_extended_${dateString}_${hour}`,
              day: getDayName(dayOfWeek),
              startTime: `${hour.toString().padStart(2, '0')}:00`,
              endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
              isAvailable: Math.random() > 0.2, // 80% chance of availability
              type: 'specific' as const
            });
          }
        } else if (specialType < 0.6) {
          // Reduced hours day
          for (let hour = 12; hour < 16; hour++) {
            specialSlots.push({
              id: `${mentorId}_special_reduced_${dateString}_${hour}`,
              day: getDayName(dayOfWeek),
              startTime: `${hour.toString().padStart(2, '0')}:00`,
              endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
              isAvailable: Math.random() > 0.3, // 70% chance of availability
              type: 'specific' as const
            });
          }
        } else {
          // Weekend special availability
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            for (let hour = 9; hour < 17; hour++) {
              specialSlots.push({
                id: `${mentorId}_special_weekend_${dateString}_${hour}`,
                day: getDayName(dayOfWeek),
                startTime: `${hour.toString().padStart(2, '0')}:00`,
                endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                isAvailable: Math.random() > 0.4, // 60% chance of weekend availability
                type: 'specific' as const
              });
            }
          }
        }
      }
    }
    
    return specialSlots;
  };

  const generateAvailabilityForExistingMentors = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get all existing mentors from the mentorProgram collection
      const mentorsQuery = query(
        collection(db, 'mentorProgram'),
        where('type', '==', 'mentor')
      );
      const mentorsSnapshot = await getDocs(mentorsQuery);
      
      if (mentorsSnapshot.empty) {
        setError('No mentors found to generate availability for.');
        return;
      }

      let generatedCount = 0;
      for (const mentorDoc of mentorsSnapshot.docs) {
        // Check if availability already exists for this mentor
        const availabilityQuery = query(
          collection(db, 'mentorAvailability'),
          where('mentorId', '==', mentorDoc.id)
        );
        const existingAvailability = await getDocs(availabilityQuery);
        
        // If overwriting, delete existing availability first
        if (overwriteAvailability && !existingAvailability.empty) {
          const deletePromises = existingAvailability.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }
        
        // Generate availability if none exists or if overwriting
        if (existingAvailability.empty || overwriteAvailability) {
          const mentorData = mentorDoc.data();
          const mentorUid = mentorData.uid || mentorDoc.id; // Use uid if available, fallback to doc id
          const availabilityData = generateRandomAvailability(mentorUid);
          await setDoc(doc(db, 'mentorAvailability', mentorUid), availabilityData);
          generatedCount++;
        }
      }

      setSuccess(`Generated availability data for ${generatedCount} mentors!`);
    } catch (err) {
      console.error('Error generating availability:', err);
      setError('Failed to generate availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMentors = async () => {
    try {
      const mentorsQuery = query(
        collection(db, 'mentorProgram'),
        where('type', '==', 'mentor')
      );
      const mentorsSnapshot = await getDocs(mentorsQuery);
      
      const mentors = mentorsSnapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.data().uid || doc.id, // Use uid if available, fallback to doc id
        name: doc.data().name || 'Unknown Name',
        email: doc.data().email || 'No Email'
      }));
      
      setAvailableMentors(mentors);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to fetch available mentors.');
    }
  };

  const generateAvailabilityForSpecificMentors = async () => {
    if (selectedMentors.length === 0) {
      setError('Please select at least one mentor.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let generatedCount = 0;
      
      for (const mentorId of selectedMentors) {
        // Find the mentor document to get their uid
        const mentorDoc = availableMentors.find(m => m.id === mentorId);
        if (!mentorDoc) continue;
        
        const mentorUid = mentorDoc.uid;
        
        // Check if availability already exists for this mentor
        const availabilityQuery = query(
          collection(db, 'mentorAvailability'),
          where('mentorId', '==', mentorUid)
        );
        const existingAvailability = await getDocs(availabilityQuery);
        
        // If overwriting, delete existing availability first
        if (overwriteAvailability && !existingAvailability.empty) {
          const deletePromises = existingAvailability.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }
        
        // Generate availability if none exists or if overwriting
        if (existingAvailability.empty || overwriteAvailability) {
          const availabilityData = generateRandomAvailability(mentorUid);
          await setDoc(doc(db, 'mentorAvailability', mentorUid), availabilityData);
          generatedCount++;
        }
      }

      setSuccess(`Generated availability data for ${generatedCount} selected mentors!`);
      setSelectedMentors([]);
      setShowMentorSelector(false);
    } catch (err) {
      console.error('Error generating availability for specific mentors:', err);
      setError('Failed to generate availability for selected mentors.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMentorSelection = (mentorId: string) => {
    if (!mentorId || mentorId.trim() === '') {
      return;
    }
    
    setSelectedMentors(prev => 
      prev.includes(mentorId) 
        ? prev.filter(id => id !== mentorId)
        : [...prev, mentorId]
    );
  };

  const filteredMentors = availableMentors.filter(mentor =>
    mentor && mentor.name && mentor.email && mentorSearch &&
    mentor.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    mentor.email.toLowerCase().includes(mentorSearch.toLowerCase())
  );

  // Generate site-wide availability settings for mentors
  const generateSiteWideAvailability = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get all existing mentors
      const mentorsQuery = query(
        collection(db, 'mentorProgram'),
        where('type', '==', 'mentor')
      );
      const mentorsSnapshot = await getDocs(mentorsQuery);
      
      if (mentorsSnapshot.empty) {
        setError('No mentors found to generate site-wide availability for.');
        return;
      }

      let generatedCount = 0;
      for (const mentorDoc of mentorsSnapshot.docs) {
        // Generate comprehensive availability data
        const mentorData = mentorDoc.data();
        const mentorUid = mentorData.uid || mentorDoc.id; // Use uid if available, fallback to doc id
        const availabilityData = generateRandomAvailability(mentorUid);
        
        // Always overwrite existing availability for site-wide generation
        await setDoc(doc(db, 'mentorAvailability', mentorUid), availabilityData);
        generatedCount++;
      }

      setSuccess(`Generated comprehensive site-wide availability for ${generatedCount} mentors!`);
    } catch (err) {
      console.error('Error generating site-wide availability:', err);
      setError('Failed to generate site-wide availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomProfile = (): MentorMenteeProfile => {
    if (!type) {
      throw new Error('Profile type is required for generating profiles');
    }
    
    const archetypeList = type === 'mentor' ? mentorArchetypes : menteeArchetypes;
    const selectedArchetype = archetypeList.find(a => a.key === archetype);
    if (!useArchetype || !selectedArchetype || archetype === 'random') {
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
        uid: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        age: age.toString(),
        degree: `${getRandomElement(['BSc', 'BA', 'MSc', 'MA'])} ${getRandomElement(['Computer Science', 'Business', 'Engineering', 'Arts', 'Science'])}`,
        educationLevel: getRandomElement(availableEducationLevels),
        county: getRandomElement(ukCounties),
        profession: getRandomElement(professions),
        pastProfessions: getRandomElements(professions, Math.floor(Math.random() * 3) + 1),
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        calCom: type === 'mentor' ? `https://${firstName.toLowerCase()}.cal.com/30min` : '',
        hobbies: getRandomElements(hobbies, Math.floor(Math.random() * 4) + 2),
        ethnicity: getRandomElement(ethnicityOptions),
        religion: getRandomElement(religionOptions),
        skills: type === 'mentor' ? skills : [],
        lookingFor: type === 'mentee' ? lookingFor : [],
        industries,
        type: type || 'mentor',
        isGenerated: "true",
      };
    }
    
    // Archetype-based generation
    if (!selectedArchetype) {
      throw new Error('Selected archetype is required for archetype-based generation');
    }
    
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const age = Math.floor(Math.random() * ((selectedArchetype.ageRange?.[1] || 60) - (selectedArchetype.ageRange?.[0] || 18) + 1)) + (selectedArchetype.ageRange?.[0] || 18);
    const skills = selectedArchetype.skills && selectedArchetype.skills.length > 0 ? getRandomElements(selectedArchetype.skills, Math.floor(Math.random() * 3) + 2) : getRandomSkills();
    const lookingFor = selectedArchetype.type === 'mentee' && selectedArchetype.skills && selectedArchetype.skills.length > 0 ? getRandomElements(selectedArchetype.skills, Math.floor(Math.random() * 3) + 2) : [];
    const industries = selectedArchetype.industries && selectedArchetype.industries.length > 0 ? getRandomElements(selectedArchetype.industries, 1) : getRandomElements(industriesList, 1);
    const degree = selectedArchetype.degrees && selectedArchetype.degrees.length > 0 ? getRandomElement(selectedArchetype.degrees) : getRandomElement(['BSc', 'BA', 'MSc', 'MA']);
    const educationLevel = selectedArchetype.educationLevels && selectedArchetype.educationLevels.length > 0 ? getRandomElement(selectedArchetype.educationLevels) : getRandomElement(ukEducationLevels);
    const profession = selectedArchetype.professions && selectedArchetype.professions.length > 0 ? getRandomElement(selectedArchetype.professions) : getRandomElement(professions);
    const hobbiesList = selectedArchetype.hobbies && selectedArchetype.hobbies.length > 0 ? getRandomElements(selectedArchetype.hobbies, Math.floor(Math.random() * 3) + 1) : getRandomElements(hobbies, Math.floor(Math.random() * 4) + 2);
    return {
      uid: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      age: age.toString(),
      degree,
      educationLevel,
      county: getRandomElement(ukCounties),
      profession,
      pastProfessions: [],
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      calCom: selectedArchetype.type === 'mentor' ? `https://${firstName.toLowerCase()}.cal.com/30min` : '',
      hobbies: hobbiesList,
      ethnicity: getRandomElement(ethnicityOptions),
      religion: getRandomElement(religionOptions),
      skills: selectedArchetype.type === 'mentor' ? skills : [],
      lookingFor,
      industries,
      type: (selectedArchetype.type as 'mentor' | 'mentee') || type,
      isGenerated: "true",
    };
  };

  const handleGenerate = async () => {
    if (!type) {
      setError('Please select a profile type');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profiles = Array.from({ length: count }, () => generateRandomProfile());
      
      for (const profile of profiles) {
        // Add the profile to mentorProgram collection
        const docRef = await addDoc(collection(db, 'mentorProgram'), profile);
        
        // If it's a mentor, also generate availability data for testing
        if (profile.type === 'mentor') {
          const availabilityData = generateRandomAvailability(profile.uid);
          await setDoc(doc(db, 'mentorAvailability', profile.uid), availabilityData);
          
          // If sample data is enabled, generate some sample bookings
          if (generateSampleData) {
            const numBookings = Math.floor(Math.random() * 3) + 1; // 1-3 bookings per mentor
            for (let i = 0; i < numBookings; i++) {
              const bookingData = generateRandomBooking(profile, docRef.id);
              await addDoc(collection(db, 'bookings'), bookingData);
            }
          }
        }
      }

      // If generating mentors and mentees are requested, generate some mentees too
      if (type === 'mentor' && generateMentees) {
        const menteeCount = Math.min(count, 5); // Generate up to 5 mentees
        const menteeProfiles = Array.from({ length: menteeCount }, () => {
          const menteeProfile = generateRandomProfile();
          menteeProfile.type = 'mentee';
          return menteeProfile;
        });
        
        for (const menteeProfile of menteeProfiles) {
          await addDoc(collection(db, 'mentorProgram'), menteeProfile);
        }
      }

      const sampleDataText = generateSampleData ? ' (with sample bookings)' : '';
      const menteesText = (type === 'mentor' && generateMentees) ? ' (with sample mentees)' : '';
      setSuccess(`Successfully generated ${count} ${type}${count > 1 ? 's' : ''}!${type === 'mentor' ? ' (with availability data for testing)' : ''}${sampleDataText}${menteesText}`);
    } catch (err) {
      console.error('Error generating profiles:', err);
      setSuccess(null);
      setError('Failed to generate profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mentor-management">
      <div className="mentor-management-header">
        <h2>🎲 Generate Test Data</h2>
        <p style={{ color: 'var(--gray-600)', marginTop: 8, fontSize: 14 }}>
          Create realistic test profiles and data for development and testing purposes
        </p>
      </div>

      {/* Profile Type Selection */}
      <div className="profile-type-selector">
        <div className="selector-tabs">
          <button
            className={`selector-tab ${type === 'mentor' ? 'active' : ''}`}
            onClick={() => setType('mentor')}
          >
            <FaChalkboardTeacher />
            <span>Mentors</span>
          </button>
          <button
            className={`selector-tab ${type === 'mentee' ? 'active' : ''}`}
            onClick={() => setType('mentee')}
          >
            <FaUserGraduate />
            <span>Mentees</span>
          </button>
        </div>
      </div>

      {/* Main Generation Section */}
      <div className="generation-section">
        <div className="generation-card primary">
          <div className="card-header">
            <div className="card-icon">✨</div>
            <div className="card-title">
              <h3>Generate New Profiles</h3>
              <p>Create new {type} profiles with realistic data</p>
            </div>
          </div>
          
          <div className="generation-controls">
            <div className="quantity-control">
              <label>Number of Profiles</label>
              <div className="quantity-input-group">
                <button 
                  className="quantity-btn"
                  onClick={() => setCount(Math.max(1, count - 1))}
                  disabled={count <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="quantity-input"
                />
                <button 
                  className="quantity-btn"
                  onClick={() => setCount(Math.min(20, count + 1))}
                  disabled={count >= 20}
                >
                  +
                </button>
              </div>
            </div>

            <div className="options-grid">
              <div className="option-group">
                <label className="option-label">
                  <input 
                    type="checkbox" 
                    checked={useArchetype} 
                    onChange={e => setUseArchetype(e.target.checked)}
                    className="option-checkbox"
                  />
                  <span>Use Specific Archetype</span>
                </label>
                {useArchetype && (
                  <select 
                    value={archetype} 
                    onChange={e => setArchetype(e.target.value)}
                    className="archetype-select"
                  >
                    {(type === 'mentor' ? mentorArchetypes : menteeArchetypes).map(a => 
                      <option key={a.key} value={a.key}>{a.label}</option>
                    )}
                  </select>
                )}
              </div>

              {type === 'mentor' && (
                <>
                  <div className="option-group">
                    <label className="option-label">
                      <input 
                        type="checkbox" 
                        checked={generateSampleData} 
                        onChange={e => setGenerateSampleData(e.target.checked)}
                        className="option-checkbox"
                      />
                      <span>Include Sample Bookings</span>
                    </label>
                    <small>Creates 1-3 sample bookings per mentor</small>
                  </div>

                  <div className="option-group">
                    <label className="option-label">
                      <input 
                        type="checkbox" 
                        checked={generateMentees} 
                        onChange={e => setGenerateMentees(e.target.checked)}
                        className="option-checkbox"
                      />
                      <span>Generate Matching Mentees</span>
                    </label>
                    <small>Creates up to 5 mentees for testing</small>
                  </div>

                  <div className="option-group">
                    <label className="option-label">
                      <input 
                        type="checkbox" 
                        checked={overwriteAvailability} 
                        onChange={e => setOverwriteAvailability(e.target.checked)}
                        className="option-checkbox"
                      />
                      <span>Overwrite Existing Availability</span>
                    </label>
                    <small>Generate availability for mentors even if it already exists</small>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="generate-btn primary"
            >
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <>
                  <FaRandom />
                  <span>Generate {count} {type}{count > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Availability Generation Section */}
        <div className="generation-card secondary">
          <div className="card-header">
            <div className="card-icon">📅</div>
            <div className="card-title">
              <h3>Generate Availability Data</h3>
              <p>Add availability schedules to existing mentors</p>
            </div>
          </div>
          
          <div className="availability-info">
            <div className="info-item">
              <span className="info-icon">⏰</span>
              <span>7 days of time slots</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🕘</span>
              <span>9 AM - 5 PM daily</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📊</span>
              <span>70% availability rate</span>
            </div>
          </div>

          <div className="option-group" style={{ marginBottom: 20 }}>
            <label className="option-label">
              <input 
                type="checkbox" 
                checked={overwriteAvailability} 
                onChange={e => setOverwriteAvailability(e.target.checked)}
                className="option-checkbox"
              />
              <span>Overwrite Existing Availability</span>
            </label>
            <small>Generate availability for all mentors, even if it already exists</small>
          </div>

          <div className="availability-info">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <span>Generate comprehensive availability data for all mentors, including specific dates, recurring patterns, and realistic scheduling preferences.</span>
            </div>
          </div>

          <div className="availability-actions">
            <button
              onClick={generateSiteWideAvailability}
              disabled={loading}
              className="generate-btn primary"
            >
              <FaChalkboardTeacher />
              <span>Generate Site-Wide Availability</span>
            </button>

            <button
              onClick={generateAvailabilityForExistingMentors}
              disabled={loading}
              className="generate-btn secondary"
            >
              <FaChalkboardTeacher />
              <span>Generate for All Mentors</span>
            </button>

            <button
              onClick={() => {
                setShowMentorSelector(!showMentorSelector);
                if (!showMentorSelector) {
                  fetchAvailableMentors();
                }
              }}
              disabled={loading}
              className="generate-btn secondary outline"
            >
              <FaChalkboardTeacher />
              <span>Select Specific Mentors</span>
            </button>
          </div>

          {/* Mentor Selector Modal */}
          {showMentorSelector && (
            <>
              {/* Backdrop */}
              <div 
                className="mentor-selector-backdrop"
                onClick={() => setShowMentorSelector(false)}
              />
              
              {/* Modal */}
              <div className="mentor-selector-modal">
                <div className="modal-header">
                  <h4>Select Mentors for Availability Generation</h4>
                  <button 
                    onClick={() => setShowMentorSelector(false)}
                    className="close-btn"
                  >
                    ×
                  </button>
                </div>
                
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Search mentors by name or email..."
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    className="mentor-search-input"
                  />
                </div>

                <div className="mentors-list">
                  {filteredMentors.map(mentor => (
                    <label key={mentor.id} className="mentor-item">
                      <input
                        type="checkbox"
                        checked={selectedMentors.includes(mentor.id)}
                        onChange={() => toggleMentorSelection(mentor.id)}
                        className="mentor-checkbox"
                      />
                      <div className="mentor-info">
                        <span className="mentor-name">{mentor.name}</span>
                        <span className="mentor-email">{mentor.email}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="modal-actions">
                  <button
                    onClick={generateAvailabilityForSpecificMentors}
                    disabled={loading || selectedMentors.length === 0}
                    className="generate-btn secondary"
                  >
                    <FaChalkboardTeacher />
                    <span>Generate for {selectedMentors.length} Selected</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="status-message error">
          <span className="status-icon">❌</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="status-message success">
          <span className="status-icon">✅</span>
          <span>{success}</span>
        </div>
      )}
    </div>
  );
} 