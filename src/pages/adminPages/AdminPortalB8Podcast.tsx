import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CvFormData } from '../../types/podcast';
import '../../styles/adminStyles/AdminPortalB8Podcast.css';
import { BusinessSection } from '../../components/BusinessSection';

interface AdminPortalB8PodcastProps {
  stats: { totalMembers: number; activeMembers: number; revenue: number; engagement: number };
}

export function AdminPortalB8Podcast({ stats }: AdminPortalB8PodcastProps) {
  const [cvs, setCvs] = useState<CvFormData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setLoading(true);
        const cvsQuery = query(collection(db, 'B8Podcast'));
        const querySnapshot = await getDocs(cvsQuery);
        const cvsData: CvFormData[] = [];
        
        querySnapshot.forEach((doc) => {
          cvsData.push({ id: doc.id, ...doc.data() } as CvFormData);
        });
        
        setCvs(cvsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCVs();
  }, []);

  const updateCVStatus = async (cvId: string, newStatus: CvFormData['status']) => {
    try {
      const cvRef = doc(db, 'B8Podcast', cvId);
      await updateDoc(cvRef, {
        status: newStatus
      });
      
      // Update local state
      setCvs(prevCvs => 
        prevCvs.map(cv => 
          cv.id === cvId ? { ...cv, status: newStatus } : cv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="admin-portal-podcast">
      <h2>B8 Podcast</h2>
      <BusinessSection stats={stats} businessName="Podcast" />
      
      <div className="podcast-submissions-section">
        <h3>Submissions</h3>
        {loading ? (
          <p>Loading submissions...</p>
        ) : cvs.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Area of Expertise</th>
                  <th>Submission</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {cvs.map((cv) => (
                  <tr key={cv.id}>
                    <td>{cv.name}</td>
                    <td>{cv.email}</td>
                    <td>{cv.phone}</td>
                    <td>{cv.industry}</td>
                    <td>
                      {cv.cvUrl && (
                        <a href={cv.cvUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      )}
                    </td>
                    <td>
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
                    </td>
                    <td>
                      {cv.dateSubmitted ? new Date(cv.dateSubmitted.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="podcast-management-section">
        <h3>Podcast Management</h3>
        <p>Tools for managing podcast episodes and series will be added here.</p>
      </div>
    </div>
  );
} 