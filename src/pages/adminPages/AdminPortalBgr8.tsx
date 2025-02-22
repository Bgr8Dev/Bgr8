import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import '../../styles/AdminPortalBgr8.css';

interface AdminPortalBgr8Props {
  stats: BusinessStats;
}

interface MedicalRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profession: string;
  licenseNumber?: string;
  affiliation?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  dateSubmitted: { seconds: number, nanoseconds: number };
}

export function AdminPortalBgr8({ stats }: AdminPortalBgr8Props) {
  const [medicalRegistrations, setMedicalRegistrations] = useState<MedicalRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMedicalRegistrations();
  }, []);

  const fetchMedicalRegistrations = async () => {
    try {
      const registrationsQuery = query(collection(db, 'Bgr8Medical'));
      const querySnapshot = await getDocs(registrationsQuery);
      const registrations: MedicalRegistration[] = [];
      
      querySnapshot.forEach((doc) => {
        registrations.push({ id: doc.id, ...doc.data() } as MedicalRegistration);
      });
      
      setMedicalRegistrations(registrations);
    } catch (error) {
      console.error('Error fetching medical registrations:', error);
      setError('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: MedicalRegistration['status']) => {
    try {
      const registrationRef = doc(db, 'Bgr8Medical', registrationId);
      await updateDoc(registrationRef, {
        status: newStatus
      });
      await fetchMedicalRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error updating registration status:', error);
    }
  };

  return (
    <div className="admin-section">
      <h2>BGr8</h2>
      <BusinessSection stats={stats} businessName="BGr8" />
      
      <div className="medical-registrations-section">
        <h3>Medical Registrations</h3>
        
        {loading && <div className="loading">Loading registrations...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="registrations-grid">
          {medicalRegistrations.map((registration) => (
            <div key={registration.id} className={`registration-card status-${registration.status}`}>
              <div className="registration-header">
                <h4>{registration.fullName}</h4>
                <select
                  value={registration.status}
                  onChange={(e) => updateRegistrationStatus(registration.id, e.target.value as MedicalRegistration['status'])}
                  className={`status-select status-${registration.status}`}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="registration-content">
                <p><strong>Profession:</strong> {registration.profession}</p>
                <p><strong>Email:</strong> {registration.email}</p>
                <p><strong>Phone:</strong> {registration.phone}</p>
                {registration.licenseNumber && (
                  <p><strong>License:</strong> {registration.licenseNumber}</p>
                )}
                {registration.affiliation && (
                  <p><strong>Affiliation:</strong> {registration.affiliation}</p>
                )}
                <p><strong>Reason:</strong> {registration.reason}</p>
                <p><strong>Submitted:</strong> {new Date(registration.dateSubmitted.seconds * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 