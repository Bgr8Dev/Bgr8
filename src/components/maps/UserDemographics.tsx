import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaGlobe, FaUsers, FaChartPie, FaExchangeAlt } from 'react-icons/fa';
import '../../styles/UserDemographics.css';
import Globe3D from '../maps/Globe3D';

type DemographicMode = 'ethnicity' | 'nationality';

interface DemographicData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserData {
  uid?: string;
  email?: string;
  ethnicity?: string;
  nationality?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date | number;
  lastLogin?: Date | number;
  // Add other specific fields as needed
  [key: string]: string | number | boolean | Date | undefined;
}

const UserDemographics: React.FC = () => {
  const [mode, setMode] = useState<DemographicMode>('ethnicity');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ethnicityData, setEthnicityData] = useState<DemographicData[]>([]);
  const [nationalityData, setNationalityData] = useState<DemographicData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Generate a color based on string (consistent colors for same strings)
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  // Process user data to extract demographic information
  const processDemographicData = (users: UserData[]) => {
    const ethnicityMap = new Map<string, number>();
    const nationalityMap = new Map<string, number>();
    
    users.forEach(user => {
      // Handle ethnicity data
      const ethnicity = user.ethnicity || 'Not Specified';
      ethnicityMap.set(ethnicity, (ethnicityMap.get(ethnicity) || 0) + 1);
      
      // Handle nationality data
      const nationality = user.nationality || 'Not Specified';
      nationalityMap.set(nationality, (nationalityMap.get(nationality) || 0) + 1);
    });
    
    // Convert ethnicity map to array of objects with percentages
    const ethnicityArray: DemographicData[] = Array.from(ethnicityMap.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / users.length) * 100,
        color: stringToColor(label)
      }))
      .sort((a, b) => b.count - a.count);
    
    // Convert nationality map to array of objects with percentages
    const nationalityArray: DemographicData[] = Array.from(nationalityMap.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / users.length) * 100,
        color: stringToColor(label)
      }))
      .sort((a, b) => b.count - a.count);
    
    setEthnicityData(ethnicityArray);
    setNationalityData(nationalityArray);
    setTotalUsers(users.length);
  };

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => doc.data());
        
        processDemographicData(userList);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user demographic data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Toggle between ethnicity and nationality modes
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'ethnicity' ? 'nationality' : 'ethnicity');
  };

  // Get current data based on mode
  const currentData = mode === 'ethnicity' ? ethnicityData : nationalityData;

  if (loading) {
    return (
      <div className="demographics-container">
        <div className="demographics-loading">
          <FaChartPie className="demographics-spinner" />
          <p>Loading demographic data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="demographics-container">
        <div className="demographics-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demographics-container">
      <div className="demographics-header">
        <h2>
          {mode === 'ethnicity' ? (
            <><FaUsers /> User Ethnicity</>
          ) : (
            <><FaGlobe /> User Nationality</>
          )}
        </h2>

        <button className="mode-toggle-btn" onClick={toggleMode}>
          <FaExchangeAlt /> Switch to {mode === 'ethnicity' ? 'Nationality' : 'Ethnicity'}
        </button>
      </div>

      <div className="demographics-summary">
        <p>Total Users: <strong>{totalUsers}</strong></p>
        <p>Unique {mode === 'ethnicity' ? 'Ethnicities' : 'Nationalities'}: <strong>{currentData.length}</strong></p>
        {mode === 'nationality' && (
          <div className="globe-container">
            <Globe3D width={200} height={200} />
          </div>
        )}
      </div>

      <div className="demographics-chart">
        <div className="pie-chart-container">
          <div className="pie-chart">
            {currentData.map((item, index) => (
              <div 
                key={item.label} 
                className="pie-segment" 
                style={{
                  backgroundColor: item.color,
                  transform: `rotate(${index > 0 ? 
                    currentData.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0) * 3.6 : 0}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${item.percentage > 50 ? '100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%' : `${50 + Math.sin(item.percentage * 0.036 * Math.PI) * 50}% ${50 - Math.cos(item.percentage * 0.036 * Math.PI) * 50}%`})`
                }}
                title={`${item.label}: ${item.count} users (${item.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>
        </div>

        <div className="demographics-legend">
          {currentData.map(item => (
            <div key={item.label} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: item.color }}></div>
              <div className="legend-label">{item.label}</div>
              <div className="legend-count">{item.count}</div>
              <div className="legend-percentage">{item.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDemographics; 