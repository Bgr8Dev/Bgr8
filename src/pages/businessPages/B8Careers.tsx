import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs,  serverTimestamp, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, storage, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { CvFormData } from '../../types/careers';
import '../../styles/B8Careers.css';

export default function B8Careers() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingCV, setExistingCV] = useState<CvFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cvForm, setCvForm] = useState<Omit<CvFormData, 'id' | 'cvUrl' | 'dateSubmitted' | 'status'>>({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    industry: '',
    professionalWeb: '',
    otherLinks: '',
    filePath: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const { userProfile } = useAuth();
  const [userCVs, setUserCVs] = useState<CvFormData[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchExistingCV();
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.email) {
      fetchUserCVs();
    }
  }, [userProfile]);

  const fetchExistingCV = async () => {
    if (!userProfile?.firstName) return;
    
    try {
      const cvDocRef = doc(db, 'B8Careers', userProfile.firstName);
      const cvDoc = await getDoc(cvDocRef);
      
      if (cvDoc.exists()) {
        setExistingCV(cvDoc.data() as CvFormData);
        if (!isEditing) {
          setCvForm({
            name: cvDoc.data().name,
            email: cvDoc.data().email,
            phone: cvDoc.data().phone,
            linkedIn: cvDoc.data().linkedIn,
            industry: cvDoc.data().industry,
            professionalWeb: cvDoc.data().professionalWeb,
            otherLinks: cvDoc.data().otherLinks,
            filePath: cvDoc.data().filePath,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing CV:', error);
    }
  };

  const fetchUserCVs = async () => {
    if (!userProfile?.email) return;
    
    try {
      const cvsQuery = query(
        collection(db, 'B8Careers'),
        where('email', '==', userProfile.email)
      );
      
      const querySnapshot = await getDocs(cvsQuery);
      const cvs: CvFormData[] = [];
      
      querySnapshot.forEach((doc) => {
        cvs.push({ id: doc.id, ...doc.data() } as CvFormData);
      });
      
      setUserCVs(cvs);
    } catch (error) {
      console.error('Error fetching user CVs:', error);
    }
  };

  const handleDeleteCV = async (cv: CvFormData) => {
    if (!cv || !userProfile?.uid) return;
    
    try {
      // Delete file from Storage
      const storageRef = ref(storage, cv.filePath);
      await deleteObject(storageRef);

      // Delete document from Firestore
      const cvDocRef = doc(db, 'B8Careers', cv.name);
      await deleteDoc(cvDocRef);

      // Update user profile
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        'career.hasUploadedCV': false,
        'career.lastCVUpdate': null,
        'career.cvDocId': null
      });

      setExistingCV(null);
      setCvForm({
        name: '',
        email: '',
        phone: '',
        linkedIn: '',
        industry: '',
        professionalWeb: '',
        otherLinks: '',
        filePath: '',
      });
      setCvFile(null);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error deleting CV:', error);
      setSubmitError('Failed to delete CV');
    }
  };

  const handleCvSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      if (!cvFile) {
        throw new Error('Please select a CV file');
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

      // Create CV document in B8Careers collection
      const cvData = {
        ...cvForm,
        cvUrl,
        filePath,
        fileName: safeFileName,
        fileSize: cvFile.size,
        fileType: cvFile.type,
        dateSubmitted: serverTimestamp(),
        status: 'pending'
      };

      // Store CV data in B8Careers collection using name as document ID
      const cvDocRef = doc(db, 'B8Careers', cvForm.name);
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
    });
    setCvFile(null);
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

  return (
    <div className="page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      <section className="about-section">
        <h2>About B8 Careers</h2>
        <p>
          B8 Careers is dedicated to connecting talented individuals with dynamic opportunities in various industries.
          We believe in fostering growth, innovation, and collaboration.
        </p>
      </section>

      <section className="cv-management-section">
        <h3>Your CV Submissions</h3>
        <button 
          onClick={() => setIsEditing(true)} 
          className="add-cv-button"
        >
          Add New CV
        </button>

        <div className="cv-grid">
          {userCVs.map((cv) => (
            <div key={cv.id} className="cv-card">
              <div className="cv-card-header">
                <h4>{cv.industry}</h4>
                <span className={`status-badge status-${cv.status}`}>
                  {cv.status}
                </span>
              </div>
              
              <div className="cv-card-content">
                <p><strong>Name:</strong> {cv.name}</p>
                <p><strong>Email:</strong> {cv.email}</p>
                <p><strong>Phone:</strong> {cv.phone}</p>
                <p>
                  <strong>LinkedIn:</strong>{' '}
                  <a href={cv.linkedIn} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </p>
                {cv.professionalWeb && (
                  <p>
                    <strong>Website:</strong>{' '}
                    <a href={cv.professionalWeb} target="_blank" rel="noopener noreferrer">
                      View Website
                    </a>
                  </p>
                )}
                <p><strong>Submitted:</strong> {new Date(cv.dateSubmitted).toLocaleDateString()}</p>
              </div>

              <div className="cv-card-actions">
                <a 
                  href={cv.cvUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="view-cv-button"
                >
                  View CV
                </a>
                <button 
                  onClick={() => {
                    setExistingCV(cv);
                    setIsEditing(true);
                  }} 
                  className="edit-cv-button"
                >
                  Update
                </button>
                <button 
                  onClick={() => handleDeleteCV(cv)} 
                  className="delete-cv-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isEditing && (
        <section className="cv-submission-section">
          <h3>{existingCV ? 'Update CV' : 'Submit New CV'}</h3>
          {submitSuccess && (
            <div className="success-message">
              CV submitted successfully! We'll be in touch soon.
            </div>
          )}
          {submitError && (
            <div className="error-message">
              {submitError}
            </div>
          )}
          <form onSubmit={handleCvSubmit}>
            <input
              name="name"
              type="text"
              placeholder="Name"
              value={cvForm.name}
              onChange={handleInputChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={cvForm.email}
              onChange={handleInputChange}
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              value={cvForm.phone}
              onChange={handleInputChange}
              required
            />
            <input
              name="linkedIn"
              type="url"
              placeholder="LinkedIn Profile"
              value={cvForm.linkedIn}
              onChange={handleInputChange}
              required
            />
            <input
              name="industry"
              type="text"
              placeholder="Industry"
              value={cvForm.industry}
              onChange={handleInputChange}
              required
            />
            <input
              name="professionalWeb"
              type="url"
              placeholder="Professional Website"
              value={cvForm.professionalWeb}
              onChange={handleInputChange}
            />
            <input
              name="otherLinks"
              type="url"
              placeholder="Other Links"
              value={cvForm.otherLinks}
              onChange={handleInputChange}
            />
            <label className="file-input-label">
              Upload CV:
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                required
              />
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={isSubmitting ? 'submitting' : ''}
            >
              {isSubmitting ? 'Submitting...' : 'Submit CV'}
            </button>
          </form>
        </section>
      )}

      <Footer />
    </div>
  );
}
