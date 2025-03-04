import React, { useEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import '../../styles/Globe3D.css';

interface GlobePoint {
  lat: number;
  lng: number;
  color: string;
  size: number;
  label?: string;
  count?: number;
}

interface CountryData {
  name: string;
  code: string;
  userCount: number;
  color: string;
}

// Define the GeoJSON feature type for countries
interface CountryFeature {
  type: string;
  properties: {
    NAME: string;
    ISO_A3: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

interface Globe3DProps {
  width?: number;
  height?: number;
  className?: string;
  customPoints?: GlobePoint[];
}

const Globe3D: React.FC<Globe3DProps> = ({ 
  width = 500, 
  height = 500,
  className = '',
  customPoints
}) => {
  // Use a more specific type for the ref
  const globeEl = useRef<GlobeMethods>(null!);
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [countryData, setCountryData] = useState<Record<string, CountryData>>({});
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sample data points representing different locations
  const samplePoints: GlobePoint[] = [
    { lat: 51.5074, lng: -0.1278, color: '#ffffff', size: 0.5 }, // London (white)
    { lat: 40.7128, lng: -74.0060, color: '#ffffff', size: 0.5 }, // New York (white)
    { lat: 48.8566, lng: 2.3522, color: '#ffffff', size: 0.5 }, // Paris (white)
    { lat: 25.2048, lng: 55.2708, color: '#ff0000', size: 0.8 }, // Dubai (red)
    { lat: 1.3521, lng: 103.8198, color: '#ff0000', size: 0.8 }, // Singapore (red)
    { lat: 35.6762, lng: 139.6503, color: '#ff0000', size: 0.8 }, // Tokyo (red)
    { lat: -33.8688, lng: 151.2093, color: '#00ff00', size: 0.8 }, // Sydney (green)
    { lat: 52.5200, lng: 13.4050, color: '#00ff00', size: 0.8 }, // Berlin (green)
    { lat: 37.7749, lng: -122.4194, color: '#00ff00', size: 0.8 }, // San Francisco (green)
    { lat: 30.0444, lng: 31.2357, color: '#0000ff', size: 0.8 }, // Cairo (blue)
    { lat: 19.0760, lng: 72.8777, color: '#0000ff', size: 0.8 }, // Mumbai (blue)
    { lat: -22.9068, lng: -43.1729, color: '#0000ff', size: 0.8 }, // Rio de Janeiro (blue)
  ];

  // Map nationality/ethnicity to country codes
  const nationalityToCountryCode: Record<string, string> = {
    'British': 'GBR',
    'Pakistani': 'PAK',
    'Indian': 'IND',
    'Chinese': 'CHN',
    'American': 'USA',
    'Canadian': 'CAN',
    'Australian': 'AUS',
    'Nigerian': 'NGA',
    'South African': 'ZAF',
    'Brazilian': 'BRA',
    'Mexican': 'MEX',
    'Japanese': 'JPN',
    'Korean': 'KOR',
    'Russian': 'RUS',
    'German': 'DEU',
    'French': 'FRA',
    'Italian': 'ITA',
    'Spanish': 'ESP',
  };

  // Fetch country GeoJSON data
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas/countries-110m.json')
      .then(res => res.json())
      .then(({ features }) => {
        setCountries(features as CountryFeature[]);
      });
  }, []);

  // Process custom points to create country data
  useEffect(() => {
    if (customPoints && customPoints.length > 0) {
      const countryStats: Record<string, CountryData> = {};
      
      customPoints.forEach(point => {
        if (point.label) {
          const countryCode = nationalityToCountryCode[point.label] || '';
          if (countryCode) {
            if (!countryStats[countryCode]) {
              countryStats[countryCode] = {
                name: point.label,
                code: countryCode,
                userCount: point.count || 0,
                color: point.color
              };
            } else {
              // If we have multiple points for the same country, add the counts
              countryStats[countryCode].userCount += point.count || 0;
            }
          }
        }
      });
      
      setCountryData(countryStats);
    }
  }, [customPoints]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Set points with animation
    const timer = setTimeout(() => {
      setPoints(customPoints || samplePoints);
    }, 1000);

    // Set auto-rotation after the component has mounted
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [customPoints]);

  // Update points when customPoints change
  useEffect(() => {
    if (customPoints) {
      setPoints(customPoints);
    }
  }, [customPoints]);

  // Get color for a country
  const getCountryColor = (countryCode: string) => {
    if (hoveredCountry === countryCode) {
      return 'rgba(255, 255, 255, 0.8)'; // Highlighted color
    }
    
    const country = countryData[countryCode];
    if (country) {
      // Apply opacity based on user count
      const opacity = Math.min(0.2 + (country.userCount / 20), 0.8);
      const baseColor = country.color.replace('#', '');
      return `rgba(${parseInt(baseColor.substr(0, 2), 16)}, ${parseInt(baseColor.substr(2, 2), 16)}, ${parseInt(baseColor.substr(4, 2), 16)}, ${opacity})`;
    }
    
    return 'rgba(40, 40, 40, 0.3)'; // Default color for countries with no data
  };

  return (
    <div className={`globe-3d-container ${className}`}>
      {hoveredCountry && countryData[hoveredCountry] && (
        <div className="country-tooltip">
          <h4>{countryData[hoveredCountry].name}</h4>
          <p>{countryData[hoveredCountry].userCount} users</p>
        </div>
      )}
      <Globe
        ref={globeEl}
        width={isMobile ? width * 0.8 : width}
        height={isMobile ? height * 0.8 : height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="#000011"
        atmosphereColor="rgba(25, 25, 100, 0.6)"
        atmosphereAltitude={0.15}
        
        // Points configuration
        pointsData={points}
        pointColor="color"
        pointAltitude={0}
        pointRadius="size"
        pointsMerge={true}
        
        // Countries configuration
        hexPolygonsData={countries}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonColor={(d: CountryFeature) => getCountryColor(d.properties.ISO_A3)}
        hexPolygonLabel={(d: CountryFeature) => {
          const countryCode = d.properties.ISO_A3;
          const country = countryData[countryCode];
          if (country) {
            return `<div class="country-label">
              <b>${country.name}</b><br/>
              ${country.userCount} users
            </div>`;
          }
          return `<div class="country-label">${d.properties.NAME}</div>`;
        }}
        onHexPolygonHover={(polygon: CountryFeature | null) => {
          if (polygon) {
            setHoveredCountry(polygon.properties.ISO_A3);
          } else {
            setHoveredCountry(null);
          }
        }}
        hexPolygonAltitude={0.01}
        
        showGraticules={false}
        showAtmosphere={true}
      />
    </div>
  );
};

export default Globe3D; 