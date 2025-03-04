import { useState, FormEvent, ChangeEvent } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FaBriefcase, FaUsers, FaRocket, FaFileAlt, FaChevronDown, FaCode, FaVideo, FaUserTie, FaHandshake, FaCheck } from 'react-icons/fa';
import '../../styles/components/JoinOurTeam.css';

interface JoinOurTeamProps {
  className?: string;
}

// Define job categories and roles
const jobCategories = [
  {
    id: 'developer',
    name: 'Developer',
    icon: <FaCode />,
    roles: ['Frontend', 'Backend', 'Database', 'Deploying']
  },
  {
    id: 'content',
    name: 'Content',
    icon: <FaVideo />,
    roles: ['Video Editing', 'Audio/Sound Engineering', 'Photography/Videography', 'Graphic Design', 'Animations']
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: <FaUserTie />,
    roles: ['Finance', 'General Admin', 'Coordinators']
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: <FaHandshake />,
    roles: ['Fundraising', 'Cold Calling', 'Client Relations']
  }
];

export default function JoinOurTeam({ className = '' }: JoinOurTeamProps) {
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const [cvForm, setCvForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    industry: '',
    professionalWeb: '',
    otherLinks: '',
    filePath: '',
    jobCategory: '',
    jobRoles: [] as string[]
  });

  const resetForm = () => {
    setCvForm({
      name: '',
      email: '',
      phone: '',
      linkedIn: '',
      industry: '',
      professionalWeb: '',
      otherLinks: '',
      filePath: '',
      jobCategory: '',
      jobRoles: []
    });
    setCvFile(null);
    setSelectedCategory(null);
    setSelectedRoles([]);
    setExpandedCategory(null);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCvForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCvFile(files[0]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    if (selectedCategory !== categoryId) {
      setSelectedCategory(categoryId);
      setSelectedRoles([]);
      setCvForm(prev => ({
        ...prev,
        jobCategory: categoryId,
        jobRoles: []
      }));
    }
  };

  const toggleRole = (category: string, role: string) => {
    setSelectedCategory(category);
    
    let updatedRoles: string[];
    if (selectedRoles.includes(role)) {
      updatedRoles = selectedRoles.filter(r => r !== role);
    } else {
      updatedRoles = [...selectedRoles, role];
    }
    
    setSelectedRoles(updatedRoles);
    setCvForm(prev => ({
      ...prev,
      jobCategory: category,
      jobRoles: updatedRoles
    }));
  };

  const handleCvSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      if (!cvFile) {
        throw new Error('Please select a CV file');
      }

      if (!selectedCategory || selectedRoles.length === 0) {
        throw new Error('Please select a job category and at least one role');
      }

      // Validate file size (10MB max)
      if (cvFile.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(cvFile.type)) {
        throw new Error('File must be a PDF or Word document');
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `cvs/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${timestamp}_${uniqueId}_${safeFileName}`;

      // Upload CV file to Firebase Storage
      const cvRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(cvRef, cvFile, {
        contentType: cvFile.type,
        customMetadata: {
          originalName: cvFile.name,
          uploadedBy: cvForm.email,
          uploadDate: new Date().toISOString()
        }
      });
      const cvUrl = await getDownloadURL(uploadResult.ref);

      // Create CV document in B8Marketing collection
      const cvData = {
        ...cvForm,
        cvUrl,
        filePath,
        fileName: safeFileName,
        fileSize: cvFile.size,
        fileType: cvFile.type,
        dateSubmitted: serverTimestamp(),
        status: 'pending',
        source: 'marketing'
      };

      // Store CV data in B8Marketing collection using name as document ID
      const cvDocRef = doc(collection(db, 'B8Marketing', 'careers', 'applications'), cvForm.name);
      await setDoc(cvDocRef, cvData);

      // Update user profile if logged in
      if (auth.currentUser && userProfile) {
        // Update the user's profile
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          'career.hasUploadedCV': true,
          'career.lastCVUpdate': serverTimestamp(),
          'career.cvDocId': cvDocRef.id,
          'career.industry': cvForm.industry,
          'career.professionalWebsite': cvForm.professionalWeb,
          'career.jobCategory': cvForm.jobCategory,
          'career.jobRoles': cvForm.jobRoles,
          'socialMedia.linkedin': cvForm.linkedIn
        });
      }

      setSubmitSuccess(true);
      resetForm();

    } catch (error) {
      console.error('Error submitting CV:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit CV');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`join-our-team-section ${className}`}>
      <h2>Join Our Team</h2>
      <p>
        We're always looking for talented individuals to join our team. If you're passionate about making an impact and driving growth, we want to hear from you.
      </p>
      
      <div className="team-benefits">
        <div className="benefit-card">
          <div className="benefit-icon">
            <FaBriefcase />
          </div>
          <h3>Career Growth</h3>
          <p>Opportunities to develop your skills and advance your career in a dynamic environment</p>
        </div>
        
        <div className="benefit-card">
          <div className="benefit-icon">
            <FaUsers />
          </div>
          <h3>Collaborative Culture</h3>
          <p>Work with a diverse team of professionals who are passionate about innovation</p>
        </div>
        
        <div className="benefit-card">
          <div className="benefit-icon">
            <FaRocket />
          </div>
          <h3>Innovative Projects</h3>
          <p>Be part of cutting-edge projects that make a real difference</p>
        </div>
      </div>
      
      <div className="cv-submission-container">
        <div className="cv-header">
          <FaFileAlt className="cv-icon" />
          <h3>Submit Your Application</h3>
        </div>
        
        {submitSuccess && (
          <div className="success-message">
            Application submitted successfully! We'll be in touch soon.
          </div>
        )}
        {submitError && (
          <div className="error-message">
            {submitError}
          </div>
        )}
        
        <div className="job-categories-container">
          <h4>Select a Position</h4>
          <p className="job-selection-instruction">Choose the category and roles you're interested in (you can select multiple roles):</p>
          
          <div className="job-categories">
            {jobCategories.map(category => (
              <div key={category.id} className="job-category">
                <div 
                  className={`category-header ${expandedCategory === category.id ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <h5>{category.name}</h5>
                  <FaChevronDown className="expand-icon" />
                </div>
                
                {expandedCategory === category.id && (
                  <div className="job-roles">
                    {category.roles.map(role => (
                      <div 
                        key={role} 
                        className={`job-role ${selectedCategory === category.id && selectedRoles.includes(role) ? 'selected' : ''}`}
                        onClick={() => toggleRole(category.id, role)}
                      >
                        {selectedCategory === category.id && selectedRoles.includes(role) && (
                          <FaCheck className="role-check-icon" />
                        )}
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {selectedCategory && selectedRoles.length > 0 && (
            <div className="selected-position">
              Selected position(s): <strong>{jobCategories.find(c => c.id === selectedCategory)?.name}</strong>
              <div className="selected-roles-list">
                {selectedRoles.map((role) => (
                  <span key={role} className="selected-role-tag">
                    {role}
                    <span 
                      className="remove-role" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRole(selectedCategory, role);
                      }}
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleCvSubmit} className="cv-submission-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={cvForm.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Your email address"
              value={cvForm.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Your phone number"
              value={cvForm.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="linkedIn">LinkedIn Profile</label>
            <input
              id="linkedIn"
              name="linkedIn"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={cvForm.linkedIn}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="industry">Specialty/Skills</label>
            <input
              id="industry"
              name="industry"
              type="text"
              placeholder="e.g., React, Video Editing, Project Management"
              value={cvForm.industry}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="professionalWeb">Portfolio Website (Optional)</label>
            <input
              id="professionalWeb"
              name="professionalWeb"
              type="url"
              placeholder="https://yourportfolio.com"
              value={cvForm.professionalWeb}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="otherLinks">Other Links (Optional)</label>
            <input
              id="otherLinks"
              name="otherLinks"
              type="url"
              placeholder="https://yourwork.com"
              value={cvForm.otherLinks}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="cv-file" className="file-input-label">
              <FaFileAlt className="file-icon" />
              Upload CV (PDF or Word document)
              <input
                id="cv-file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                required
              />
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !selectedCategory || selectedRoles.length === 0}
            className={isSubmitting ? 'submitting' : ''}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </section>
  );
} 