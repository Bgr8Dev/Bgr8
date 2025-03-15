import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import { CvFormData } from '../../types/careers';
import '../../styles/adminStyles/AdminPortalB8Careers.css';

interface AdminPortalB8CareersProps {
  stats: BusinessStats;
}

export function AdminPortalB8Careers({ stats }: AdminPortalB8CareersProps) {
  const [cvs, setCvs] = useState<CvFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllCVs();
  }, []);

  const fetchAllCVs = async () => {
    try {
      const cvsQuery = query(collection(db, 'B8Careers'));
      const querySnapshot = await getDocs(cvsQuery);
      const cvsData: CvFormData[] = [];
      
      querySnapshot.forEach((doc) => {
        cvsData.push({ id: doc.id, ...doc.data() } as CvFormData);
      });
      
      setCvs(cvsData);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setError('Failed to fetch CVs');
    } finally {
      setLoading(false);
    }
  };

  const updateCVStatus = async (cvId: string, newStatus: CvFormData['status']) => {
    try {
      const cvRef = doc(db, 'B8Careers', cvId);
      await updateDoc(cvRef, {
        status: newStatus
      });
      await fetchAllCVs(); // Refresh the list
    } catch (error) {
      console.error('Error updating CV status:', error);
    }
  };

  return (
    <div className="admin-section">
      <h2>B8 Careers</h2>
      <BusinessSection stats={stats} businessName="Careers" />
      
      <div className="cv-admin-section">
        <h3>CV Applications</h3>
        
        {loading && <div className="loading">Loading CVs...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="cv-admin-grid">
          {cvs.map((cv) => (
            <div key={cv.id} className="cv-admin-card">
              <div className="cv-admin-header">
                <h4>{cv.industry}</h4>
                <select
                  value={cv.status}
                  onChange={(e) => updateCVStatus(cv.id, e.target.value as CvFormData['status'])}
                  className={`status-select status-${cv.status}`}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="contacted">Contacted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="cv-admin-content">
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
                <p><strong>Submitted:</strong> {cv.dateSubmitted instanceof Date ? cv.dateSubmitted.toLocaleDateString() : new Date(cv.dateSubmitted).toLocaleDateString()}</p>
              </div>

              <div className="cv-admin-actions">
                <a 
                  href={cv.cvUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="view-cv-button"
                >
                  View CV
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 