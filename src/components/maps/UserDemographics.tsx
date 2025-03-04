import React, { useState, useEffect, useRef } from 'react';
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

interface GlobePoint {
  lat: number;
  lng: number;
  color: string;
  size: number;
  label?: string;
  count?: number;
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

// Map of countries/regions to approximate coordinates
const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  'British': { lat: 51.5074, lng: -0.1278 }, // London
  'Pakistani': { lat: 33.6844, lng: 73.0479 }, // Islamabad
  'Indian': { lat: 28.6139, lng: 77.2090 }, // New Delhi
  'Chinese': { lat: 39.9042, lng: 116.4074 }, // Beijing
  'American': { lat: 38.9072, lng: -77.0369 }, // Washington DC
  'Canadian': { lat: 45.4215, lng: -75.6972 }, // Ottawa
  'Australian': { lat: -35.2809, lng: 149.1300 }, // Canberra
  'Nigerian': { lat: 9.0765, lng: 7.3986 }, // Abuja
  'South African': { lat: -25.7461, lng: 28.1881 }, // Pretoria
  'Brazilian': { lat: -15.7801, lng: -47.9292 }, // Brasilia
  'Mexican': { lat: 19.4326, lng: -99.1332 }, // Mexico City
  'Japanese': { lat: 35.6762, lng: 139.6503 }, // Tokyo
  'Korean': { lat: 37.5665, lng: 126.9780 }, // Seoul
  'Russian': { lat: 55.7558, lng: 37.6173 }, // Moscow
  'German': { lat: 52.5200, lng: 13.4050 }, // Berlin
  'French': { lat: 48.8566, lng: 2.3522 }, // Paris
  'Italian': { lat: 41.9028, lng: 12.4964 }, // Rome
  'Spanish': { lat: 40.4168, lng: -3.7038 }, // Madrid
  'Not Specified': { lat: 0, lng: 0 }, // Default
  'N/A': { lat: 0, lng: 0 }, // Default
};

