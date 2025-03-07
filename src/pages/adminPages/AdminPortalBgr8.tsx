import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import '../../styles/adminStyles/AdminPortalBgr8.css';

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
  const [updateInProgress, setUpdateInProgress] = useState<string | null>(null);

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
      
      // Sort by date, newest first
      registrations.sort((a, b) => b.dateSubmitted.seconds - a.dateSubmitted.seconds);
      
      setMedicalRegistrations(registrations);
    } catch (error) {
      console.error('Error fetching medical registrations:', error);
      setError('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: MedicalRegistration['status']) => {
    setUpdateInProgress(registrationId);
    try {
      const registrationRef = doc(db, 'Bgr8Medical', registrationId);
      await updateDoc(registrationRef, {
        status: newStatus
      });
      await fetchMedicalRegistrations();
    } catch (error) {
      console.error('Error updating registration status:', error);
    } finally {
      setUpdateInProgress(null);
    }
  };

  const getStatusColor = (status: MedicalRegistration['status']) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      default: return '#FFA726';
    }
  };

  const formatDate = (seconds: number) => {
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-section">
      <h2>BGr8</h2>
      <BusinessSection stats={stats} businessName="BGr8" />
      
      <div className="medical-registrations-section">
        <h3>Medical Registrations</h3>
        
        {loading && (
          <div className="loading">
            <span>Loading registrations</span>
            <span className="loading-dots">...</span>
          </div>
        )}
        
        {error && (
          <div className="error">
            <span>⚠️ {error}</span>
          </div>
        )}
        
        <div className="registrations-grid">
          {medicalRegistrations.map((registration, index) => (
            <div 
              key={registration.id} 
              className={`registration-card status-${registration.status}`}
              style={{ '--animation-order': index } as React.CSSProperties}
            >
              <div className="registration-header">
                <h4>{registration.fullName}</h4>
                <select
                  value={registration.status}
                  onChange={(e) => updateRegistrationStatus(registration.id, e.target.value as MedicalRegistration['status'])}
                  className={`status-select status-${registration.status}`}
                  disabled={updateInProgress === registration.id}
                  style={{ backgroundColor: getStatusColor(registration.status) }}
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
                <p><strong>Submitted:</strong> {formatDate(registration.dateSubmitted.seconds)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 