const UserDemographics: React.FC = () => {
  const [mode, setMode] = useState<DemographicMode>('ethnicity');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ethnicityData, setEthnicityData] = useState<DemographicData[]>([]);
  const [nationalityData, setNationalityData] = useState<DemographicData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [globePoints, setGlobePoints] = useState<GlobePoint[]>([]);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  const pieChartRef = useRef<SVGSVGElement>(null);

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

    // Create globe points for both ethnicity and nationality
    updateGlobePoints(mode === 'ethnicity' ? ethnicityArray : nationalityArray);
  };

  // Update globe points based on current demographic data
  const updateGlobePoints = (data: DemographicData[]) => {
    const points = data.flatMap(item => {
      // Skip items without a valid mapping
      if (item.label === 'Not Specified' || item.label === 'N/A') {
        return [];
      }
      
      const coordinates = regionCoordinates[item.label] || 
                         { lat: Math.random() * 180 - 90, lng: Math.random() * 360 - 180 };
      
      // Create multiple points for items with higher counts (visual weight)
      const pointCount = Math.max(1, Math.ceil(item.percentage / 5));
      return Array(pointCount).fill(null).map(() => ({
        lat: coordinates.lat + (Math.random() - 0.5) * 5, // Add some randomness
        lng: coordinates.lng + (Math.random() - 0.5) * 5,
        color: item.color,
        size: 0.5 + (item.percentage / 20), // Size based on percentage
        label: item.label,
        count: item.count
      }));
    });
    
    setGlobePoints(points);
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

  // Update globe points when mode changes
  useEffect(() => {
    if (mode === 'ethnicity' && ethnicityData.length > 0) {
      updateGlobePoints(ethnicityData);
    } else if (mode === 'nationality' && nationalityData.length > 0) {
      updateGlobePoints(nationalityData);
    }
  }, [mode, ethnicityData, nationalityData]);

  // Toggle between ethnicity and nationality modes
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'ethnicity' ? 'nationality' : 'ethnicity');
  };

  // Get current data based on mode
  const currentData = mode === 'ethnicity' ? ethnicityData : nationalityData;

  // Handle mouse events for pie chart segments
  const handleMouseOver = (e: React.MouseEvent<SVGPathElement>, item: DemographicData) => {
    const svgRect = pieChartRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    setHighlightedSegment(item.label);
    
    const content = `${item.label}: ${item.count} users (${item.percentage.toFixed(1)}%)`;
    setTooltip({
      visible: true,
      content,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top - 30
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    const svgRect = pieChartRef.current?.getBoundingClientRect();
    if (!svgRect || !tooltip.visible) return;
    
    setTooltip({
      ...tooltip,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top - 30
    });
  };

  const handleMouseOut = () => {
    setHighlightedSegment(null);
    setTooltip({ ...tooltip, visible: false });
  };

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
      </div>

      <div className="visualization-container">
        <div className="globe-visualization">
          <h3>Global Distribution</h3>
          <div className="globe-wrapper">
            <Globe3D 
              width={300} 
              height={300} 
              className="demographics-globe" 
              customPoints={globePoints}
            />
          </div>
        </div>

        <div className="chart-visualization">
          <h3>Distribution Breakdown</h3>
          <div className="demographics-chart">
            <div className="pie-chart-container">
              <svg className="pie-chart" viewBox="0 0 100 100" ref={pieChartRef}>
                {currentData.map((item, index) => {
                  // Calculate the starting angle for this segment
                  const startAngle = currentData
                    .slice(0, index)
                    .reduce((acc, curr) => acc + curr.percentage, 0);
                  
                  // Calculate the ending angle for this segment
                  const endAngle = startAngle + item.percentage;
                  
                  // Convert percentages to degrees (0-360)
                  const startDegree = startAngle * 3.6;
                  const endDegree = endAngle * 3.6;
                  
                  // Calculate the large arc flag (1 if the slice is > 180 degrees)
                  const largeArcFlag = item.percentage > 50 ? 1 : 0;
                  
                  // Calculate the SVG path for the pie slice
                  const startRad = (startDegree - 90) * (Math.PI / 180); // -90 to start at top
                  const endRad = (endDegree - 90) * (Math.PI / 180);
                  
                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);
                  
                  const pathData = `M50,50 L${x1},${y1} A50,50 0 ${largeArcFlag},1 ${x2},${y2} Z`;
                  
                  const isHighlighted = highlightedSegment === item.label;
                  
                  return (
                    <path 
                      key={item.label} 
                      className={`pie-segment ${isHighlighted ? 'highlighted' : ''}`}
                      d={pathData}
                      fill={item.color}
                      data-label={item.label}
                      data-count={item.count}
                      data-percentage={item.percentage.toFixed(1)}
                      onMouseOver={(e) => handleMouseOver(e, item)}
                      onMouseMove={handleMouseMove}
                      onMouseOut={handleMouseOut}
                      style={{
                        transform: isHighlighted ? 'scale(1.05) translateY(-3px)' : 'none',
                        filter: isHighlighted ? 'brightness(1.2)' : 'none',
                        zIndex: isHighlighted ? 10 : 1,
                        strokeWidth: isHighlighted ? 2 : 1,
                        stroke: isHighlighted ? 'white' : '#111'
                      }}
                    >
                      <title>{`${item.label}: ${item.count} users (${item.percentage.toFixed(1)}%)`}</title>
                    </path>
                  );
                })}
                {/* Add a center circle for better appearance */}
                <circle cx="50" cy="50" r="15" fill="#111" />
              </svg>
              {tooltip.visible && (
                <div 
                  className="pie-chart-tooltip" 
                  style={{ 
                    opacity: 1, 
                    left: `${tooltip.x}px`, 
                    top: `${tooltip.y}px` 
                  }}
                >
                  {tooltip.content}
                </div>
              )}
            </div>

            <div className="demographics-legend">
              {currentData.map(item => {
                const isHighlighted = highlightedSegment === item.label;
                
                return (
                  <div 
                    key={item.label} 
                    className={`legend-item ${isHighlighted ? 'highlighted' : ''}`}
                    onMouseOver={() => setHighlightedSegment(item.label)}
                    onMouseOut={() => setHighlightedSegment(null)}
                  >
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <div className="legend-label">{item.label}</div>
                    <div className="legend-count">{item.count}</div>
                    <div className="legend-percentage">{item.percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDemographics; 